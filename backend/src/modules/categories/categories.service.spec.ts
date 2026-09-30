import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should list active categories for public storefront', async () => {
    prismaService.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Haute Couture Bridal', slug: 'haute-couture-bridal', isActive: true },
    ]);

    const result = await service.findAll(false);
    expect(result.length).toBe(1);
    expect(result[0].slug).toBe('haute-couture-bridal');
  });

  it('should create new category with auto-generated slug', async () => {
    prismaService.category.findUnique.mockResolvedValue(null);
    prismaService.category.create.mockResolvedValue({
      id: 'cat-new',
      name: 'Luxury Velvets',
      slug: 'luxury-velvets',
    });

    const result = await service.create({ name: 'Luxury Velvets' });
    expect(result.slug).toBe('luxury-velvets');
  });
});
