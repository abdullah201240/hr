import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { TasksService } from './tasks.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  CreateCommentDto,
  UpdateCommentDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateDependencyDto,
  CreateTimeEntryDto,
  CreateAttachmentDto,
} from './dto/tasks.dto';

@ApiTags('Tasks & Projects')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─── Project Endpoints ───────────────────────────────────────────────────────

  @Get('projects')
  @ApiOperation({ summary: 'Get all task projects' })
  async findAllProjects(@Query('departmentId') departmentId?: string) {
    return this.tasksService.findAllProjects(departmentId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a new task project' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.tasksService.createProject(dto);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get details of a single task project' })
  async findOneProject(@Param('id') id: string) {
    return this.tasksService.findOneProject(id);
  }

  @Get('projects/:id/activities')
  @ApiOperation({ summary: 'Get all activities for tasks inside a project' })
  async findProjectActivities(@Param('id') projectId: string) {
    return this.tasksService.findProjectActivities(projectId);
  }

  @Patch('projects/:id')
  @ApiOperation({ summary: 'Update a task project' })
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.tasksService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a task project' })
  async deleteProject(@Param('id') id: string) {
    return this.tasksService.deleteProject(id);
  }

  // ─── Milestones Endpoints ───────────────────────────────────────────────────

  @Post('projects/:id/milestones')
  @ApiOperation({ summary: 'Create a new milestone in a project' })
  async createMilestone(@Param('id') projectId: string, @Body() dto: CreateMilestoneDto) {
    dto.projectId = projectId;
    return this.tasksService.createMilestone(dto);
  }

  @Get('projects/:id/milestones')
  @ApiOperation({ summary: 'Get all milestones for a project' })
  async findMilestones(@Param('id') projectId: string) {
    return this.tasksService.findMilestones(projectId);
  }

  @Patch('milestones/:id')
  @ApiOperation({ summary: 'Update a milestone' })
  async updateMilestone(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.tasksService.updateMilestone(id, dto);
  }

  @Delete('milestones/:id')
  @ApiOperation({ summary: 'Delete a milestone' })
  async deleteMilestone(@Param('id') id: string) {
    return this.tasksService.deleteMilestone(id);
  }

  // ─── Task Endpoints ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all tasks with optional filters' })
  async findAllTasks(@Query() query: TaskQueryDto) {
    return this.tasksService.findAllTasks(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Body() dto: CreateTaskDto,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.createTask(dto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task details with activities/checklists' })
  async findOneTask(@Param('id') id: string) {
    return this.tasksService.findOneTask(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task properties' })
  async updateTask(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.updateTask(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Param('id') id: string) {
    return this.tasksService.deleteTask(id);
  }

  // ─── Checklist Endpoints ─────────────────────────────────────────────────────

  @Post(':id/checklist')
  @ApiOperation({ summary: 'Add a checklist subtask' })
  async addChecklistItem(
    @Param('id') taskId: string,
    @Body() dto: CreateChecklistItemDto,
  ) {
    return this.tasksService.addChecklistItem(taskId, dto);
  }

  @Patch('checklist/:itemId')
  @ApiOperation({ summary: 'Update/toggle checklist item status' })
  async updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.tasksService.updateChecklistItem(itemId, dto);
  }

  @Delete('checklist/:itemId')
  @ApiOperation({ summary: 'Delete a checklist item' })
  async deleteChecklistItem(@Param('itemId') itemId: string) {
    return this.tasksService.deleteChecklistItem(itemId);
  }

  // ─── Comment Endpoints ───────────────────────────────────────────────────────

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a task' })
  async addComment(
    @Param('id') taskId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.addComment(taskId, req.user.id, dto);
  }

  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.deleteComment(commentId, req.user.id);
  }

  @Patch('comments/:commentId')
  @ApiOperation({ summary: 'Update a comment (edit/pin/reaction)' })
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.updateComment(commentId, req.user.id, dto);
  }

  // ─── Task Dependencies Endpoints ─────────────────────────────────────────────

  @Post(':id/dependencies')
  @ApiOperation({ summary: 'Add a task dependency' })
  async addDependency(@Param('id') taskId: string, @Body() dto: CreateDependencyDto) {
    return this.tasksService.addDependency(taskId, dto);
  }

  @Delete('dependencies/:id')
  @ApiOperation({ summary: 'Remove a task dependency' })
  async deleteDependency(@Param('id') id: string) {
    return this.tasksService.deleteDependency(id);
  }

  // ─── Time Entries Endpoints ──────────────────────────────────────────────────

  @Post(':id/time-entries')
  @ApiOperation({ summary: 'Add a time entry log for a task' })
  async addTimeEntry(@Param('id') taskId: string, @Body() dto: CreateTimeEntryDto) {
    return this.tasksService.addTimeEntry(taskId, dto);
  }

  @Delete('time-entries/:id')
  @ApiOperation({ summary: 'Delete a time entry log' })
  async deleteTimeEntry(@Param('id') id: string) {
    return this.tasksService.deleteTimeEntry(id);
  }

  // ─── Attachments Endpoints ───────────────────────────────────────────────────

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Add a file attachment metadata to a task' })
  async addAttachment(
    @Param('id') taskId: string,
    @Body() dto: CreateAttachmentDto,
    @Req() req: FastifyRequest & { user: { id: string } },
  ) {
    return this.tasksService.addAttachment(taskId, dto, req.user.id);
  }

  @Delete('attachments/:id')
  @ApiOperation({ summary: 'Delete a task file attachment' })
  async deleteAttachment(@Param('id') id: string) {
    return this.tasksService.deleteAttachment(id);
  }

  // ─── User Notifications Endpoints ───────────────────────────────────────────

  @Get('notifications')
  @ApiOperation({ summary: 'Get all notifications for logged-in user' })
  async findNotifications(@Req() req: FastifyRequest & { user: { id: string } }) {
    return this.tasksService.findNotifications(req.user.id);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markNotificationRead(@Param('id') id: string) {
    return this.tasksService.markNotificationRead(id);
  }
}
