import {
  Controller,
  Get,
  Post,
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
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto, SubmitCorrectionDto, AdminLogOverrideDto } from './dto/attendance.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('my-logs')
  @ApiOperation({ summary: 'Get monthly attendance logs for the logged-in employee' })
  @ApiResponse({ status: 200, description: 'Monthly attendance logs list' })
  async getMyLogs(
    @Req() req: any,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const employeeId = req.user.id;
    return this.attendanceService.getLogs(employeeId, Number(year), Number(month));
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record employee check-in' })
  @ApiResponse({ status: 200, description: 'Check-in recorded' })
  async checkIn(@Req() req: any, @Body() dto: CheckInDto) {
    const employeeId = req.user.id;
    return this.attendanceService.checkIn(employeeId, dto);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record employee check-out' })
  @ApiResponse({ status: 200, description: 'Check-out recorded' })
  async checkOut(@Req() req: any, @Body() dto: CheckOutDto) {
    const employeeId = req.user.id;
    return this.attendanceService.checkOut(employeeId, dto);
  }

  @Post('correction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an attendance correction request' })
  @ApiResponse({ status: 200, description: 'Correction request submitted' })
  async submitCorrection(@Req() req: any, @Body() dto: SubmitCorrectionDto) {
    const employeeId = req.user.id;
    return this.attendanceService.submitCorrection(employeeId, dto);
  }

  // ─── Admin / HR Routes ─────────────────────────────────────────────────────

  @Get('daily')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get daily attendance logs for all employees' })
  @ApiResponse({ status: 200, description: 'Daily logs for all employees' })
  async getDailyLogs(@Query('date') date: string) {
    return this.attendanceService.getDailyLogs(date);
  }

  @Get('range')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get attendance logs for all employees within a date range' })
  @ApiResponse({ status: 200, description: 'Attendance logs list' })
  async getRangeLogs(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.attendanceService.getRangeLogs(
      startDate,
      endDate,
      limit ? Number(limit) : undefined,
      cursor,
      departmentId,
      status,
      search,
    );
  }

  @Post('correction/approve/:id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending attendance correction request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Correction request approved' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  async approveCorrection(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.approveCorrection(id);
  }

  @Post('correction/reject/:id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending attendance correction request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Correction request rejected' })
  @ApiResponse({ status: 404, description: 'Log not found' })
  async rejectCorrection(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.rejectCorrection(id);
  }

  @Get('corrections/pending')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all pending attendance correction requests' })
  @ApiResponse({ status: 200, description: 'List of pending corrections' })
  async getPendingCorrections() {
    return this.attendanceService.getPendingCorrections();
  }

  @Post('admin/override')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Override or create attendance log for an employee manually' })
  @ApiResponse({ status: 200, description: 'Log overridden successfully' })
  async overrideAttendance(@Body() dto: AdminLogOverrideDto) {
    return this.attendanceService.overrideAttendance(dto);
  }
}
