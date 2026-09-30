import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      responseTimeMs?: number;
      error?: string;
    };
    redis: {
      status: 'up' | 'down';
      responseTimeMs?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async checkHealth(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const environment = process.env.NODE_ENV || 'development';

    // 1. Check PostgreSQL Database
    let dbStatus: 'up' | 'down' = 'down';
    let dbResponseTimeMs = 0;
    let dbError: string | undefined;

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
      dbResponseTimeMs = Date.now() - dbStart;
    } catch (err: any) {
      dbStatus = 'down';
      dbError = err.message || 'Database connection error';
    }

    // 2. Check Redis
    let redisStatus: 'up' | 'down' = 'down';
    let redisResponseTimeMs = 0;
    let redisError: string | undefined;

    const redisStart = Date.now();
    try {
      const isHealthy = await this.redisService.isHealthy();
      if (isHealthy) {
        redisStatus = 'up';
        redisResponseTimeMs = Date.now() - redisStart;
      } else {
        redisStatus = 'down';
        redisError = 'Redis ping did not respond with PONG';
      }
    } catch (err: any) {
      redisStatus = 'down';
      redisError = err.message || 'Redis connection error';
    }

    const overallStatus: 'ok' | 'degraded' | 'error' =
      dbStatus === 'up' && redisStatus === 'up'
        ? 'ok'
        : dbStatus === 'up' || redisStatus === 'up'
        ? 'degraded'
        : 'error';

    return {
      status: overallStatus,
      timestamp,
      uptime,
      environment,
      services: {
        database: {
          status: dbStatus,
          responseTimeMs: dbResponseTimeMs,
          error: dbError,
        },
        redis: {
          status: redisStatus,
          responseTimeMs: redisResponseTimeMs,
          error: redisError,
        },
      },
    };
  }
}
