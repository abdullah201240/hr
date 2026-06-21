import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { NotificationService } from './notifications.service';
import { PreferencesService } from './services/preferences.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { UpdatePreferencesDto } from './dto/preferences.dto';
import { BroadcastDto } from './dto/emit-notification.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { employees } from '../../db/schema/employee';

type RequestWithUser = FastifyRequest & { user: { id: string } };

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferencesService: PreferencesService,
  ) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: NotificationQueryDto) {
    return this.notificationService.findAll(req.user.id, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: RequestWithUser) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Req() req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Patch(':id/archive')
  async archive(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.archive(id, req.user.id);
  }

  @Post('archive-all-read')
  async archiveAllRead(@Req() req: RequestWithUser) {
    return this.notificationService.archiveAllRead(req.user.id);
  }

  @Delete(':id')
  async delete(@Req() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.delete(id, req.user.id);
  }

  @Post(':id/actions/:index')
  async executeAction(
    @Req() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
  ) {
    return this.notificationService.executeAction(id, index, req.user.id);
  }

  @Get('preferences')
  async getPreferences(@Req() req: RequestWithUser) {
    return this.preferencesService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  async updatePreferences(@Req() req: RequestWithUser, @Body() dto: UpdatePreferencesDto) {
    return this.preferencesService.updatePreferences(req.user.id, dto);
  }

  @Post('broadcast')
  @Roles('admin')
  async broadcast(@Body() dto: BroadcastDto) {
    // If recipientIds is provided, emit to those, otherwise broadcast to everyone
    let targets: string[] = dto.recipientIds || [];
    if (targets.length === 0) {
      // Find all employee IDs from DB
      const allEmployees = await this.notificationService['db']
        .select({ id: employees.id })
        .from(employees);
      targets = allEmployees.map((e: any) => e.id);
    }

    const dtos = targets.map((id) => ({
      recipientId: id,
      module: 'announcements' as any,
      category: 'broadcast' as any,
      priority: dto.priority || 'normal',
      title: dto.title,
      message: dto.message,
      actionUrl: dto.actionUrl,
    }));

    // Queue broadcasting so it runs in chunks
    await this.notificationService.emitBulk(dtos);
    return { success: true, count: targets.length };
  }
}
