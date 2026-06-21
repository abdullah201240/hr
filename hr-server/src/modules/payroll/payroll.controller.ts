import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { DisburseDto, UpdatePayslipBonusDto } from './dto/payroll.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('cycles/:monthKey')
  @ApiOperation({ summary: 'Get or initialize a payroll cycle for a given month' })
  async getOrCreateCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.getOrCreateCycle(monthKey);
  }

  @Post('cycles/:monthKey/sync')
  @ApiOperation({ summary: 'Synchronize and recalculate active draft cycle' })
  async syncDraftCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.syncDraftCycle(monthKey);
  }

  @Post('cycles/:monthKey/bonus/:payslipId')
  @ApiOperation({ summary: 'Update a specific employee payslip bonus' })
  async updatePayslipBonus(
    @Param('monthKey') monthKey: string,
    @Param('payslipId') payslipId: string,
    @Body() dto: UpdatePayslipBonusDto,
  ) {
    return this.payrollService.updatePayslipBonus(monthKey, payslipId, dto);
  }

  @Post('cycles/:monthKey/process')
  @ApiOperation({ summary: 'Lock and process a payroll cycle' })
  async processCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.processCycle(monthKey);
  }

  @Post('cycles/:monthKey/distribute')
  @ApiOperation({ summary: 'Distribute payslips for a processed payroll cycle' })
  async distributeCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.distributeCycle(monthKey);
  }

  @Post('disburse')
  @ApiOperation({ summary: 'Execute disbursement and record payment detail' })
  async recordDisbursement(@Body() dto: DisburseDto) {
    return this.payrollService.recordDisbursement(dto);
  }

  @Get('disbursements')
  @ApiOperation({ summary: 'Get all historical disbursements records' })
  async getDisbursements() {
    return this.payrollService.getDisbursements();
  }

  @Get('pf-balances')
  @ApiOperation({ summary: 'Get accumulated PF balances for all employees' })
  async getPfBalances() {
    return this.payrollService.getPfBalances();
  }

  @Get('cycles/:monthKey/status')
  @ApiOperation({ summary: 'Get payroll cycle processing status' })
  async getCycleStatus(@Param('monthKey') monthKey: string) {
    return this.payrollService.getCycleStatus(monthKey);
  }
}
