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
  UpdateLeaveApplicationDto,
} from './dto/create-leave-application.dto';
import { LeaveApplicationQueryDto } from './dto/leave-application-query.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Leave Applications')
@ApiBearerAuth()
@Controller('leave-applications')
export class LeaveApplicationController {
  constructor(private readonly leaveApplicationService: LeaveApplicationService) {}

  // ─── Apply for Leave (queued) ─────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Apply for a new leave request (queued via BullMQ)' })
  @ApiResponse({ status: 202, description: 'Leave application job enqueued — poll /jobs/:jobId/status for result' })
  async create(@Req() req: any, @Body() dto: CreateLeaveApplicationDto) {
    const employeeId = req.user.id;
    return this.leaveApplicationService.createAsync(employeeId, dto);
  }

  // ─── Job Status Polling ──────────────────────────────────────────────────
  @Get('jobs/:jobId/status')
  @ApiOperation({ summary: 'Poll leave application job status' })
  @ApiParam({ name: 'jobId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Job status: queued | active | completed | failed | not_found' })
  async getJobStatus(@Param('jobId') jobId: string) {
    return this.leaveApplicationService.getJobStatus(jobId);
  }

  // ─── Get Leave Balances ───────────────────────────────────────────────────
  @Get('balances')
  @ApiOperation({ summary: 'Get leave balances for the logged-in employee' })
  @ApiResponse({ status: 200, description: 'List of leave balances' })
  async getMyBalances(
    @Req() req: any,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const employeeId = req.user.id;
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveApplicationService.getLeaveBalances(employeeId, currentYear, month);
  }

  // ─── Admin route: Get Leave Balances of a specific employee ────────────────
  @Get('balances/:employeeId')
  @Permissions('leave:view_all')
  @ApiOperation({ summary: 'Get leave balances for a specific employee' })
  @ApiParam({ name: 'employeeId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of leave balances' })
  async getEmployeeBalances(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const currentYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveApplicationService.getLeaveBalances(employeeId, currentYear, month);
  }

  // ─── List Leave Applications ──────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List leave applications (Employees see own, Admins see all)' })
  @ApiResponse({ status: 200, description: 'List of leave applications' })
  async findAll(@Req() req: any, @Query() query: LeaveApplicationQueryDto) {
    const employeeId = req.user.id;

    // Standard employees should only see their own leave requests
    // The guard enforces permissions; if user lacks leave:view_all/view_team, scope to own
    if (!req.user.customRoleId) {
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
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.leaveApplicationService.findOne(id, req.user);
  }

  // ─── Edit/Resubmit Leave Application (queued) ─────────────────────────────
  @Patch(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Edit or resubmit a leave application (queued via BullMQ)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 202, description: 'Leave application update job enqueued' })
  @ApiResponse({ status: 404, description: 'Leave application not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateLeaveApplicationDto,
  ) {
    const employeeId = req.user.id;
    return this.leaveApplicationService.updateAsync(id, employeeId, dto);
  }

  // ─── Process Leave (Approve/Reject) ───────────────────────────────────────
  @Patch(':id/status')
  @Permissions('leave:approve')
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
    return this.leaveApplicationService.updateStatus(id, req.user, dto);
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
    return this.leaveApplicationService.cancel(id, employeeId);
  }
}
