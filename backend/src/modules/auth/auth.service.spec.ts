import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let configService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('test-jwt-token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string, defaultValue: any) => defaultValue),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('valid login', () => {
    it('should successfully authenticate with valid credentials and log audit action', async () => {
      const hashed = await bcrypt.hash('ValidPassword123!', 10);
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'sarah.customer@example.com',
        passwordHash: hashed,
        firstName: 'Sarah',
        lastName: 'Khan',
        role: UserRole.CUSTOMER,
        isActive: true,
      });
      prismaService.user.update.mockResolvedValue({});

      const result = await service.login({
        identifier: 'sarah.customer@example.com',
        password: 'ValidPassword123!',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toEqual('sarah.customer@example.com');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_SUCCESS', actorId: 'user-uuid-1' }),
      );
    });
  });

  describe('invalid login', () => {
    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({
          identifier: 'unknown@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED' }),
      );
    });

    it('should throw UnauthorizedException when password hash does not match', async () => {
      const hashed = await bcrypt.hash('CorrectPassword123!', 10);
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'sarah@example.com',
        passwordHash: hashed,
        isActive: true,
      });

      await expect(
        service.login({
          identifier: 'sarah@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN_FAILED' }),
      );
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      const hashed = await bcrypt.hash('Password123!', 10);
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-deactivated',
        email: 'blocked@example.com',
        passwordHash: hashed,
        isActive: false,
      });

      await expect(
        service.login({
          identifier: 'blocked@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh token & expired token', () => {
    it('should issue new tokens when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-uuid-1' });
      const hashedRefresh = await bcrypt.hash('valid-refresh-token', 10);

      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'sarah@example.com',
        role: UserRole.CUSTOMER,
        refreshTokenHash: hashedRefresh,
        isActive: true,
      });
      prismaService.user.update.mockResolvedValue({});

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is expired or invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgot password and reset password', () => {
    it('should initiate forgot password and store reset token', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'sarah@example.com',
      });
      prismaService.user.update.mockResolvedValue({});

      const result = await service.forgotPassword({ identifier: 'sarah@example.com' });
      expect(result).toHaveProperty('message');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpires: expect.any(Date),
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_REQUESTED' }),
      );
    });

    it('should reset password with valid token and hash new password', async () => {
      prismaService.user.findFirst.mockResolvedValue({
        id: 'user-uuid-1',
        resetPasswordToken: 'valid-token',
        resetPasswordExpires: new Date(Date.now() + 100000),
      });
      prismaService.user.update.mockResolvedValue({});

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewSecurePassword2026!',
      });

      expect(result.message).toContain('Password has been reset successfully');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
            resetPasswordToken: null,
            resetPasswordExpires: null,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PASSWORD_RESET_SUCCESS' }),
      );
    });

    it('should throw BadRequestException if reset token is invalid or expired', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid-or-expired-token',
          newPassword: 'NewSecurePassword2026!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
