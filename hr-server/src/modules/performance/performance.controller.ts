import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import {
  CreateKpiDto,
  UpdateKpiScoresDto,
  CreateCycleDto,
  UpdateCycleStatusDto,
  SubmitSelfAppraisalDto,
  SubmitManagerAppraisalDto
} from './dto/performance.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // --- Cycles Endpoints ---

  @Get('cycles')
  @Roles('admin', 'hr', 'employee')
  @ApiOperation({ summary: 'Get all performance appraisal cycles' })
  async findAllCycles() {
    return this.performanceService.findAllCycles();
  }

  @Get('cycles/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get details of a specific appraisal cycle' })
  async findCycleById(@Param('id') id: string) {
    return this.performanceService.findCycleById(id);
  }

  @Post('cycles')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a new appraisal cycle' })
  async createCycle(@Body() dto: CreateCycleDto) {
    return this.performanceService.createCycle(dto);
  }

  @Patch('cycles/:id/status')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update appraisal cycle status' })
  async updateCycleStatus(@Param('id') id: string, @Body() dto: UpdateCycleStatusDto) {
    return this.performanceService.updateCycleStatus(id, dto);
  }

  // --- KPI Target Setup Endpoints ---

  @Get()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all KPIs grouped by employeeId' })
  async findAll() {
    return this.performanceService.findAll();
  }

  @Get('employee/:employeeId')
  @Roles('admin', 'hr', 'employee')
  @ApiOperation({ summary: 'Get all target KPIs for an employee, seeding defaults if none exist' })
  async getEmployeeKpis(
    @Param('employeeId') employeeId: string,
    @Query('cycleId') cycleId?: string,
  ) {
    return this.performanceService.getEmployeeKpis(employeeId, cycleId);
  }

  @Post('kpi')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Add a new target KPI' })
  async createKpi(@Body() dto: CreateKpiDto) {
    return this.performanceService.createKpi(dto);
  }

  @Delete('kpi/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Remove a target KPI' })
  async deleteKpi(@Param('id') id: string) {
    return this.performanceService.deleteKpi(id);
  }

  @Patch('employee/:employeeId/scores')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Save achievement scores for employee KPIs' })
  async saveScores(@Param('employeeId') employeeId: string, @Body() dto: UpdateKpiScoresDto) {
    return this.performanceService.saveScores(employeeId, dto);
  }

  // --- Multi-Source Appraisals Endpoints ---

  @Get('appraisals/cycle/:cycleId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all employee appraisal records for a specific cycle' })
  async getCycleAppraisals(@Param('cycleId') cycleId: string) {
    return this.performanceService.getCycleAppraisals(cycleId);
  }

  @Get('appraisals/employee/:employeeId/cycle/:cycleId')
  @Roles('admin', 'hr', 'employee')
  @ApiOperation({ summary: 'Get or initialize employee appraisal status for a specific cycle' })
  async getEmployeeAppraisalContext(
    @Param('employeeId') employeeId: string,
    @Param('cycleId') cycleId: string,
  ) {
    return this.performanceService.getEmployeeAppraisalContext(employeeId, cycleId);
  }

  @Post('appraisals/:id/self')
  @Roles('admin', 'hr', 'employee')
  @ApiOperation({ summary: 'Submit employee self-appraisal ratings and feedback' })
  async submitSelfAppraisal(
    @Param('id') id: string,
    @Body() dto: SubmitSelfAppraisalDto,
  ) {
    return this.performanceService.submitSelfAppraisal(id, dto);
  }

  @Post('appraisals/:id/manager')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Submit manager appraisal ratings and feedback for employee' })
  async submitManagerAppraisal(
    @Param('id') id: string,
    @Body() dto: SubmitManagerAppraisalDto,
  ) {
    return this.performanceService.submitManagerAppraisal(id, dto);
  }
}
