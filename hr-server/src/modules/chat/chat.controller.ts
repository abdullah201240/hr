import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateChannelDto, CreateDirectRoomDto, AddMemberDto } from './dto/create-room.dto';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({ summary: 'Get all rooms/conversations for the logged-in employee' })
  @ApiResponse({ status: 200, description: 'List of conversations.' })
  async getRooms(@Req() req: AuthenticatedRequest) {
    return this.chatService.getUserRooms(req.user.id);
  }

  @Post('rooms/direct')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get or create a direct message conversation room' })
  @ApiResponse({ status: 200, description: 'DM room details.' })
  async getOrCreateDirect(@Req() req: AuthenticatedRequest, @Body() dto: CreateDirectRoomDto) {
    return this.chatService.getOrCreateDirectRoom(req.user.id, dto.recipientId);
  }

  @Post('rooms/channel')
  @ApiOperation({ summary: 'Create a group team channel' })
  @ApiResponse({ status: 201, description: 'Channel room created successfully.' })
  async createChannel(@Req() req: AuthenticatedRequest, @Body() dto: CreateChannelDto) {
    return this.chatService.createChannel(req.user.id, dto.name, dto.description || '', dto.isPrivate);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get paginated message logs in a conversation' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor message ID to fetch older logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page limit (default: 50)' })
  @ApiResponse({ status: 200, description: 'Array of messages.' })
  async getRoomMessages(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number
  ) {
    const limitNum = limit ? Number(limit) : 50;
    return this.chatService.getRoomMessages(roomId, req.user.id, limitNum, cursor);
  }

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages in a conversation as read' })
  @ApiResponse({ status: 200, description: 'Read timestamp updated.' })
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('roomId') roomId: string) {
    await this.chatService.markAsRead(roomId, req.user.id);
    return { success: true };
  }

  @Post('rooms/:roomId/members')
  @ApiOperation({ summary: 'Add an employee to a group channel' })
  @ApiResponse({ status: 201, description: 'Employee added successfully.' })
  async addMember(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Body() dto: AddMemberDto
  ) {
    return this.chatService.addMemberToRoom(roomId, dto.employeeId, req.user.id);
  }

  @Delete('rooms/:roomId/members/:employeeId')
  @ApiOperation({ summary: 'Remove a member from a group channel, or leave the channel' })
  @ApiResponse({ status: 200, description: 'Member removed successfully.' })
  async removeMember(
    @Req() req: AuthenticatedRequest,
    @Param('roomId') roomId: string,
    @Param('employeeId') employeeId: string
  ) {
    return this.chatService.removeMemberFromRoom(roomId, employeeId, req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search across message text history' })
  @ApiQuery({ name: 'q', required: true, description: 'Query text search string' })
  @ApiResponse({ status: 200, description: 'Matched message results.' })
  async search(@Req() req: AuthenticatedRequest, @Query('q') query: string) {
    return this.chatService.searchMessages(req.user.id, query);
  }
}
