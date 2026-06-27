import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProvidentFundService } from './provident-fund.service';
import { UpdateProvidentFundSettingsDto } from './dto/provident-fund.dto';

@ApiTags('Provident Fund Settings')
@ApiBearerAuth()
@Controller('provident-fund-settings')
export class ProvidentFundSettingsController {
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

@ApiTags('Provident Fund')
@ApiBearerAuth()
@Controller('provident-fund')
export class ProvidentFundController {
  constructor(private readonly service: ProvidentFundService) {}

  @Get('ledger')
  @ApiOperation({ summary: 'Get transaction ledger logs' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  async getLedger(@Req() req: any, @Query('employeeId') employeeId?: string) {
    const userId = req.user.id;
    const permissions = req.user.permissions ? Array.from(req.user.permissions) : [];
    
    const isAdmin = permissions.includes('salary:read') || 
                    permissions.includes('payroll:read') ||
                    permissions.includes('salary:view_all') ||
                    permissions.includes('salary:view_team');

    const targetId = isAdmin ? employeeId : userId;
    return this.service.getLedger(targetId);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'Get withdrawal request logs' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  async getWithdrawals(@Req() req: any, @Query('employeeId') employeeId?: string) {
    const userId = req.user.id;
    const permissions = req.user.permissions ? Array.from(req.user.permissions) : [];
    
    const isAdmin = permissions.includes('salary:read') || 
                    permissions.includes('payroll:read') ||
                    permissions.includes('salary:view_all') ||
                    permissions.includes('salary:view_team');

    const targetId = isAdmin ? employeeId : userId;
    return this.service.getWithdrawals(targetId);
  }

  @Post('withdrawals')
  @ApiOperation({ summary: 'Apply for a PF withdrawal' })
  async applyForWithdrawal(
    @Req() req: any,
    @Body() dto: { amount: number; reason: string },
  ) {
    const employeeId = req.user.id;
    return this.service.createWithdrawalRequest(employeeId, Number(dto.amount), dto.reason);
  }

  @Post('withdrawals/:id/process')
  @ApiOperation({ summary: 'Approve or reject a withdrawal request' })
  async processWithdrawal(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { status: 'Approved' | 'Rejected'; remarks: string },
  ) {
    const actionByUserId = req.user.id;
    return this.service.processWithdrawalRequest(id, dto.status, dto.remarks, actionByUserId);
  }
}
