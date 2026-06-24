import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FestivalBonusService } from './festival-bonus.service';
import { UpdateFestivalBonusSettingsDto } from './dto/festival-bonus-settings.dto';
import { CreateFestivalBonusCycleDto } from './dto/create-cycle.dto';
import { UpdateFestivalBonusPayoutDto } from './dto/update-payout.dto';
import { DisburseFestivalBonusCycleDto } from './dto/disburse-cycle.dto';
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

  @Get('cycles')
  @Permissions('payroll:read')
  @ApiOperation({ summary: 'Get all festival bonus cycles' })
  async getCycles() {
    return this.festivalBonusService.getCycles();
  }

  @Post('cycles')
  @Permissions('payroll:process')
  @ApiOperation({ summary: 'Create and process a new festival bonus cycle' })
  async createCycle(@Body() dto: CreateFestivalBonusCycleDto) {
    return this.festivalBonusService.createCycle(dto);
  }

  @Get('cycles/:id')
  @Permissions('payroll:read')
  @ApiOperation({ summary: 'Get details of a specific festival bonus cycle' })
  async getCycleById(@Param('id', ParseUUIDPipe) id: string) {
    return this.festivalBonusService.getCycleById(id);
  }

  @Post('cycles/:id/recalculate')
  @Permissions('payroll:process')
  @ApiOperation({ summary: 'Recalculate a draft cycle' })
  async recalculateCycle(@Param('id', ParseUUIDPipe) id: string) {
    return this.festivalBonusService.recalculateCycle(id);
  }

  @Patch('payouts/:payoutId')
  @Permissions('payroll:process')
  @ApiOperation({ summary: 'Update a specific payout adjustment' })
  async updatePayout(
    @Param('payoutId', ParseUUIDPipe) payoutId: string,
    @Body() dto: UpdateFestivalBonusPayoutDto,
  ) {
    return this.festivalBonusService.updatePayout(payoutId, dto);
  }

  @Post('cycles/:id/approve')
  @Permissions('payroll:process')
  @ApiOperation({ summary: 'Approve the cycle register' })
  async approveCycle(@Param('id', ParseUUIDPipe) id: string) {
    return this.festivalBonusService.approveCycle(id);
  }

  @Post('cycles/:id/disburse')
  @Permissions('payroll:disburse')
  @ApiOperation({ summary: 'Mark cycle as disbursed and pay employees' })
  async disburseCycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisburseFestivalBonusCycleDto,
  ) {
    return this.festivalBonusService.disburseCycle(id, dto);
  }

  @Delete('cycles/:id')
  @Permissions('payroll:process')
  @ApiOperation({ summary: 'Delete a draft cycle' })
  async deleteCycle(@Param('id', ParseUUIDPipe) id: string) {
    return this.festivalBonusService.deleteCycle(id);
  }
}
