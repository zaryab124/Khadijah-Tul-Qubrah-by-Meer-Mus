import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BrandService } from './brand.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BrandService', () => {
  let service: BrandService;
  let prismaService: any;
  let configService: any;

  beforeEach(async () => {
    prismaService = {
      brand: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      brandAsset: {
        create: jest.fn(),
      },
    };

    configService = {
      get: jest.fn((key: string, defaultValue: any) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandService,
        { provide: PrismaService, useValue: prismaService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<BrandService>(BrandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return existing brand config if found in database', async () => {
    const mockBrand = {
      id: 'brand-1',
      officialName: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
      primaryDisplay: 'KHADIJA-TUL-QUBRAH',
      secondarySignature: 'BY Meer&Mus',
      primaryColor: '#072A20',
      secondaryColor: '#C5A059',
      assets: [],
    };
    prismaService.brand.findFirst.mockResolvedValue(mockBrand);

    const result = await service.getBrandConfig();
    expect(result).toEqual(mockBrand);
    expect(result.primaryColor).toEqual('#072A20');
  });

  it('should fallback to creating brand config if none exists', async () => {
    prismaService.brand.findFirst.mockResolvedValue(null);
    const createdBrand = {
      id: 'new-brand-1',
      officialName: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
      primaryDisplay: 'KHADIJA-TUL-QUBRAH',
      secondarySignature: 'BY Meer&Mus',
      primaryColor: '#072A20',
      secondaryColor: '#C5A059',
      assets: [],
    };
    prismaService.brand.create.mockResolvedValue(createdBrand);

    const result = await service.getBrandConfig();
    expect(result).toEqual(createdBrand);
    expect(prismaService.brand.create).toHaveBeenCalled();
  });
});
