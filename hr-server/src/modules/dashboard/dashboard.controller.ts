import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('executive-summary')
  @Permissions('dashboard:view_executive')
  @ApiOperation({ summary: 'Get executive dashboard summary (CEO-level analytics)' })
  @ApiResponse({ status: 200, description: 'Aggregated executive dashboard data' })
  async getExecutiveSummary() {
    return this.dashboardService.getExecutiveSummary();
  }
}
