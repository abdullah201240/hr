import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceSettingsService } from './attendance-settings.service';
import {
  UpdateAttendanceSettingsDto,
  CreateHolidayDto,
  UpdateHolidayDto,
} from './dto/attendance-settings.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Attendance Settings')
@ApiBearerAuth()
@Controller('attendance-settings')
export class AttendanceSettingsController {
  constructor(
    private readonly attendanceSettingsService: AttendanceSettingsService,
  ) {}

  // ─── Settings (singleton) ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get attendance settings (office hours + weekly holidays)' })
  @ApiResponse({ status: 200, description: 'Current attendance settings' })
  async getSettings() {
    return this.attendanceSettingsService.getSettings();
  }

  @Patch()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update attendance settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(@Body() dto: UpdateAttendanceSettingsDto) {
    return this.attendanceSettingsService.updateSettings(dto);
  }

  // ─── Holidays CRUD ───────────────────────────────────────────────────────

  @Get('holidays')
  @ApiOperation({ summary: 'List all holidays' })
  @ApiResponse({ status: 200, description: 'Holidays list sorted by start date' })
  async getHolidays() {
    return this.attendanceSettingsService.getHolidays();
  }

  @Post('holidays')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new holiday' })
  @ApiResponse({ status: 201, description: 'Holiday created' })
  async createHoliday(@Body() dto: CreateHolidayDto) {
    return this.attendanceSettingsService.createHoliday(dto);
  }

  @Patch('holidays/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update a holiday' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Holiday updated' })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async updateHoliday(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHolidayDto,
  ) {
    return this.attendanceSettingsService.updateHoliday(id, dto);
  }

  @Delete('holidays/:id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a holiday' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Holiday deleted' })
  @ApiResponse({ status: 404, description: 'Holiday not found' })
  async deleteHoliday(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceSettingsService.deleteHoliday(id);
  }
}
