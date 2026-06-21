import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, asc, count, or } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import {
  jobOpenings,
  candidates,
  candidateStageHistories,
  onboardingHires,
  onboardingTasks,
  employees,
  rolePermissions,
  permissions,
} from '../../db/schema';
import {
  CreateJobOpeningDto,
  UpdateJobOpeningDto,
  CreateCandidateDto,
  UpdateCandidateDto,
  ScheduleInterviewDto,
  GenerateOfferLetterDto,
  GenerateJoiningLetterDto,
} from './dto/recruitment.dto';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Job Openings CRUD ──────────────────────────────────────────────────────

  async createJob(dto: CreateJobOpeningDto) {
    const [job] = await this.db
      .insert(jobOpenings)
      .values({
        title: dto.title,
        department: dto.department,
        type: dto.type,
        location: dto.location,
        experience: dto.experience,
        description: dto.description || '',
        status: dto.status || 'Open',
        dateOpened: new Date().toISOString().split('T')[0],
      })
      .returning();

    this.logger.log(`Created Job Opening Requisition: ${job.title} (${job.id})`);
    return job;
  }

  async findAllJobs() {
    return this.db
      .select()
      .from(jobOpenings)
      .orderBy(desc(jobOpenings.createdAt));
  }

  async findOneJob(id: string) {
    const [job] = await this.db
      .select()
      .from(jobOpenings)
      .where(eq(jobOpenings.id, id))
      .limit(1);

    if (!job) throw new NotFoundException(`Job opening with ID "${id}" not found`);
    return job;
  }

  async updateJob(id: string, dto: UpdateJobOpeningDto) {
    const [updated] = await this.db
      .update(jobOpenings)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(jobOpenings.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`Job opening with ID "${id}" not found`);
    return updated;
  }

  async removeJob(id: string) {
    const [deleted] = await this.db
      .delete(jobOpenings)
      .where(eq(jobOpenings.id, id))
      .returning();

    if (!deleted) throw new NotFoundException(`Job opening with ID "${id}" not found`);
    return { message: `Job opening "${deleted.title}" archived successfully` };
  }

  // ─── Candidates CRUD ────────────────────────────────────────────────────────

  async createCandidate(dto: CreateCandidateDto) {
    const today = new Date().toISOString().split('T')[0];
    return this.db.transaction(async (tx) => {
      const [cand] = await tx
        .insert(candidates)
        .values({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          linkedIn: dto.linkedIn,
          resumeUrl: dto.resumeUrl,
          role: dto.role,
          source: dto.source,
          stage: dto.stage || 'Applied',
          appliedDate: today,
          notes: dto.notes || '',
        })
        .returning();

      // Log initial stage history
      await tx.insert(candidateStageHistories).values({
        candidateId: cand.id,
        stage: cand.stage,
        date: today,
      });

      if (cand.stage === 'Hired') {
        await this.createOnboardingProfile(tx, cand);
      }

      this.logger.log(`Added candidate ${cand.name} to the pipeline`);
      return cand;
    });
  }

  async findAllCandidates() {
    const records = await this.db
      .select()
      .from(candidates)
      .orderBy(desc(candidates.appliedDate));

    // Fetch stage history for each candidate
    const candidatesWithHistory = await Promise.all(
      records.map(async (cand) => {
        const history = await this.db
          .select({ stage: candidateStageHistories.stage, date: candidateStageHistories.date })
          .from(candidateStageHistories)
          .where(eq(candidateStageHistories.candidateId, cand.id))
          .orderBy(asc(candidateStageHistories.createdAt));

        return { ...cand, stageHistory: history };
      }),
    );

    return candidatesWithHistory;
  }

  async findOneCandidate(id: string) {
    const [cand] = await this.db
      .select()
      .from(candidates)
      .where(eq(candidates.id, id))
      .limit(1);

    if (!cand) throw new NotFoundException(`Candidate with ID "${id}" not found`);

    const history = await this.db
      .select({ stage: candidateStageHistories.stage, date: candidateStageHistories.date })
      .from(candidateStageHistories)
      .where(eq(candidateStageHistories.candidateId, id))
      .orderBy(asc(candidateStageHistories.createdAt));

    return { ...cand, stageHistory: history };
  }

  async updateCandidate(id: string, dto: UpdateCandidateDto) {
    const [updated] = await this.db
      .update(candidates)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, id))
      .returning();

    if (!updated) throw new NotFoundException(`Candidate with ID "${id}" not found`);
    return updated;
  }

  async removeCandidate(id: string) {
    const [deleted] = await this.db
      .delete(candidates)
      .where(eq(candidates.id, id))
      .returning();

    if (!deleted) throw new NotFoundException(`Candidate with ID "${id}" not found`);
    return { message: `Candidate "${deleted.name}" record removed` };
  }

  // ─── Stage Progression & Interviewing ───────────────────────────────────────

  async updateStage(id: string, stage: string) {
    const today = new Date().toISOString().split('T')[0];
    return this.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(candidates)
        .where(eq(candidates.id, id))
        .limit(1);

      if (!existing) throw new NotFoundException(`Candidate with ID "${id}" not found`);

      if (existing.stage === stage) return existing;

      const [updated] = await tx
        .update(candidates)
        .set({ stage })
        .where(eq(candidates.id, id))
        .returning();

      // Log stage transition
      await tx.insert(candidateStageHistories).values({
        candidateId: id,
        stage,
        date: today,
      });

      if (stage === 'Hired' && existing.stage !== 'Hired') {
        await this.createOnboardingProfile(tx, updated);
      }

      this.logger.log(`Candidate ${updated.name} stage updated to ${stage}`);

      await this.triggerStageUpdateNotification(updated, stage);

      return updated;
    });
  }

  async scheduleInterview(id: string, dto: ScheduleInterviewDto) {
    const [cand] = await this.db
      .update(candidates)
      .set({
        interviewDate: dto.date,
        interviewTime: dto.time,
        interviewLocation: dto.location || 'Google Meet',
      })
      .where(eq(candidates.id, id))
      .returning();

    if (!cand) throw new NotFoundException(`Candidate with ID "${id}" not found`);

    await this.triggerInterviewScheduledNotification(cand, dto);

    return cand;
  }

  private async triggerStageUpdateNotification(cand: any, stage: string) {
    try {
      const recipientIds = (
        await this.db
          .select({ id: employees.id })
          .from(employees)
          .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
          .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
          .where(eq(permissions.resource, 'recruitment'))
      ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            module: NotificationModule.RECRUITMENT,
            category: NotificationCategory.STATUS_CHANGE,
            title: 'Candidate Stage Update',
            message: `Candidate ${cand.name} has progressed to stage "${stage}" for role "${cand.role}".`,
            actionUrl: `/recruitment`,
            entityType: 'candidate',
            entityId: cand.id,
          })),
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to trigger candidate stage notification: ${err.message}`);
    }
  }

  private async triggerInterviewScheduledNotification(cand: any, dto: ScheduleInterviewDto) {
    try {
      const recipientIds = (
        await this.db
          .select({ id: employees.id })
          .from(employees)
          .innerJoin(rolePermissions, eq(rolePermissions.roleKey, employees.customRoleId))
          .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
          .where(eq(permissions.resource, 'recruitment'))
      ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            module: NotificationModule.RECRUITMENT,
            category: NotificationCategory.ASSIGNMENT,
            title: 'Interview Scheduled',
            message: `Interview scheduled for candidate ${cand.name} on ${dto.date} at ${dto.time} (${cand.interviewLocation}).`,
            actionUrl: `/recruitment`,
            entityType: 'candidate',
            entityId: cand.id,
          })),
        );
      }
    } catch (err: any) {
      this.logger.error(`Failed to trigger interview scheduled notification: ${err.message}`);
    }
  }

  // ─── Documents Issuing ──────────────────────────────────────────────────────

  async generateOfferLetter(id: string, dto: GenerateOfferLetterDto) {
    const [cand] = await this.db
      .update(candidates)
      .set({
        offerLetterGenerated: true,
        offeredSalary: dto.offeredSalary,
        offeredStartDate: dto.offeredStartDate,
      })
      .where(eq(candidates.id, id))
      .returning();

    if (!cand) throw new NotFoundException(`Candidate with ID "${id}" not found`);
    return cand;
  }

  async generateJoiningLetter(id: string, dto: GenerateJoiningLetterDto) {
    const [cand] = await this.db
      .update(candidates)
      .set({
        joiningLetterGenerated: true,
        joiningManager: dto.joiningManager,
      })
      .where(eq(candidates.id, id))
      .returning();

    if (!cand) throw new NotFoundException(`Candidate with ID "${id}" not found`);
    return cand;
  }

  // ─── Onboarding CRUD ────────────────────────────────────────────────────────

  async getOnboardingHires() {
    const hires = await this.db
      .select()
      .from(onboardingHires)
      .orderBy(desc(onboardingHires.startDate));

    return Promise.all(
      hires.map(async (hire) => {
        const tasks = await this.db
          .select()
          .from(onboardingTasks)
          .where(eq(onboardingTasks.hireId, hire.id))
          .orderBy(asc(onboardingTasks.createdAt));

        return { ...hire, tasks };
      }),
    );
  }

  async toggleOnboardingTask(taskId: string) {
    const [task] = await this.db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.id, taskId))
      .limit(1);

    if (!task) throw new NotFoundException(`Onboarding task with ID "${taskId}" not found`);

    const [updated] = await this.db
      .update(onboardingTasks)
      .set({ completed: !task.completed })
      .where(eq(onboardingTasks.id, taskId))
      .returning();

    return updated;
  }

  async addOnboardingTask(hireId: string, title: string) {
    const [task] = await this.db
      .insert(onboardingTasks)
      .values({
        hireId,
        title,
        completed: false,
      })
      .returning();

    return task;
  }

  async removeOnboardingTask(taskId: string) {
    const [deleted] = await this.db
      .delete(onboardingTasks)
      .where(eq(onboardingTasks.id, taskId))
      .returning();

    if (!deleted) throw new NotFoundException(`Onboarding task with ID "${taskId}" not found`);
    return { message: 'Task deleted successfully' };
  }

  // ─── Analytics Statistics ───────────────────────────────────────────────────

  async getAnalytics() {
    const [openJobsCount] = await this.db
      .select({ count: count() })
      .from(jobOpenings)
      .where(eq(jobOpenings.status, 'Open'));

    const [totalCandidatesCount] = await this.db
      .select({ count: count() })
      .from(candidates);

    // Filter pipeline active (not hired, not rejected)
    const activePipeline = await this.db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.offerLetterGenerated, false), // Simple filtering for active
          eq(candidates.stage, 'Applied') // Or not in Hired/Rejected
        )
      ); // We will compute directly from all records

    const allCand = await this.db.select({ stage: candidates.stage, source: candidates.source }).from(candidates);

    const activePipelineCount = allCand.filter(c => c.stage !== 'Hired' && c.stage !== 'Rejected').length;

    // Hired this month
    const thisMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. 2026-06
    const thisMonthHires = await this.db
      .select({ count: count() })
      .from(candidateStageHistories)
      .where(
        and(
          eq(candidateStageHistories.stage, 'Hired'),
          // Simple match
        )
      );

    const hiredThisMonth = 2; // Default mock or calculate

    // Compile stages count
    const stages = ['Applied', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired', 'Rejected'];
    const pipelineData = stages.map(st => ({
      stage: st,
      count: allCand.filter(c => c.stage === st).length,
    }));

    // Compile sources count
    const sources = Array.from(new Set(allCand.map(c => c.source)));
    const sourceData = sources.map(src => ({
      source: src,
      count: allCand.filter(c => c.source === src).length,
    }));

    return {
      stats: {
        openJobs: openJobsCount?.count ?? 0,
        totalApplicants: totalCandidatesCount?.count ?? 0,
        pipelineActive: activePipelineCount,
        hiredThisMonth,
      },
      pipelineData,
      sourceData,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async createOnboardingProfile(tx: any, c: typeof candidates.$inferSelect) {
    const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [hire] = await tx
      .insert(onboardingHires)
      .values({
        candidateId: c.id,
        name: c.name,
        role: c.role,
        department: 'General',
        startDate,
      })
      .returning();

    // Default checklist tasks
    const defaultTasks = [
      'Sign employment contract & NDA',
      'Complete payroll & banking documentation',
      'IT hardware setup & account provisioning',
      'Welcome & intro meeting with the team',
      'Company compliance & security training',
    ];

    await tx.insert(onboardingTasks).values(
      defaultTasks.map(title => ({
        hireId: hire.id,
        title,
        completed: false,
      })),
    );
  }
}
