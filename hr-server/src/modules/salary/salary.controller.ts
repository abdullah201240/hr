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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import {
  CreateSalaryTemplateDto,
  UpdateSalaryTemplateDto,
  AssignEmployeeSalaryDto,
  UpdateEmployeeSalaryDto,
} from './dto/salary.dto';

@ApiTags('Salary Management')
@ApiBearerAuth()
@Controller()
export class SalaryController {
  constructor(private readonly service: SalaryService) {}

  // ─── Salary Templates ────────────────────────────────────────────────────

  @Get('salary-templates')
  @ApiOperation({ summary: 'Get all salary templates with components' })
  @ApiResponse({ status: 200, description: 'Return all salary templates' })
  async findAllTemplates() {
    return this.service.findAllTemplates();
  }

  @Get('salary-templates/:id')
  @ApiOperation({ summary: 'Get a single salary template by ID' })
  @ApiResponse({ status: 200, description: 'Return the salary template' })
  async findOneTemplate(@Param('id') id: string) {
    return this.service.findOneTemplate(id);
  }

  @Post('salary-templates')
  @ApiOperation({ summary: 'Create a new salary template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async createTemplate(@Body() dto: CreateSalaryTemplateDto) {
    return this.service.createTemplate(dto);
  }

  @Patch('salary-templates/:id')
  @ApiOperation({ summary: 'Update a salary template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateSalaryTemplateDto,
  ) {
    return this.service.updateTemplate(id, dto);
  }

  @Delete('salary-templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a salary template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // ─── Employee Salaries ────────────────────────────────────────────────────

  @Get('employee-salaries')
  @ApiOperation({
    summary: 'Get all employee salary assignments with employee details',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all employee salary records',
  })
  async findAllEmployeeSalaries() {
    return this.service.findAllEmployeeSalaries();
  }

  @Get('employee-salaries/summary')
  @ApiOperation({ summary: 'Get salary summary/statistics' })
  @ApiResponse({ status: 200, description: 'Return salary summary stats' })
  async getSalarySummary() {
    return this.service.getSalarySummary();
  }

  @Get('employee-salaries/:employeeId')
  @ApiOperation({ summary: 'Get active salary for a specific employee' })
  @ApiResponse({
    status: 200,
    description: 'Return the employee salary record',
  })
  async findEmployeeSalary(@Param('employeeId') employeeId: string) {
    return this.service.findEmployeeSalary(employeeId);
  }

  @Post('employee-salaries')
  @ApiOperation({
    summary: 'Assign or update salary for an employee',
  })
  @ApiResponse({ status: 201, description: 'Salary assigned' })
  async assignSalary(@Body() dto: AssignEmployeeSalaryDto) {
    return this.service.assignSalary(dto);
  }

  @Patch('employee-salaries/:id')
  @ApiOperation({ summary: 'Update an existing employee salary record' })
  @ApiResponse({ status: 200, description: 'Salary record updated' })
  async updateSalary(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeSalaryDto,
  ) {
    return this.service.updateSalary(id, dto);
  }
}
