import { Controller, Get, Post, Patch, Delete, Body, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LettersService } from './letters.service';
import { CreateLetterDto, UpdateLetterStatusDto, LetterQueryDto, UpdateLetterDto } from './dto/letters.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Letters')
@ApiBearerAuth()
@Controller('letters')
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Post()
  @ApiOperation({ summary: 'Issue a new HR letter for an employee' })
  async create(@Req() req: any, @Body() dto: CreateLetterDto) {
    const creatorName = req.user?.fullNameEnglish || 'HR Admin';
    return this.lettersService.create(dto, creatorName);
  }

  @Get()
  @ApiOperation({ summary: 'Get all issued HR letters with filters & pagination' })
  async findAll(@Query() query: LetterQueryDto) {
    return this.lettersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific issued HR letter' })
  async findOne(@Param('id') id: string) {
    return this.lettersService.findOne(id);
  }

  @Patch(':id/status')
  @Permissions('letters:update')
  @ApiOperation({ summary: 'Update status of an issued HR letter' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateLetterStatusDto) {
    return this.lettersService.updateStatus(id, dto);
  }

  @Patch(':id')
  @Permissions('letters:update')
  @ApiOperation({ summary: 'Update/edit an issued HR letter' })
  async update(@Param('id') id: string, @Body() dto: UpdateLetterDto) {
    return this.lettersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/revoke an issued HR letter' })
  async delete(@Param('id') id: string) {
    return this.lettersService.delete(id);
  }
}
