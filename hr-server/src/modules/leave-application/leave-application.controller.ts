import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Req,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LeaveApplicationService } from './leave-application.service';
import {
  CreateLeaveApplicationDto,
  UpdateLeaveApplicationStatusDto,
} from './dto/create-leave-application.dto';
import { LeaveApplicationQueryDto } from './dto/leave-application-query.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Leave Applications')
@ApiBearerAuth()
@Controller('leave-applications')
export class LeaveApplicationController {
  constructor(private readonly leaveApplicationService: LeaveApplicationService) {}

  // ─── Apply for Leave ──────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apply for a new leave request' })
  @ApiResponse({ status: 201, description: 'Leave application submitted successfully' })
  async create(@Req() req: any, @Body() dto: CreateLeaveApplicationDto) {
    const employeeId = req.user.id;
    return this.leaveApplicationService.create(employeeId, dto);
  }

  // ─── Get Leave Balances ───────────────────────────────────────────────────
  @Get('balances')
  @ApiOperation({ summary: 'Get leave balances for the logged-in employee' })
  @ApiResponse({ status: 200, description: 'List of leave balances' })
  async getMyBalances(@Req() req: any, @Query('year') year?: number) {
    const employeeId = req.user.id;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveApplicationService.getLeaveBalances(employeeId, currentYear);
  }

  // ─── Admin route: Get Leave Balances of a specific employee ────────────────
  @Get('balances/:employeeId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get leave balances for a specific employee' })
  @ApiParam({ name: 'employeeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of leave balances' })
  async getEmployeeBalances(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('year') year?: number,
  ) {
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveApplicationService.getLeaveBalances(employeeId, currentYear);
  }

  // ─── List Leave Applications ──────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List leave applications (Employees see own, Admins see all)' })
  @ApiResponse({ status: 200, description: 'List of leave applications' })
  async findAll(@Req() req: any, @Query() query: LeaveApplicationQueryDto) {
    const role = req.user.role;
    const employeeId = req.user.id;

    // Standard employees should only see their own leave requests
    if (role !== 'admin' && role !== 'hr') {
      query.employeeId = employeeId;
    }

    return this.leaveApplicationService.findAll(query);
  }

  // ─── Get Details ──────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get leave application details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave application details' })
  @ApiResponse({ status: 404, description: 'Leave application not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveApplicationService.findOne(id);
  }

  // ─── Process Leave (Approve/Reject) ───────────────────────────────────────
  @Patch(':id/status')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a leave application' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave status updated' })
  @ApiResponse({ status: 404, description: 'Leave application not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateLeaveApplicationStatusDto,
  ) {
    const approvedById = req.user.id;
    return this.leaveApplicationService.updateStatus(id, approvedById, dto);
  }

  // ─── Cancel Leave ─────────────────────────────────────────────────────────
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or approved leave application' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave application cancelled' })
  @ApiResponse({ status: 404, description: 'Leave application not found' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const employeeId = req.user.id;
    const role = req.user.role;
    return this.leaveApplicationService.cancel(id, employeeId, role);
  }
}
