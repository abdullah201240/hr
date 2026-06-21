import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LeaveTypeService } from './leave-type.service';
import {
  CreateLeaveTypeDto,
  UpdateLeaveTypeDto,
} from './dto/create-leave-type.dto';
import { LeaveTypeQueryDto } from './dto/leave-type-query.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Leave Types')
@ApiBearerAuth()
@Controller('leave-types')
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

  // ─── Create ────────────────────────────────────────────────────────────

  @Post()
  @Permissions('leave:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new leave type' })
  @ApiResponse({ status: 201, description: 'Leave type created' })
  @ApiResponse({ status: 409, description: 'Name already exists' })
  async create(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveTypeService.create(dto);
  }

  // ─── List ──────────────────────────────────────────────────────────────

  @Get()
  @Permissions('leave:read', 'leave:create', 'leave:update', 'leave:delete')
  @ApiOperation({ summary: 'List leave types with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated leave type list' })
  async findAll(@Query() query: LeaveTypeQueryDto) {
    return this.leaveTypeService.findAll(query);
  }

  // ─── Options (active listing for dropdowns/client) ─────────────────────

  @Get('options')
  @Permissions('leave:read', 'leave:apply', 'leave:view_own')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get active leave types as options' })
  @ApiResponse({ status: 200, description: 'Active leave types list' })
  async getOptions() {
    return this.leaveTypeService.getDropdownOptions();
  }

  // ─── Single leave type ──────────────────────────────────────────────────

  @Get(':id')
  @Permissions('leave:read', 'leave:create', 'leave:update')
  @ApiOperation({ summary: 'Get leave type by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave type details' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveTypeService.findOne(id);
  }

  // ─── Update ────────────────────────────────────────────────────────────

  @Patch(':id')
  @Permissions('leave:update')
  @ApiOperation({ summary: 'Update a leave type' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave type updated' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  @ApiResponse({ status: 409, description: 'Name conflict' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypeService.update(id, dto);
  }

  // ─── Soft delete (deactivate) ──────────────────────────────────────────

  @Delete(':id')
  @Permissions('leave:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a leave type (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Leave type deactivated' })
  @ApiResponse({ status: 404, description: 'Leave type not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leaveTypeService.remove(id);
  }
}
