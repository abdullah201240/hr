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
import { ClaimsService } from './claims.service';
import {
  CreateClaimDto,
  UpdateClaimStatusDto,
  ClaimQueryDto,
} from './dto/claims.dto';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  // ─── Create Claim (any authenticated user) ─────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a new claim' })
  @ApiResponse({ status: 201, description: 'Claim created successfully' })
  async create(@Req() req: any, @Body() dto: CreateClaimDto) {
    const employeeId = req.user.id;
    return this.claimsService.create(employeeId, dto);
  }

  // ─── List Claims (Employees see own, Admins/HR see all) ────────────────────
  @Get()
  @ApiOperation({ summary: 'List claims (Employees see own, Admins see all)' })
  @ApiResponse({ status: 200, description: 'Paginated claims list' })
  async findAll(@Req() req: any, @Query() query: ClaimQueryDto) {
    const employeeId = req.user.id;

    // Standard employees should only see their own claims
    if (!req.user.customRoleId) {
      query.employeeId = employeeId;
    }

    return this.claimsService.findAll(query);
  }

  // ─── Get Claim Details ─────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get claim details by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim details' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.claimsService.findOne(id, req.user);
  }

  // ─── Update Claim Status (Admin/HR only) ───────────────────────────────────
  @Patch(':id/status')
  @Permissions('claims:approve')  // admin | hr
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve, reject, or settle a claim' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim status updated' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() dto: UpdateClaimStatusDto,
  ) {
    const approvedById = req.user.id;
    return this.claimsService.updateStatus(id, approvedById, dto);
  }

  // ─── Delete Claim (only pending claims) ────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a pending claim' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Claim deleted' })
  @ApiResponse({ status: 404, description: 'Claim not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.claimsService.delete(id, req.user);
  }
}
