import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ColoursService } from './colours.service';
import { CreateColourDto } from './dto/create-colour.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Colours')
@Controller('colours')
export class ColoursController {
  constructor(private readonly coloursService: ColoursService) {}

  @Get()
  @ApiOperation({ summary: 'List all available colours in the luxury palette' })
  async findAll() {
    return this.coloursService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get colour details by ID' })
  async findById(@Param('id') id: string) {
    return this.coloursService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DESIGNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new colour to the brand palette (Admin/Designer)' })
  async create(@Body() dto: CreateColourDto) {
    return this.coloursService.create(dto);
  }
}
