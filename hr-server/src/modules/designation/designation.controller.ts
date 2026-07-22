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
import { DesignationService } from './designation.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from './dto/create-designation.dto';
import { DesignationQueryDto } from './dto/designation-query.dto';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  // ─── Create ────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new designation' })
  @ApiResponse({ status: 201, description: 'Designation created' })
  @ApiResponse({ status: 409, description: 'Name or code already exists' })
  async create(@Body() dto: CreateDesignationDto) {
    return this.designationService.create(dto);
  }

  // ─── List ──────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List designations with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated designation list' })
  async findAll(@Query() query: DesignationQueryDto) {
    return this.designationService.findAll(query);
  }

  // ─── Dropdown options (for select inputs) ──────────────────────────────

  @Get('options')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Get active designations as dropdown options' })
  @ApiResponse({
    status: 200,
    description: 'Designation options for select inputs',
  })
  async getOptions() {
    return this.designationService.getDropdownOptions();
  }

  // ─── Single designation ────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get designation by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Designation details' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.designationService.findOne(id);
  }

  // ─── Update ────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({ summary: 'Update a designation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Designation updated' })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  @ApiResponse({ status: 409, description: 'Name or code conflict' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDesignationDto,
  ) {
    return this.designationService.update(id, dto);
  }

  // ─── Soft delete (deactivate) ──────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a designation (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Designation deactivated' })
  @ApiResponse({
    status: 400,
    description: 'Active employees still hold this designation',
  })
  @ApiResponse({ status: 404, description: 'Designation not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.designationService.remove(id);
  }
}
