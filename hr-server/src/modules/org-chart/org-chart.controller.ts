import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrgChartService } from './org-chart.service';
import { CreateOrgNodeDto, UpdateOrgNodeDto } from './dto/org-chart.dto';

@ApiTags('OrgChart')
@ApiBearerAuth()
@Controller('org-chart')
export class OrgChartController {
  constructor(private readonly orgChartService: OrgChartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the full organization chart hierarchy tree' })
  async getTree() {
    return this.orgChartService.getTree();
  }

  @Post('node')
  @ApiOperation({ summary: 'Create a new org node' })
  async createNode(@Body() dto: CreateOrgNodeDto) {
    return this.orgChartService.createNode(dto);
  }

  @Patch('node/:id')
  @ApiOperation({ summary: 'Update an org node' })
  async updateNode(@Param('id') id: string, @Body() dto: UpdateOrgNodeDto) {
    return this.orgChartService.updateNode(id, dto);
  }

  @Delete('node/:id')
  @ApiOperation({ summary: 'Delete an org node' })
  async deleteNode(@Param('id') id: string) {
    return this.orgChartService.deleteNode(id);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset organization chart tree to standard default representation' })
  async resetTree() {
    return this.orgChartService.resetTree();
  }
}
