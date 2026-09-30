import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: any;
  let redisService: any;

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn(),
    };
    redisService = {
      isHealthy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should report status "ok" when both PostgreSQL and Redis are responsive', async () => {
    prismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    redisService.isHealthy.mockResolvedValue(true);

    const result = await service.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('up');
  });

  it('should report status "degraded" when database is up but Redis is down', async () => {
    prismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    redisService.isHealthy.mockResolvedValue(false);

    const result = await service.checkHealth();
    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('up');
    expect(result.services.redis.status).toBe('down');
  });

  it('should report status "error" when both database and Redis are down', async () => {
    prismaService.$queryRaw.mockRejectedValue(new Error('Connection refused'));
    redisService.isHealthy.mockResolvedValue(false);

    const result = await service.checkHealth();
    expect(result.status).toBe('error');
    expect(result.services.database.status).toBe('down');
    expect(result.services.redis.status).toBe('down');
  });
});
