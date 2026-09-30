import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSizeChartDto } from './dto/create-size-chart.dto';

@Injectable()
export class SizeChartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sizeChart.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const chart = await this.prisma.sizeChart.findUnique({
      where: { id },
      include: { category: true, products: true },
    });
    if (!chart) {
      throw new NotFoundException(`Size chart with ID ${id} not found`);
    }
    return chart;
  }

  async create(dto: CreateSizeChartDto) {
    return this.prisma.sizeChart.create({
      data: {
        categoryId: dto.categoryId || null,
        title: dto.title,
        unit: dto.unit || 'INCHES',
        measurementsMatrix: dto.measurementsMatrix,
        notes: dto.notes || null,
      },
    });
  }
}
