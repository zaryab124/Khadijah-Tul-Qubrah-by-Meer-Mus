import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verify system, PostgreSQL database, and Redis health status' })
  @ApiResponse({ status: 200, description: 'All core services healthy or partially degraded' })
  @ApiResponse({ status: 503, description: 'Critical backend infrastructure down' })
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const health = await this.healthService.checkHealth();
    if (health.status === 'error') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
