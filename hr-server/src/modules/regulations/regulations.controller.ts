import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { RegulationsService } from './regulations.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  CreateRequestDto,
  UpdateRequestStatusDto,
  RegulationQueryDto,
} from './dto/regulations.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Regulations')
@ApiBearerAuth()
@Controller('regulations')
export class RegulationsController {
  constructor(private readonly regulationsService: RegulationsService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // POLICY ENDPOINTS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('policies')
  @Permissions('regulations:read')
  @ApiOperation({ summary: 'List all company regulation policies' })
  @ApiResponse({ status: 200, description: 'List of policies' })
  async findAllPolicies() {
    return this.regulationsService.findAllPolicies();
  }

  @Post('policies')
  @Permissions('regulations:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new regulation policy' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async createPolicy(@Req() req: any, @Body() dto: CreatePolicyDto) {
    return this.regulationsService.createPolicy(req.user.id, dto);
  }

  @Get('policies/:id')
  @Permissions('regulations:read')
  @ApiOperation({ summary: 'Get a single regulation policy by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Policy details' })
  async findOnePolicy(@Param('id', ParseUUIDPipe) id: string) {
    return this.regulationsService.findOnePolicy(id);
  }

  @Patch('policies/:id')
  @Permissions('regulations:update')
  @ApiOperation({ summary: 'Update a regulation policy' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async updatePolicy(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdatePolicyDto,
  ) {
    return this.regulationsService.updatePolicy(id, req.user.id, dto);
  }

  @Delete('policies/:id')
  @Permissions('regulations:delete')
  @ApiOperation({ summary: 'Delete a regulation policy' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Policy deleted' })
  async deletePolicy(@Param('id', ParseUUIDPipe) id: string) {
    return this.regulationsService.deletePolicy(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REQUEST ENDPOINTS
  // ───────────────────────────────────────────────────────────────────────────

  @Get('requests')
  @Permissions('regulations:view_own') // Note: RolesGuard maps view_own/view_team/view_all in canActivate for GET
  @ApiOperation({ summary: 'List regulation requests' })
  @ApiResponse({ status: 200, description: 'Paginated list of requests' })
  async findAllRequests(@Req() req: any, @Query() query: RegulationQueryDto) {
    // If standard employee and lacks custom role (roles list / admin access)
    if (!req.user.customRoleId) {
      query.employeeId = req.user.id;
    }
    return this.regulationsService.findAllRequests(query, req.user);
  }

  @Post('requests')
  @Permissions('regulations:apply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new regulation request' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async createRequest(@Req() req: any, @Body() dto: CreateRequestDto) {
    return this.regulationsService.createRequest(req.user.id, dto);
  }

  @Get('requests/:id')
  @Permissions('regulations:view_own')
  @ApiOperation({ summary: 'Get regulation request details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Request details' })
  async findOneRequest(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.regulationsService.findOneRequest(id, req.user);
  }

  @Patch('requests/:id/status')
  @Permissions('regulations:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a regulation request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Request status updated' })
  async updateRequestStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.regulationsService.updateRequestStatus(id, req.user, dto);
  }

  @Delete('requests/:id')
  @Permissions('regulations:apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending regulation request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Request cancelled/deleted' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.regulationsService.delete(id, req.user);
  }
}
