import { Test, TestingModule } from '@nestjs/testing';
import { FabricsService } from './fabrics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FabricsService', () => {
  let service: FabricsService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      fabric: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FabricsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<FabricsService>(FabricsService);
  });

  it('should list available fabrics and pricing per meter', async () => {
    prismaService.fabric.findMany.mockResolvedValue([
      { id: 'fab-1', name: 'Micro Velvet 9000', basePricePerMeter: 6500, isAvailable: true },
    ]);

    const result = await service.findAll(false);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Micro Velvet 9000');
  });

  it('should allow admin to update per-meter price', async () => {
    prismaService.fabric.findUnique.mockResolvedValue({ id: 'fab-1', name: 'Micro Velvet 9000' });
    prismaService.fabric.update.mockResolvedValue({ id: 'fab-1', basePricePerMeter: 7000 });

    const result = await service.update('fab-1', { basePricePerMeter: 7000 });
    expect(result.basePricePerMeter).toBe(7000);
  });
});
