import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, desc, or } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { employeeKpis, employees, designations, departments, appraisalCycles, employeeAppraisals } from '../../db/schema';
import {
  CreateKpiDto,
  UpdateKpiScoresDto,
  CreateCycleDto,
  UpdateCycleStatusDto,
  SubmitSelfAppraisalDto,
  SubmitManagerAppraisalDto
} from './dto/performance.dto';
import { KPI_CALCULATION_QUEUE } from '../queue/queue.module';
import { NotificationService } from '../notifications/notifications.service';
import { NotificationModule, NotificationCategory } from '../notifications/types/notification.types';

const defaultKPITemplates = {
  engineer: [
    { title: "Feature Shipments", description: "Deliver key roadmap features in alignment with timeline goals", targetMetric: "Ship 15 features/updates", weight: 35 },
    { title: "Code Quality & Uptime", description: "Maintain production platform uptime and minimize code regression rates", targetMetric: "Uptime > 99.9% / regressions < 2%", weight: 35 },
    { title: "Team Mentorship & Reviews", description: "Provide timely pull request audits and internal knowledge transfers", targetMetric: "PR review turnaround time < 4 hours", weight: 30 },
  ],
  manager: [
    { title: "Project Milestones", description: "Sprint delivery completeness and tracking predictability", targetMetric: "Sprint accuracy > 90%", weight: 40 },
    { title: "Team Engagement", description: "Organize workshops and target retention rates within the division", targetMetric: "Employee retention > 95%", weight: 30 },
    { title: "Strategic Roadmap", description: "Execute long-term product integration goals and user research studies", targetMetric: "2 major integrations finalized", weight: 30 },
  ],
  general: [
    { title: "Operational Execution", description: "Ensure daily tasks are completed within service-level agreements", targetMetric: "SLA compliance > 95%", weight: 50 },
    { title: "Continuous Learning", description: "Complete designated training certifications and compliance audits", targetMetric: "Certifications and modules cleared", weight: 30 },
    { title: "Collaboration & Support", description: "Support cross-functional initiatives and organizational setups", targetMetric: "Feedback surveys > 4.5/5", weight: 20 },
  ]
};

@Injectable()
export class PerformanceService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    @InjectQueue(KPI_CALCULATION_QUEUE) private readonly kpiCalculationQueue: Queue,
    private readonly notificationService: NotificationService,
  ) {}

  // --- Cycles Management ---

  async createCycle(dto: CreateCycleDto) {
    const [cycle] = await this.db
      .insert(appraisalCycles)
      .values({
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
        description: dto.description || '',
        status: 'draft',
      })
      .returning();
    return cycle;
  }

  async findAllCycles() {
    return this.db
      .select()
      .from(appraisalCycles)
      .orderBy(desc(appraisalCycles.startDate));
  }

  async findCycleById(id: string) {
    const [cycle] = await this.db
      .select()
      .from(appraisalCycles)
      .where(eq(appraisalCycles.id, id))
      .limit(1);

    if (!cycle) {
      throw new NotFoundException(`Appraisal cycle with ID "${id}" not found`);
    }
    return cycle;
  }

  async updateCycleStatus(id: string, dto: UpdateCycleStatusDto) {
    const [updated] = await this.db
      .update(appraisalCycles)
      .set({ status: dto.status })
      .where(eq(appraisalCycles.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Appraisal cycle with ID "${id}" not found`);
    }

    if (dto.status === 'active') {
      try {
        await this.kpiCalculationQueue.add(
          'initialize-cycle-kpis',
          { cycleId: id },
          { removeOnComplete: true, removeOnFail: true }
        );
      } catch (err) {
        console.error('Failed to queue initialize-cycle-kpis job:', err);
      }
    } else if (dto.status === 'ended') {
      try {
        await this.kpiCalculationQueue.add(
          'calculate-appraisal-grades',
          { cycleId: id },
          { removeOnComplete: true, removeOnFail: true }
        );
      } catch (err) {
        console.error('Failed to queue calculate-appraisal-grades job:', err);
      }
    }

    return updated;
  }

  async bulkInitializeCycleKpis(cycleId: string) {
    const activeEmployees = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.status, 'active'));

    for (const emp of activeEmployees) {
      await this.getEmployeeKpis(emp.id, cycleId);
    }

    return { status: 'success', processed: activeEmployees.length };
  }

  async bulkCalculateCycleGrades(cycleId: string) {
    const appraisals = await this.db
      .select()
      .from(employeeAppraisals)
      .where(eq(employeeAppraisals.cycleId, cycleId));

    let updatedCount = 0;
    for (const appraisal of appraisals) {
      const kpis = await this.db
        .select()
        .from(employeeKpis)
        .where(
          and(
            eq(employeeKpis.employeeId, appraisal.employeeId),
            eq(employeeKpis.cycleId, cycleId)
          )
        );

      if (kpis.length === 0) continue;

      const selfScoreSum = kpis.reduce((sum, k) => sum + ((k.selfScore ?? 80) * (k.weight / 100)), 0);
      const managerScoreSum = kpis.reduce((sum, k) => sum + ((k.managerScore ?? 80) * (k.weight / 100)), 0);

      const selfScore = Math.round(selfScoreSum);
      const managerScore = Math.round(managerScoreSum);
      const finalScore = Math.round(selfScore * 0.3 + managerScore * 0.7);

      await this.db
        .update(employeeAppraisals)
        .set({
          selfScore,
          managerScore,
          finalScore,
          status: appraisal.status === 'pending_self' || appraisal.status === 'pending_manager' ? appraisal.status : 'completed'
        })
        .where(eq(employeeAppraisals.id, appraisal.id));

      updatedCount++;
    }

    return { status: 'success', processed: appraisals.length, updated: updatedCount };
  }

  // --- Appraisals & KPIs ---

  async findAll() {
    const [cycle] = await this.db
      .select()
      .from(appraisalCycles)
      .where(eq(appraisalCycles.status, 'active'))
      .limit(1);

    const activeCycleId = cycle?.id;
    if (!activeCycleId) {
      return {};
    }

    const allEmployees = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.status, 'active'));

    const result: Record<string, any[]> = {};
    for (const emp of allEmployees) {
      result[emp.id] = await this.db
        .select()
        .from(employeeKpis)
        .where(
          and(
            eq(employeeKpis.employeeId, emp.id),
            eq(employeeKpis.cycleId, activeCycleId)
          )
        );
    }
    return result;
  }

  async getEmployeeKpis(employeeId: string, cycleId?: string) {
    let activeCycleId = cycleId;

    if (!activeCycleId) {
      const [cycle] = await this.db
        .select()
        .from(appraisalCycles)
        .where(eq(appraisalCycles.status, 'active'))
        .limit(1);

      if (cycle) {
        activeCycleId = cycle.id;
      } else {
        const [anyCycle] = await this.db
          .select()
          .from(appraisalCycles)
          .limit(1);

        if (anyCycle) {
          activeCycleId = anyCycle.id;
        } else {
          const [newCycle] = await this.db
            .insert(appraisalCycles)
            .values({
              name: 'Initial Appraisal Cycle',
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'active',
              description: 'System generated default appraisal cycle',
            })
            .returning();
          activeCycleId = newCycle.id;
        }
      }
    }

    let kpis = await this.db
      .select()
      .from(employeeKpis)
      .where(
        and(
          eq(employeeKpis.employeeId, employeeId),
          eq(employeeKpis.cycleId, activeCycleId)
        )
      );

    if (kpis.length === 0) {
      const [emp] = await this.db
        .select({
          id: employees.id,
          designationName: designations.name,
        })
        .from(employees)
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!emp) {
        throw new NotFoundException(`Employee with ID "${employeeId}" not found`);
      }

      const role = emp.designationName || '';
      let templates = defaultKPITemplates.general;
      if (role.toLowerCase().includes('engineer') || role.toLowerCase().includes('sre') || role.toLowerCase().includes('developer') || role.toLowerCase().includes('cto')) {
        templates = defaultKPITemplates.engineer;
      } else if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead') || role.toLowerCase().includes('vp') || role.toLowerCase().includes('director')) {
        templates = defaultKPITemplates.manager;
      }

      const valuesToInsert = templates.map(t => ({
        employeeId,
        cycleId: activeCycleId,
        title: t.title,
        description: t.description,
        targetMetric: t.targetMetric,
        weight: t.weight,
        score: 80,
        selfScore: 80,
        managerScore: 80,
      }));

      kpis = await this.db
        .insert(employeeKpis)
        .values(valuesToInsert)
        .returning();
    }

    return kpis;
  }

  async createKpi(dto: CreateKpiDto) {
    const [emp] = await this.db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, dto.employeeId))
      .limit(1);

    if (!emp) {
      throw new NotFoundException(`Employee with ID "${dto.employeeId}" not found`);
    }

    let activeCycleId = dto.cycleId;
    if (!activeCycleId) {
      const [cycle] = await this.db
        .select()
        .from(appraisalCycles)
        .where(eq(appraisalCycles.status, 'active'))
        .limit(1);
      activeCycleId = cycle?.id;
    }

    const [created] = await this.db
      .insert(employeeKpis)
      .values({
        employeeId: dto.employeeId,
        cycleId: activeCycleId,
        title: dto.title,
        description: dto.description,
        targetMetric: dto.targetMetric,
        weight: dto.weight,
        score: 80,
        selfScore: 80,
        managerScore: 80,
      })
      .returning();

    return created;
  }

  async deleteKpi(id: string) {
    const [deleted] = await this.db
      .delete(employeeKpis)
      .where(eq(employeeKpis.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`KPI with ID "${id}" not found`);
    }

    return { message: 'KPI deleted successfully' };
  }

  async saveScores(employeeId: string, dto: UpdateKpiScoresDto) {
    for (const item of dto.scores) {
      await this.db
        .update(employeeKpis)
        .set({ score: item.score, managerScore: item.score })
        .where(eq(employeeKpis.id, item.kpiId));
    }
    return this.getEmployeeKpis(employeeId);
  }

  // --- Multi-Source Appraisals ---

  async getEmployeeAppraisalContext(employeeId: string, cycleId: string) {
    let [appraisal] = await this.db
      .select()
      .from(employeeAppraisals)
      .where(
        and(
          eq(employeeAppraisals.employeeId, employeeId),
          eq(employeeAppraisals.cycleId, cycleId)
        )
      )
      .limit(1);

    if (!appraisal) {
      [appraisal] = await this.db
        .insert(employeeAppraisals)
        .values({
          employeeId,
          cycleId,
          status: 'pending_self',
          selfScore: 0,
          managerScore: 0,
          finalScore: 0,
        })
        .returning();
    }

    const kpis = await this.getEmployeeKpis(employeeId, cycleId);

    return {
      appraisal,
      kpis,
    };
  }

  async submitSelfAppraisal(appraisalId: string, dto: SubmitSelfAppraisalDto) {
    const [appraisal] = await this.db
      .select()
      .from(employeeAppraisals)
      .where(eq(employeeAppraisals.id, appraisalId))
      .limit(1);

    if (!appraisal) {
      throw new NotFoundException(`Appraisal with ID "${appraisalId}" not found`);
    }

    for (const item of dto.scores) {
      await this.db
        .update(employeeKpis)
        .set({
          selfScore: item.selfScore,
          comments: item.comments,
        })
        .where(eq(employeeKpis.id, item.kpiId));
    }

    const kpis = await this.db
      .select()
      .from(employeeKpis)
      .where(
        and(
          eq(employeeKpis.employeeId, appraisal.employeeId),
          eq(employeeKpis.cycleId, appraisal.cycleId)
        )
      );

    const totalWeightedSelf = kpis.reduce((sum, k) => {
      const selfVal = k.selfScore !== null ? k.selfScore : 0;
      return sum + (selfVal * (k.weight / 100));
    }, 0);

    const roundedSelfScore = Math.round(totalWeightedSelf);

    const [updated] = await this.db
      .update(employeeAppraisals)
      .set({
        selfScore: roundedSelfScore,
        selfFeedback: dto.selfFeedback,
        status: 'pending_manager',
      })
      .where(eq(employeeAppraisals.id, appraisalId))
      .returning();

    await this.triggerSelfAppraisalSubmissionNotification(updated);

    return {
      appraisal: updated,
      kpis,
    };
  }

  async submitManagerAppraisal(appraisalId: string, dto: SubmitManagerAppraisalDto, managerId?: string) {
    const [appraisal] = await this.db
      .select()
      .from(employeeAppraisals)
      .where(eq(employeeAppraisals.id, appraisalId))
      .limit(1);

    if (!appraisal) {
      throw new NotFoundException(`Appraisal with ID "${appraisalId}" not found`);
    }

    for (const item of dto.scores) {
      await this.db
        .update(employeeKpis)
        .set({
          managerScore: item.managerScore,
          score: item.managerScore,
          comments: item.comments,
        })
        .where(eq(employeeKpis.id, item.kpiId));
    }

    const kpis = await this.db
      .select()
      .from(employeeKpis)
      .where(
        and(
          eq(employeeKpis.employeeId, appraisal.employeeId),
          eq(employeeKpis.cycleId, appraisal.cycleId)
        )
      );

    const totalWeightedManager = kpis.reduce((sum, k) => {
      const managerVal = k.managerScore !== null ? k.managerScore : 0;
      return sum + (managerVal * (k.weight / 100));
    }, 0);

    const roundedManagerScore = Math.round(totalWeightedManager);

    const [updated] = await this.db
      .update(employeeAppraisals)
      .set({
        managerScore: roundedManagerScore,
        finalScore: roundedManagerScore,
        managerFeedback: dto.managerFeedback,
        status: 'completed',
        promotionRecommended: dto.promotionRecommended ?? false,
        promotionReadiness: dto.promotionReadiness ?? 'not_eligible',
        recommendedDesignationId: dto.recommendedDesignationId || null,
        managerNotes: dto.managerNotes || null,
        completedAt: new Date(),
      })
      .where(eq(employeeAppraisals.id, appraisalId))
      .returning();

    await this.notificationService.emit({
      recipientId: appraisal.employeeId,
      actorId: managerId || undefined,
      module: NotificationModule.PERFORMANCE,
      category: NotificationCategory.STATUS_CHANGE,
      title: 'Performance Appraisal Completed',
      message: `Your manager has completed your performance appraisal. Final Score: ${roundedManagerScore}.`,
      actionUrl: '/performance',
      entityType: 'appraisal',
      entityId: appraisal.id,
    });

    return {
      appraisal: updated,
      kpis,
    };
  }

  private async triggerSelfAppraisalSubmissionNotification(appraisal: any) {
    try {
      const [employee] = await this.db
        .select()
        .from(employees)
        .where(eq(employees.id, appraisal.employeeId))
        .limit(1);

      if (!employee) return;

      const recipientIds = employee.lineManagerId
        ? [employee.lineManagerId]
        : (
            await this.db
              .select({ id: employees.id })
              .from(employees)
              .where(or(eq(employees.role, 'admin'), eq(employees.role, 'hr')))
          ).map((r) => r.id);

      if (recipientIds.length > 0) {
        await this.notificationService.emitBulk(
          recipientIds.map((recipientId) => ({
            recipientId,
            actorId: appraisal.employeeId,
            module: NotificationModule.PERFORMANCE,
            category: NotificationCategory.ASSIGNMENT,
            title: 'Performance Self-Appraisal Submitted',
            message: `${employee.fullNameEnglish} has submitted their performance self-appraisal. Please review it.`,
            actionUrl: `/performance`,
            entityType: 'appraisal',
            entityId: appraisal.id,
          })),
        );
      }
    } catch (err: any) {
      // Ignore
    }
  }

  async getCycleAppraisals(cycleId: string) {
    const activeEmployees = await this.db
      .select({
        id: employees.id,
        fullNameEnglish: employees.fullNameEnglish,
        email: employees.email,
        joinDate: employees.joinDate,
        designationId: employees.designationId,
        employeeId: employees.employeeId,
      })
      .from(employees)
      .where(eq(employees.status, 'active'));

    const allDesignations = await this.db
      .select()
      .from(designations);

    const designationsMap = new Map(allDesignations.map(d => [d.id, d]));

    const appraisals = await this.db
      .select()
      .from(employeeAppraisals)
      .where(eq(employeeAppraisals.cycleId, cycleId));

    const appraisalsMap = new Map(appraisals.map(a => [a.employeeId, a]));

    return activeEmployees.map(emp => {
      const appraisal = appraisalsMap.get(emp.id) || null;
      const currentDesig = designationsMap.get(emp.designationId);
      const recommendedDesig = appraisal?.recommendedDesignationId
        ? designationsMap.get(appraisal.recommendedDesignationId)
        : null;

      return {
        employee: {
          ...emp,
          designationName: currentDesig?.name || 'Staff',
          grade: currentDesig?.grade || '',
        },
        appraisal,
        recommendedDesignation: recommendedDesig
          ? { id: recommendedDesig.id, name: recommendedDesig.name }
          : null,
      };
    });
  }
}
