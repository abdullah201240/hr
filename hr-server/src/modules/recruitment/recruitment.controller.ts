import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import {
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
  CreateCandidateDto,
  UpdateCandidateDto,
  ScheduleInterviewDto,
  GenerateOfferLetterDto,
  GenerateJoiningLetterDto,
} from './dto/recruitment.dto';
import { Roles } from '../auth/guards/roles.decorator';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('recruitment')
@Roles('admin', 'hr')  // ← All recruitment endpoints are admin/hr only (Gap G1 fix)
export class RecruitmentController {
  constructor(private readonly service: RecruitmentService) {}


  // ─── Job Openings ───────────────────────────────────────────────────────────

  @Post('jobs')
  @ApiOperation({ summary: 'Create a new job opening requisition' })
  async createJob(@Body() dto: CreateJobOpeningDto) {
    return this.service.createJob(dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get all job openings' })
  async findAllJobs() {
    return this.service.findAllJobs();
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job opening by ID' })
  async findOneJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneJob(id);
  }

  @Patch('jobs/:id')
  @ApiOperation({ summary: 'Update job opening details' })
  async updateJob(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJobOpeningDto) {
    return this.service.updateJob(id, dto);
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Archive a job opening' })
  async removeJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeJob(id);
  }

  // ─── Candidates ─────────────────────────────────────────────────────────────

  @Post('candidates')
  @ApiOperation({ summary: 'Add a new candidate' })
  async createCandidate(@Body() dto: CreateCandidateDto) {
    return this.service.createCandidate(dto);
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Get all candidates in pipeline' })
  async findAllCandidates() {
    return this.service.findAllCandidates();
  }

  @Get('candidates/:id')
  @ApiOperation({ summary: 'Get single candidate details' })
  async findOneCandidate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneCandidate(id);
  }

  @Patch('candidates/:id')
  @ApiOperation({ summary: 'Update candidate information' })
  async updateCandidate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCandidateDto) {
    return this.service.updateCandidate(id, dto);
  }

  @Delete('candidates/:id')
  @ApiOperation({ summary: 'Remove a candidate record' })
  async removeCandidate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeCandidate(id);
  }

  // ─── Stage Progression & Interviewing ───────────────────────────────────────

  @Patch('candidates/:id/stage')
  @ApiOperation({ summary: 'Promote/demote candidate to another stage' })
  async updateStage(@Param('id', ParseUUIDPipe) id: string, @Body('stage') stage: string) {
    return this.service.updateStage(id, stage);
  }

  @Patch('candidates/:id/interview')
  @ApiOperation({ summary: 'Schedule an interview for candidate' })
  async scheduleInterview(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ScheduleInterviewDto) {
    return this.service.scheduleInterview(id, dto);
  }

  // ─── Documents Issuing ──────────────────────────────────────────────────────

  @Patch('candidates/:id/offer')
  @ApiOperation({ summary: 'Generate offer letter for a candidate' })
  async generateOfferLetter(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GenerateOfferLetterDto) {
    return this.service.generateOfferLetter(id, dto);
  }

  @Patch('candidates/:id/joining')
  @ApiOperation({ summary: 'Generate joining letter for a candidate' })
  async generateJoiningLetter(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GenerateJoiningLetterDto) {
    return this.service.generateJoiningLetter(id, dto);
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────

  @Get('onboarding')
  @ApiOperation({ summary: 'Get onboarding tracker list' })
  async getOnboardingHires() {
    return this.service.getOnboardingHires();
  }

  @Patch('onboarding/tasks/:taskId')
  @ApiOperation({ summary: 'Toggle onboarding task completion' })
  async toggleOnboardingTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.toggleOnboardingTask(taskId);
  }

  @Post('onboarding/:hireId/tasks')
  @ApiOperation({ summary: 'Add a custom onboarding task' })
  async addOnboardingTask(@Param('hireId', ParseUUIDPipe) hireId: string, @Body('title') title: string) {
    return this.service.addOnboardingTask(hireId, title);
  }

  @Delete('onboarding/tasks/:taskId')
  @ApiOperation({ summary: 'Remove an onboarding task' })
  async removeOnboardingTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.removeOnboardingTask(taskId);
  }

  // ─── Analytics ──────────────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Get recruitment pipeline stats' })
  async getAnalytics() {
    return this.service.getAnalytics();
  }
}
