import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCraftOptionDto } from './dto/create-craft-option.dto';

@Injectable()
export class CraftOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.craftOption.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const craft = await this.prisma.craftOption.findUnique({ where: { id } });
    if (!craft) {
      throw new NotFoundException(`Craft option with ID ${id} not found`);
    }
    return craft;
  }

  async create(dto: CreateCraftOptionDto) {
    return this.prisma.craftOption.create({
      data: dto,
    });
  }

  async update(id: string, dto: Partial<CreateCraftOptionDto>) {
    await this.findById(id);
    return this.prisma.craftOption.update({
      where: { id },
      data: dto,
    });
  }
}
