import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, IsBoolean, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @IsString()
  @IsOptional()
  members?: string;

  @IsString()
  @IsOptional()
  slackWebhookUrl?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  @IsString()
  @IsOptional()
  members?: string;

  @IsString()
  @IsOptional()
  slackWebhookUrl?: string;
}

export class CreateTaskDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @IsInt()
  @IsOptional()
  estimatedHours?: number;

  @IsInt()
  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  timerStartedAt?: string;

  @IsInt()
  @IsOptional()
  timerElapsedSeconds?: number;

  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @IsString()
  @IsOptional()
  recurrencePattern?: string;

  @IsInt()
  @IsOptional()
  recurrenceInterval?: number;

  @IsDateString()
  @IsOptional()
  nextRecurrenceDate?: string;
}

export class UpdateTaskDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @IsInt()
  @IsOptional()
  estimatedHours?: number;

  @IsInt()
  @IsOptional()
  actualHours?: number;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsString()
  @IsOptional()
  timerStartedAt?: string;

  @IsInt()
  @IsOptional()
  timerElapsedSeconds?: number;

  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @IsString()
  @IsOptional()
  recurrencePattern?: string;

  @IsInt()
  @IsOptional()
  recurrenceInterval?: number;

  @IsDateString()
  @IsOptional()
  nextRecurrenceDate?: string;
}

export class TaskQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;
}

export class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class UpdateChecklistItemDto {
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsString()
  @IsOptional()
  title?: string;
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;
}

// ─── New Gaps DTOs ────────────────────────────────────────────────────────────

export class CreateMilestoneDto {
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateDependencyDto {
  @IsUUID()
  @IsNotEmpty()
  dependsOnTaskId!: string;

  @IsString()
  @IsOptional()
  dependencyType?: string;
}

export class CreateTimeEntryDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @IsInt()
  @IsOptional()
  fileSize?: number;
}
