import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FestivalBonusService } from './festival-bonus.service';
import { CreateFestivalBonusRuleDto, UpdateFestivalBonusRuleDto } from './dto/festival-bonus.dto';

@ApiTags('Festival Bonus Rules')
@ApiBearerAuth()
@Controller('festival-bonus-rules')
export class FestivalBonusController {
  constructor(private readonly service: FestivalBonusService) {}

  @Get()
  @ApiOperation({ summary: 'Get all festival bonus rules' })
  @ApiResponse({ status: 200, description: 'Return all rules' })
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new festival bonus rule' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  async create(@Body() dto: CreateFestivalBonusRuleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a festival bonus rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFestivalBonusRuleDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a festival bonus rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
