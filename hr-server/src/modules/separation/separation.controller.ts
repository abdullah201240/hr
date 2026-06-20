import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeparationService } from './separation.service';
import { CreateSeparationDto, UpdateSeparationDto, SeparationQueryDto } from './dto/separation.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Separation')
@ApiBearerAuth()
@Controller('separation')
export class SeparationController {
  constructor(private readonly separationService: SeparationService) {}

  @Get()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all separation/offboarding records' })
  async findAll(@Query() query: SeparationQueryDto) {
    return this.separationService.findAll(query);
  }

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Initiate offboarding exit process' })
  async create(@Body() dto: CreateSeparationDto) {
    return this.separationService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update separation clearance status' })
  async update(@Param('id') id: string, @Body() dto: UpdateSeparationDto) {
    return this.separationService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Delete a separation record' })
  async delete(@Param('id') id: string) {
    return this.separationService.delete(id);
  }
}
