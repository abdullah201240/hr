import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import {
  CreateAssetDto,
  AllocateAssetDto,
  UpdateAssetConditionDto,
} from './dto/assets.dto';

@ApiTags('IT Asset Management')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly service: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get IT assets inventory list' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  async getAssets(
    @Req() req: any,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    const userId = req.user.id;
    const permissions = req.user.permissions ? Array.from(req.user.permissions) : [];

    const isAdmin = permissions.includes('employees:update') ||
                    permissions.includes('payroll:process') ||
                    permissions.includes('employees:read');

    const targetEmployeeId = isAdmin ? employeeId : userId;
    return this.service.getAssets(targetEmployeeId, status, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed log & allocation history for an asset' })
  async getAssetDetails(@Param('id') id: string) {
    return this.service.getAssetDetails(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new hardware asset' })
  async createAsset(@Body() dto: CreateAssetDto) {
    return this.service.createAsset(dto);
  }

  @Post(':id/allocate')
  @ApiOperation({ summary: 'Allocate asset to employee' })
  async allocateAsset(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: AllocateAssetDto,
  ) {
    const actionById = req.user.id;
    return this.service.allocateAsset(id, dto, actionById);
  }

  @Post(':id/return')
  @ApiOperation({ summary: 'Return asset back to available inventory' })
  async returnAsset(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: { notes?: string },
  ) {
    const actionById = req.user.id;
    return this.service.returnAsset(id, dto.notes || '', actionById);
  }

  @Patch(':id/condition')
  @ApiOperation({ summary: 'Update physical condition of an asset' })
  async updateCondition(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateAssetConditionDto,
  ) {
    const actionById = req.user.id;
    return this.service.updateCondition(id, dto, actionById);
  }
}
