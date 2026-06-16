import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all announcements (cursor-based pagination)' })
  @ApiQuery({ name: 'cursor', required: false, description: 'Base64 encoded cursor for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: ['Published', 'Draft', 'all'], description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by title, content, or author' })
  @ApiResponse({ status: 200, description: 'Return paginated announcements.' })
  findAll(@Query() query: AnnouncementQueryDto) {
    return this.announcementsService.findAllCursor(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an announcement by id' })
  @ApiResponse({ status: 200, description: 'Return a single announcement.' })
  findOne(@Param('id') id: string) {
    return this.announcementsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiResponse({ status: 201, description: 'The announcement has been created.' })
  create(@Body() createDto: CreateAnnouncementDto) {
    return this.announcementsService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiResponse({ status: 200, description: 'The announcement has been updated.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiResponse({ status: 200, description: 'The announcement has been deleted.' })
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
