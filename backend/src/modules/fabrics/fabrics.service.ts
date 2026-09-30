import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFabricDto } from './dto/create-fabric.dto';

@Injectable()
export class FabricsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeUnavailable = false) {
    return this.prisma.fabric.findMany({
      where: includeUnavailable ? undefined : { isAvailable: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const fabric = await this.prisma.fabric.findUnique({ where: { id } });
    if (!fabric) {
      throw new NotFoundException(`Fabric with ID ${id} not found`);
    }
    return fabric;
  }

  async create(dto: CreateFabricDto) {
    return this.prisma.fabric.create({
      data: dto,
    });
  }

  async update(id: string, dto: Partial<CreateFabricDto>) {
    await this.findById(id);
    return this.prisma.fabric.update({
      where: { id },
      data: dto,
    });
  }
}
