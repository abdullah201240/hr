import {
  Controller,
  Get,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FestivalBonusService } from './festival-bonus.service';
import { UpdateFestivalBonusSettingsDto } from './dto/festival-bonus-settings.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Festival Bonus')
@ApiBearerAuth()
@Controller('festival-bonus')
export class FestivalBonusController {
  constructor(
    private readonly festivalBonusService: FestivalBonusService,
  ) {}

  @Get('settings')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get festival bonus rules/settings' })
  @ApiResponse({ status: 200, description: 'Current festival bonus settings' })
  async getSettings() {
    return this.festivalBonusService.getSettings();
  }

  @Patch('settings')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update festival bonus rules/settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Body() dto: UpdateFestivalBonusSettingsDto) {
    return this.festivalBonusService.updateSettings(dto);
  }
}
