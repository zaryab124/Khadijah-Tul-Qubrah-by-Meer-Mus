import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColourDto } from './dto/create-colour.dto';

@Injectable()
export class ColoursService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.colour.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const colour = await this.prisma.colour.findUnique({ where: { id } });
    if (!colour) {
      throw new NotFoundException(`Colour with ID ${id} not found`);
    }
    return colour;
  }

  async create(dto: CreateColourDto) {
    return this.prisma.colour.create({
      data: dto,
    });
  }
}
