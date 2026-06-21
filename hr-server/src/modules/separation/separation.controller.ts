import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeparationService } from './separation.service';
import { CreateSeparationDto, UpdateSeparationDto, SeparationQueryDto } from './dto/separation.dto';
import { CalculateSettlementDto, UpdateSettlementStatusDto } from './dto/settlement.dto';

@ApiTags('Separation')
@ApiBearerAuth()
@Controller('separation')
export class SeparationController {
  constructor(private readonly separationService: SeparationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all separation/offboarding records' })
  async findAll(@Query() query: SeparationQueryDto) {
    return this.separationService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Initiate offboarding exit process' })
  async create(@Body() dto: CreateSeparationDto) {
    return this.separationService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update separation clearance status' })
  async update(@Param('id') id: string, @Body() dto: UpdateSeparationDto) {
    return this.separationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a separation record' })
  async delete(@Param('id') id: string) {
    return this.separationService.delete(id);
  }

  @Get(':id/settlement')
  @ApiOperation({ summary: 'Get or calculate draft settlement' })
  async getSettlement(@Param('id') id: string) {
    return this.separationService.getSettlement(id);
  }

  @Post(':id/settlement')
  @ApiOperation({ summary: 'Save or update final settlement' })
  async saveSettlement(@Param('id') id: string, @Body() dto: CalculateSettlementDto) {
    return this.separationService.saveOrUpdateSettlement(id, dto);
  }

  @Patch(':id/settlement/status')
  @ApiOperation({ summary: 'Update final settlement status' })
  async updateSettlementStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSettlementStatusDto,
  ) {
    return this.separationService.updateSettlementStatus(id, dto.status, dto.paymentDetails);
  }
}

