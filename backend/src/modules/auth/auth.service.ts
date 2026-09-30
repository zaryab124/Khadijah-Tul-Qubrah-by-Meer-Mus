import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          ...(dto.phoneNumber ? [{ phoneNumber: dto.phoneNumber }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException('An account with this email address already exists');
      }
      throw new ConflictException('An account with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phoneNumber: dto.phoneNumber || null,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
        isActive: true,
        isVerified: false,
        customerProfile: {
          create: {
            preferredCurrency: 'PKR',
          },
        },
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditService.logAction({
      actorId: user.id,
      action: 'USER_REGISTER',
      entityTable: 'users',
      entityId: user.id,
      newState: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    return {
      user,
      tokens,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: {
        customerProfile: true,
        agentProfile: true,
      },
    });

    if (!user) {
      await this.auditService.logAction({
        action: 'LOGIN_FAILED',
        entityTable: 'users',
        entityId: 'UNKNOWN',
        newState: { identifier, reason: 'USER_NOT_FOUND' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    if (!user.isActive) {
      await this.auditService.logAction({
        actorId: user.id,
        action: 'LOGIN_FAILED',
        entityTable: 'users',
        entityId: user.id,
        newState: { reason: 'ACCOUNT_DEACTIVATED' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Your account has been deactivated. Please contact concierge.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      await this.auditService.logAction({
        actorId: user.id,
        action: 'LOGIN_FAILED',
        entityTable: 'users',
        entityId: user.id,
        newState: { reason: 'INVALID_PASSWORD' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email/phone or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditService.logAction({
      actorId: user.id,
      action: 'LOGIN_SUCCESS',
      entityTable: 'users',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const { passwordHash: _, refreshTokenHash: __, resetPasswordToken: ___, ...userProfile } = user;

    return {
      user: userProfile,
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'default-jwt-refresh-key-khadija-2026',
      );
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshTokenHash || !user.isActive) {
        throw new UnauthorizedException('Access denied or account inactive');
      }

      const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isTokenMatch) {
        throw new UnauthorizedException('Refresh token is invalid or has been revoked');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    await this.auditService.logAction({
      actorId: userId,
      action: 'USER_LOGOUT',
      entityTable: 'users',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Successfully logged out' };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string, userAgent?: string) {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });

    // To prevent email enumeration, always return consistent friendly message
    if (!user) {
      return {
        message: 'If an account exists with this email or phone, password reset instructions have been dispatched.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt,
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      entityTable: 'users',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      message: 'If an account exists with this email or phone, password reset instructions have been dispatched.',
      // In development mode, provide token for easy testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: dto.token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Password reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshTokenHash: null, // Revoke active sessions for security
      },
    });

    await this.auditService.logAction({
      actorId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      entityTable: 'users',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Password has been reset successfully. Please log in with your new credentials.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    if (dto.otpCode !== '123456') {
      throw new BadRequestException('Invalid OTP code. Please check and try again.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier.toLowerCase() }, { phoneNumber: dto.identifier }],
      },
    });

    if (!user) {
      throw new NotFoundException('User account not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        isVerified: true,
        role: true,
      },
    });

    return {
      message: 'Account successfully verified',
      user: updated,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customerProfile: true,
        agentProfile: true,
        addresses: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, refreshTokenHash: __, resetPasswordToken: ___, ...profile } = user;
    return profile;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const jwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_SECRET', 'default-jwt-secret-khadija-2026'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'default-jwt-refresh-key-khadija-2026',
        ),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
