import {
  Controller,
  Get,
  Patch,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidentFundService } from './provident-fund.service';
import { UpdateProvidentFundSettingsDto } from './dto/provident-fund.dto';

@ApiTags('Provident Fund Settings')
@ApiBearerAuth()
@Controller('provident-fund-settings')
export class ProvidentFundController {
  constructor(private readonly service: ProvidentFundService) {}

  @Get()
  @ApiOperation({ summary: 'Get active provident fund settings' })
  @ApiResponse({ status: 200, description: 'Return settings' })
  async find() {
    return this.service.find();
  }

  @Patch()
  @ApiOperation({ summary: 'Update active provident fund settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async update(@Body() dto: UpdateProvidentFundSettingsDto) {
    return this.service.update(dto);
  }
}
