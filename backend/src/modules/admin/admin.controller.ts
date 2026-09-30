import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminUserQueryDto, AuditLogQueryDto } from './dto/admin-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Executive Control Center & RBAC Governance')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Compute live high-level KPIs across sales, orders, atelier, and CRM' })
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('users')
  @ApiOperation({ summary: 'List and filter users/staff with role filters and search' })
  async getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Assign user role with RBAC privilege escalation checks and audit log' })
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: any,
  ) {
    return this.adminService.updateUserRole(id, dto, actor);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Toggle user account activation status with audit logging' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() actor: any,
  ) {
    return this.adminService.updateUserStatus(id, dto, actor);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Search and inspect system audit trail with actor details' })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('config-summary')
  @ApiOperation({ summary: 'Summary of configurable master business entities without code modification' })
  async getConfigSummary() {
    return this.adminService.getConfigSummary();
  }

  @Delete('entities/:table/:id')
  @ApiOperation({ summary: 'Safely deactivate or remove a master entity with mandatory audit log' })
  async deleteEntitySafely(
    @Param('table') table: 'products' | 'categories' | 'fabrics' | 'craft_options' | 'campaigns',
    @Param('id') id: string,
    @CurrentUser() actor: any,
    @Query('reason') reason?: string,
  ) {
    return this.adminService.deleteEntitySafely(table, id, actor, reason);
  }
}
