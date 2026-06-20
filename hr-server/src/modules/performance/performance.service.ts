import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { employeeKpis, employees, designations } from '../../db/schema';
import { CreateKpiDto, UpdateKpiScoresDto } from './dto/performance.dto';

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
  ) {}

  async findAll() {
    const allEmployees = await this.db
      .select({ id: employees.id })
      .from(employees);

    const result: Record<string, any[]> = {};
    for (const emp of allEmployees) {
      result[emp.id] = await this.getEmployeeKpis(emp.id);
    }
    return result;
  }

  async getEmployeeKpis(employeeId: string) {
    // 1. Fetch existing KPIs
    let kpis = await this.db
      .select()
      .from(employeeKpis)
      .where(eq(employeeKpis.employeeId, employeeId));

    // 2. Seed default templates if none exist
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

      // Seed them
      const valuesToInsert = templates.map(t => ({
        employeeId,
        title: t.title,
        description: t.description,
        targetMetric: t.targetMetric,
        weight: t.weight,
        score: 80, // Default initial benchmark score
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

    const [created] = await this.db
      .insert(employeeKpis)
      .values({
        employeeId: dto.employeeId,
        title: dto.title,
        description: dto.description,
        targetMetric: dto.targetMetric,
        weight: dto.weight,
        score: 80,
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
        .set({ score: item.score })
        .where(eq(employeeKpis.id, item.kpiId));
    }
    return this.getEmployeeKpis(employeeId);
  }
}
