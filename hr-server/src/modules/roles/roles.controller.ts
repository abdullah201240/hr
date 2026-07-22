import { Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Permissions } from '../auth/guards/roles.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List all system permissions' })
  @ApiResponse({ status: 200, description: 'Predefined system permissions list' })
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'List all system and custom roles' })
  @ApiResponse({ status: 200, description: 'All roles with their permissions mapping' })
  async getRoles() {
    return this.rolesService.getRoles();
  }

  @Post()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Create a custom role' })
  @ApiResponse({ status: 201, description: 'Custom role created successfully' })
  async createCustomRole(
    @Body() body: { name: string; description?: string; permissionIds: string[] },
  ) {
    return this.rolesService.createCustomRole(body.name, body.description || '', body.permissionIds || []);
  }

  @Patch(':id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update a custom role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Custom role updated successfully' })
  async updateCustomRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name: string; description?: string; permissionIds: string[] },
  ) {
    return this.rolesService.updateCustomRole(id, body.name, body.description || '', body.permissionIds || []);
  }

  @Delete(':id')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Delete a custom role' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Custom role deleted' })
  async deleteCustomRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.deleteCustomRole(id);
  }
}
