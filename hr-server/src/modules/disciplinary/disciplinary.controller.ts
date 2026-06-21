import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DisciplinaryService } from './disciplinary.service';
import { CreateDisciplinaryCaseDto, UpdateDisciplinaryCaseDto, DisciplinaryQueryDto } from './dto/disciplinary.dto';

@ApiTags('Disciplinary')
@ApiBearerAuth()
@Controller('disciplinary')
export class DisciplinaryController {
  constructor(private readonly disciplinaryService: DisciplinaryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all logged disciplinary cases' })
  async findAll(@Query() query: DisciplinaryQueryDto) {
    return this.disciplinaryService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Log a new disciplinary case' })
  async create(@Body() dto: CreateDisciplinaryCaseDto) {
    return this.disciplinaryService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update/resolve a disciplinary case' })
  async update(@Param('id') id: string, @Body() dto: UpdateDisciplinaryCaseDto) {
    return this.disciplinaryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a disciplinary case' })
  async delete(@Param('id') id: string) {
    return this.disciplinaryService.delete(id);
  }
}
