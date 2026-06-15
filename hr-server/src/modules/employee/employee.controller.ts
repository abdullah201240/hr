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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // ─── Create (async via queue) ─────────────────────────────────────────

  @Post()
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Create a new employee (queued)' })
  @ApiResponse({ status: 202, description: 'Employee creation job enqueued' })
  @ApiResponse({
    status: 409,
    description: 'Employee ID or email already exists',
  })
  async create(@Body() dto: CreateEmployeeDto) {
    return this.employeeService.createAsync(dto);
  }

  // ─── Update (async via queue) ────────────────────────────────────────

  @Patch(':id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Update an employee (queued)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 202, description: 'Employee update job enqueued' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employeeService.updateAsync(id, dto);
  }

  // ─── List with filters ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List employees with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated employee list' })
  async findAll(@Query() query: EmployeeQueryDto) {
    return this.employeeService.findAll(query);
  }

  // ─── Single employee ──────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID with all nested data' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee details' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.findOne(id);
  }

  // ─── Job status ───────────────────────────────────────────────────────

  @Get('jobs/:jobId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Check employee processing job status' })
  @ApiParam({ name: 'jobId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Job status details' })
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Query('queue') queue: string = 'create',
  ) {
    return this.employeeService.getJobStatus(queue, jobId);
  }

  // ─── Soft delete ──────────────────────────────────────────────────────

  @Delete(':id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete (terminate) an employee' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Employee terminated' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeeService.remove(id);
  }
}
