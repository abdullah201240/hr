import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CreateKpiDto, UpdateKpiScoresDto } from './dto/performance.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Performance')
@ApiBearerAuth()
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all KPIs grouped by employeeId' })
  async findAll() {
    return this.performanceService.findAll();
  }

  @Get('employee/:employeeId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all target KPIs for an employee, seeding defaults if none exist' })
  async getEmployeeKpis(@Param('employeeId') employeeId: string) {
    return this.performanceService.getEmployeeKpis(employeeId);
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
}
