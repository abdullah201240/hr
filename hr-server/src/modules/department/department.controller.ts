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
import { DepartmentService } from './department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/create-department.dto';
import { DepartmentQueryDto } from './dto/department-query.dto';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  // ─── Create ───────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: 'Department created' })
  @ApiResponse({ status: 409, description: 'Department code already exists' })
  async create(@Body() dto: CreateDepartmentDto) {
    return this.departmentService.create(dto);
  }

  // ─── List with filters ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List departments with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated department list' })
  async findAll(@Query() query: DepartmentQueryDto) {
    return this.departmentService.findAll(query);
  }

  // ─── Dropdown options (for select inputs) ──────────────────────────────

  @Get('options')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get active departments as dropdown options' })
  @ApiResponse({
    status: 200,
    description: 'Department options for select inputs',
  })
  async getOptions() {
    return this.departmentService.getDropdownOptions();
  }

  // ─── Single department ─────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Department details' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentService.findOne(id);
  }

  // ─── Update ────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Name or code conflict' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departmentService.update(id, dto);
  }

  // ─── Soft delete (deactivate) ──────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a department (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Department deactivated' })
  @ApiResponse({ status: 400, description: 'Active employees still assigned' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.departmentService.remove(id);
  }
}
