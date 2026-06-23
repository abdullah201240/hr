import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { DisburseDto, UpdatePayslipAdjustmentsDto } from './dto/payroll.dto';
import { CreateSalaryAdjustmentDto, UpdateAdjustmentStatusDto, ApplyAdjustmentsToCycleDto } from './dto/salary-adjustment.dto';

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

  @Post('cycles/:monthKey/adjustments/:payslipId')
  @ApiOperation({ summary: 'Update draft payslip manual additions and deductions' })
  async updatePayslipAdjustments(
    @Param('monthKey') monthKey: string,
    @Param('payslipId') payslipId: string,
    @Body() dto: UpdatePayslipAdjustmentsDto,
  ) {
    return this.payrollService.updatePayslipAdjustments(monthKey, payslipId, dto);
  }

  @Post('cycles/:monthKey/process')
  @ApiOperation({ summary: 'Lock and process a payroll cycle' })
  async processCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.processCycle(monthKey);
  }

  @Post('cycles/:monthKey/unlock')
  @ApiOperation({ summary: 'Unlock a processed payroll cycle and revert to Draft status' })
  async unlockCycle(@Param('monthKey') monthKey: string) {
    return this.payrollService.unlockCycle(monthKey);
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

  @Get('my-payslips')
  @ApiOperation({ summary: 'Get all finalized/distributed payslips for the logged-in employee' })
  async getMyPayslips(@Req() req: any) {
    const employeeId = req.user.id;
    return this.payrollService.getMyPayslips(employeeId);
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

  // ─────────────────────────────────────────────────────────────
  // Cross-Month Salary Adjustments
  // ─────────────────────────────────────────────────────────────

  @Post('adjustments')
  @ApiOperation({ summary: 'Create a cross-month salary adjustment' })
  async createSalaryAdjustment(@Body() dto: CreateSalaryAdjustmentDto) {
    return this.payrollService.createSalaryAdjustment(dto);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'Get salary adjustments with optional filters' })
  async getSalaryAdjustments(
    @Query('employeeId') employeeId?: string,
    @Query('targetMonthKey') targetMonthKey?: string,
    @Query('appliedMonthKey') appliedMonthKey?: string,
    @Query('status') status?: string,
  ) {
    return this.payrollService.getSalaryAdjustments({
      employeeId,
      targetMonthKey,
      appliedMonthKey,
      status,
    });
  }

  @Patch('adjustments/:id/status')
  @ApiOperation({ summary: 'Update adjustment status' })
  async updateAdjustmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdjustmentStatusDto,
  ) {
    return this.payrollService.updateAdjustmentStatus(id, dto);
  }

  @Patch('adjustments/:id')
  @ApiOperation({ summary: 'Update a pending adjustment' })
  async updateAdjustment(
    @Param('id') id: string,
    @Body() dto: CreateSalaryAdjustmentDto,
  ) {
    return this.payrollService.updateAdjustment(id, dto);
  }

  @Delete('adjustments/:id')
  @ApiOperation({ summary: 'Delete a pending adjustment' })
  async deleteAdjustment(@Param('id') id: string) {
    return this.payrollService.deleteAdjustment(id);
  }

  @Post('adjustments/apply')
  @ApiOperation({ summary: 'Apply all pending adjustments to current month payroll' })
  async applyPendingAdjustments(@Body() dto: ApplyAdjustmentsToCycleDto) {
    return this.payrollService.applyPendingAdjustmentsToCycle(dto.appliedMonthKey);
  }

  @Get('adjustments/pending-summary')
  @ApiOperation({ summary: 'Get pending adjustments summary for a month' })
  async getPendingAdjustmentsSummary(@Query('appliedMonthKey') appliedMonthKey: string) {
    return this.payrollService.getPendingAdjustmentsSummary(appliedMonthKey);
  }
}

