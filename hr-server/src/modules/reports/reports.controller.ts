import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary-kpis')
  @ApiOperation({ summary: 'Get summary KPIs (headcount, attendance percentage, compliance rating)' })
  async getSummaryKpis() {
    return this.reportsService.getSummaryKpis();
  }

  @Get('workforce-headcount')
  @ApiOperation({ summary: 'Get workforce headcount diversity and breakdown' })
  async getWorkforceHeadcount() {
    return this.reportsService.getWorkforceHeadcount();
  }

  @Get('attendance-summary')
  @ApiOperation({ summary: 'Get attendance log summaries for a date range' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Format YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'Format YYYY-MM-DD' })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  async getAttendanceSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getAttendanceSummary(startDate, endDate, departmentId);
  }

  @Get('leave-utilization')
  @ApiOperation({ summary: 'Get leave utilization and remaining balances per employee' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  async getLeaveUtilization(
    @Query('year') year: number,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getLeaveUtilization(Number(year), departmentId);
  }

  @Get('payroll-cost')
  @ApiOperation({ summary: 'Get monthly payroll cost rollups grouped by department' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'departmentId', required: false, type: String })
  async getPayrollCost(
    @Query('year') year: number,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getPayrollCost(Number(year), departmentId);
  }
}
