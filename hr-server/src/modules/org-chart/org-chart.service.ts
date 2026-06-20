import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../db';
import { orgChartNodes } from '../../db/schema';
import { CreateOrgNodeDto, UpdateOrgNodeDto } from './dto/org-chart.dto';

const DEPT_COLORS: Record<string, string> = {
  Executive: "bg-gradient-to-br from-violet-500 to-purple-600",
  Engineering: "bg-gradient-to-br from-blue-500 to-indigo-600",
  Product: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  Marketing: "bg-gradient-to-br from-pink-500 to-rose-600",
  Sales: "bg-gradient-to-br from-emerald-500 to-teal-600",
  HR: "bg-gradient-to-br from-amber-500 to-orange-600",
  Finance: "bg-gradient-to-br from-cyan-500 to-sky-600",
  Operations: "bg-gradient-to-br from-slate-500 to-zinc-600",
  Legal: "bg-gradient-to-br from-red-500 to-rose-700",
};

const defaultEnterpriseTree = {
  id: "ceo",
  personName: "Alexandra Reeves",
  title: "Chief Executive Officer",
  department: "Executive",
  grade: "CEO",
  headcount: 1,
  openRoles: 0,
  avatarColor: DEPT_COLORS["Executive"],
  children: [
    {
      id: "advisor-strategy",
      personName: "Richard Okafor",
      title: "Chief Strategy Advisor",
      department: "Executive",
      grade: "C-SUITE",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Executive"],
      children: [],
    },
    {
      id: "advisor-legal",
      personName: "Natasha Petrov",
      title: "General Counsel",
      department: "Legal",
      grade: "C-SUITE",
      headcount: 3,
      openRoles: 1,
      avatarColor: DEPT_COLORS["Legal"],
      children: [
        { id: "legal-corp", personName: "David Okonkwo", title: "Corporate Counsel", department: "Legal", grade: "Director", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Legal"], children: [] },
        { id: "legal-compliance", personName: "Aisha Rahman", title: "Compliance Officer", department: "Legal", grade: "Manager", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Legal"], children: [] },
      ],
    },
    {
      id: "cto",
      personName: "Michael Torres",
      title: "Chief Technology Officer",
      department: "Engineering",
      grade: "CTO",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Engineering"],
      children: [
        {
          id: "vp-eng",
          personName: "James Nakamura",
          title: "VP of Engineering",
          department: "Engineering",
          grade: "VP",
          headcount: 1,
          openRoles: 0,
          avatarColor: DEPT_COLORS["Engineering"],
          children: [
            {
              id: "dir-eng-platform",
              personName: "Priya Sharma",
              title: "Director, Platform",
              department: "Engineering",
              grade: "Director",
              headcount: 1,
              openRoles: 0,
              avatarColor: DEPT_COLORS["Engineering"],
              children: [
                { id: "mgr-sre", personName: "Carlos Rivera", title: "Engineering Manager, SRE", department: "Engineering", grade: "L4", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [
                  { id: "lead-sre", personName: "Kim Seo-yeon", title: "Tech Lead, SRE", department: "Engineering", grade: "L3", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "sr-sre", personName: "—", title: "Senior SRE Engineer", department: "Engineering", grade: "L2", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "sre", personName: "—", title: "SRE Engineer", department: "Engineering", grade: "L1", headcount: 6, openRoles: 2, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                ] },
                { id: "mgr-backend", personName: "Olu Adeyemi", title: "Engineering Manager, Backend", department: "Engineering", grade: "L4", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [
                  { id: "lead-backend", personName: "Sarah Mitchell", title: "Tech Lead, Backend", department: "Engineering", grade: "L3", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "sr-backend", personName: "—", title: "Senior Backend Engineer", department: "Engineering", grade: "L2", headcount: 8, openRoles: 2, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "be-eng", personName: "—", title: "Backend Engineer", department: "Engineering", grade: "L1", headcount: 12, openRoles: 3, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                ] },
              ],
            },
            {
              id: "dir-eng-frontend",
              personName: "Lisa Chen",
              title: "Director, Frontend",
              department: "Engineering",
              grade: "Director",
              headcount: 1,
              openRoles: 0,
              avatarColor: DEPT_COLORS["Engineering"],
              children: [
                { id: "mgr-frontend", personName: "Emily Zhang", title: "Engineering Manager, Frontend", department: "Engineering", grade: "L4", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [
                  { id: "lead-fe", personName: "Marcus Brown", title: "Tech Lead, Frontend", department: "Engineering", grade: "L3", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "sr-fe", personName: "—", title: "Senior Frontend Engineer", department: "Engineering", grade: "L2", headcount: 5, openRoles: 1, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "fe-eng", personName: "—", title: "Frontend Engineer", department: "Engineering", grade: "L1", headcount: 8, openRoles: 2, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                ] },
                { id: "mgr-qa", personName: "Ravi Patel", title: "QA Manager", department: "Engineering", grade: "L4", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [
                  { id: "sr-qa", personName: "—", title: "Senior QA Engineer", department: "Engineering", grade: "L2", headcount: 3, openRoles: 1, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                  { id: "qa", personName: "—", title: "QA Engineer", department: "Engineering", grade: "L1", headcount: 5, openRoles: 1, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                ] },
              ],
            },
            {
              id: "dir-eng-data",
              personName: "Yuki Tanaka",
              title: "Director, Data & AI",
              department: "Engineering",
              grade: "Director",
              headcount: 1,
              openRoles: 1,
              avatarColor: DEPT_COLORS["Engineering"],
              children: [
                { id: "lead-data", personName: "Ahmed Hassan", title: "Tech Lead, Data", department: "Engineering", grade: "L3", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                { id: "sr-data", personName: "—", title: "Senior Data Engineer", department: "Engineering", grade: "L2", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Engineering"], children: [] },
                { id: "ml-eng", personName: "—", title: "ML Engineer", department: "Engineering", grade: "L2", headcount: 3, openRoles: 2, avatarColor: DEPT_COLORS["Engineering"], children: [] },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cpo",
      personName: "Sarah Chen",
      title: "Chief Product Officer",
      department: "Product",
      grade: "C-SUITE",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Product"],
      children: [
        {
          id: "vp-product",
          personName: "Daniel Osei",
          title: "VP of Product",
          department: "Product",
          grade: "VP",
          headcount: 1,
          openRoles: 0,
          avatarColor: DEPT_COLORS["Product"],
          children: [
            { id: "pm-growth", personName: "Sophia Laurent", title: "Director, Growth Product", department: "Product", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Product"], children: [
              { id: "pm-sr1", personName: "—", title: "Senior Product Manager", department: "Product", grade: "L3", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Product"], children: [] },
              { id: "pm-1", personName: "—", title: "Product Manager", department: "Product", grade: "L2", headcount: 6, openRoles: 2, avatarColor: DEPT_COLORS["Product"], children: [] },
            ] },
            { id: "dir-design", personName: "Maya Johansson", title: "Director, Product Design", department: "Product", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Product"], children: [
              { id: "lead-ux", personName: "Tomás García", title: "Lead UX Designer", department: "Product", grade: "L3", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Product"], children: [] },
              { id: "sr-designer", personName: "—", title: "Senior Designer", department: "Product", grade: "L2", headcount: 5, openRoles: 1, avatarColor: DEPT_COLORS["Product"], children: [] },
              { id: "designer", personName: "—", title: "Designer", department: "Product", grade: "L1", headcount: 4, openRoles: 2, avatarColor: DEPT_COLORS["Product"], children: [] },
            ] },
          ],
        },
      ],
    },
    {
      id: "cfo",
      personName: "Thomas Wright",
      title: "Chief Financial Officer",
      department: "Finance",
      grade: "CFO",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Finance"],
      children: [
        {
          id: "vp-finance",
          personName: "Hannah Müller",
          title: "VP of Finance",
          department: "Finance",
          grade: "VP",
          headcount: 1,
          openRoles: 0,
          avatarColor: DEPT_COLORS["Finance"],
          children: [
            { id: "dir-accounting", personName: "Grace Abiodun", title: "Director, Accounting", department: "Finance", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Finance"], children: [
              { id: "mgr-acct", personName: "—", title: "Accounting Manager", department: "Finance", grade: "Manager", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Finance"], children: [] },
              { id: "sr-analyst", personName: "—", title: "Senior Finance Analyst", department: "Finance", grade: "L2", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Finance"], children: [] },
              { id: "analyst", personName: "—", title: "Finance Analyst", department: "Finance", grade: "L1", headcount: 6, openRoles: 2, avatarColor: DEPT_COLORS["Finance"], children: [] },
            ] },
            { id: "dir-treasury", personName: "Robert Kim", title: "Director, Treasury", department: "Finance", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Finance"], children: [
              { id: "treasury-mgr", personName: "—", title: "Treasury Manager", department: "Finance", grade: "Manager", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Finance"], children: [] },
            ] },
          ],
        },
      ],
    },
    {
      id: "cmo",
      personName: "Anna Williams",
      title: "Chief Marketing Officer",
      department: "Marketing",
      grade: "CMO",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Marketing"],
      children: [
        {
          id: "dir-marketing",
          personName: "Isabelle Moreau",
          title: "Director, Marketing",
          department: "Marketing",
          grade: "Director",
          headcount: 1,
          openRoles: 0,
          avatarColor: DEPT_COLORS["Marketing"],
          children: [
            { id: "mgr-content", personName: "Nia Williams", title: "Content Marketing Manager", department: "Marketing", grade: "Manager", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Marketing"], children: [
              { id: "content-sr", personName: "—", title: "Senior Content Strategist", department: "Marketing", grade: "L2", headcount: 3, openRoles: 0, avatarColor: DEPT_COLORS["Marketing"], children: [] },
              { id: "content-jr", personName: "—", title: "Content Writer", department: "Marketing", grade: "L1", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Marketing"], children: [] },
            ] },
            { id: "mgr-growth-mkt", personName: "Leo Chang", title: "Growth Marketing Manager", department: "Marketing", grade: "Manager", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Marketing"], children: [
              { id: "growth-sr", personName: "—", title: "Senior Growth Marketer", department: "Marketing", grade: "L2", headcount: 3, openRoles: 1, avatarColor: DEPT_COLORS["Marketing"], children: [] },
              { id: "seo-spec", personName: "—", title: "SEO Specialist", department: "Marketing", grade: "L1", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Marketing"], children: [] },
            ] },
            { id: "mgr-brand", personName: "Zara Ibrahim", title: "Brand Manager", department: "Marketing", grade: "Manager", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Marketing"], children: [
              { id: "brand-designer", personName: "—", title: "Brand Designer", department: "Marketing", grade: "L2", headcount: 2, openRoles: 1, avatarColor: DEPT_COLORS["Marketing"], children: [] },
            ] },
          ],
        },
      ],
    },
    {
      id: "vp-sales",
      personName: "Robert Davis",
      title: "VP of Sales",
      department: "Sales",
      grade: "VP",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Sales"],
      children: [
        { id: "dir-sales-am", personName: "Marcus Johnson", title: "Director, Account Management", department: "Sales", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Sales"], children: [
          { id: "mgr-am", personName: "—", title: "Account Manager", department: "Sales", grade: "Manager", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Sales"], children: [] },
          { id: "sr-am", personName: "—", title: "Senior Account Exec", department: "Sales", grade: "L2", headcount: 6, openRoles: 2, avatarColor: DEPT_COLORS["Sales"], children: [] },
          { id: "am-jr", personName: "—", title: "Account Executive", department: "Sales", grade: "L1", headcount: 10, openRoles: 4, avatarColor: DEPT_COLORS["Sales"], children: [] },
        ] },
        { id: "dir-sales-bd", personName: "Chen Wei", title: "Director, Business Development", department: "Sales", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Sales"], children: [
          { id: "bd-mgr", personName: "—", title: "BD Manager", department: "Sales", grade: "Manager", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Sales"], children: [] },
          { id: "bd-sr", personName: "—", title: "Senior BD Rep", department: "Sales", grade: "L2", headcount: 5, openRoles: 2, avatarColor: DEPT_COLORS["Sales"], children: [] },
          { id: "bd-rep", personName: "—", title: "BD Representative", department: "Sales", grade: "L1", headcount: 8, openRoles: 3, avatarColor: DEPT_COLORS["Sales"], children: [] },
        ] },
        { id: "dir-cs", personName: "Fatima Al-Sayed", title: "Director, Customer Success", department: "Sales", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Sales"], children: [
          { id: "csm-sr", personName: "—", title: "Senior CSM", department: "Sales", grade: "L2", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Sales"], children: [] },
          { id: "csm-jr", personName: "—", title: "Customer Success Mgr", department: "Sales", grade: "L1", headcount: 6, openRoles: 2, avatarColor: DEPT_COLORS["Sales"], children: [] },
        ] },
      ],
    },
    {
      id: "chro",
      personName: "Patricia Lee",
      title: "Chief Human Resources Officer",
      department: "HR",
      grade: "CHRO",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["HR"],
      children: [
        { id: "dir-talent", personName: "Omar El-Din", title: "Director, Talent Acquisition", department: "HR", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["HR"], children: [
          { id: "recruiter-sr", personName: "—", title: "Senior Recruiter", department: "HR", grade: "L2", headcount: 3, openRoles: 1, avatarColor: DEPT_COLORS["HR"], children: [] },
          { id: "recruiter-jr", personName: "—", title: "Recruiter", department: "HR", grade: "L1", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["HR"], children: [] },
        ] },
        { id: "dir-people", personName: "Amina Diallo", title: "Director, People Operations", department: "HR", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["HR"], children: [
          { id: "hrbp-sr", personName: "—", title: "Senior HR Business Partner", department: "HR", grade: "L2", headcount: 3, openRoles: 0, avatarColor: DEPT_COLORS["HR"], children: [] },
          { id: "hr-coord", personName: "—", title: "HR Coordinator", department: "HR", grade: "L1", headcount: 2, openRoles: 1, avatarColor: DEPT_COLORS["HR"], children: [] },
        ] },
      ],
    },
    {
      id: "coo",
      personName: "Kenji Watanabe",
      title: "Chief Operating Officer",
      department: "Operations",
      grade: "COO",
      headcount: 1,
      openRoles: 0,
      avatarColor: DEPT_COLORS["Operations"],
      children: [
        { id: "dir-ops", personName: "Samantha Okafor", title: "Director, Operations", department: "Operations", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Operations"], children: [
          { id: "ops-mgr", personName: "—", title: "Operations Manager", department: "Operations", grade: "Manager", headcount: 2, openRoles: 0, avatarColor: DEPT_COLORS["Operations"], children: [] },
          { id: "ops-analyst", personName: "—", title: "Operations Analyst", department: "Operations", grade: "L2", headcount: 3, openRoles: 1, avatarColor: DEPT_COLORS["Operations"], children: [] },
        ] },
        { id: "dir-it", personName: "Viktor Novak", title: "Director, IT & Infrastructure", department: "Operations", grade: "Director", headcount: 1, openRoles: 0, avatarColor: DEPT_COLORS["Operations"], children: [
          { id: "it-sr", personName: "—", title: "Senior IT Engineer", department: "Operations", grade: "L2", headcount: 3, openRoles: 0, avatarColor: DEPT_COLORS["Operations"], children: [] },
          { id: "it-support", personName: "—", title: "IT Support Specialist", department: "Operations", grade: "L1", headcount: 4, openRoles: 1, avatarColor: DEPT_COLORS["Operations"], children: [] },
        ] },
      ],
    },
  ],
};

function flattenNodes(node: any, parentId: string | null = null): any[] {
  const flatList = [];
  const { children, ...rest } = node;
  flatList.push({ ...rest, parentId });
  if (children && children.length > 0) {
    for (const child of children) {
      flatList.push(...flattenNodes(child, node.id));
    }
  }
  return flatList;
}

function buildTree(nodes: any[]): any {
  const idMap = new Map<string, any>();
  nodes.forEach(node => {
    idMap.set(node.id, { ...node, children: [] });
  });
  let root = null;
  nodes.forEach(node => {
    const mapped = idMap.get(node.id);
    if (!node.parentId) {
      root = mapped;
    } else {
      const parent = idMap.get(node.parentId);
      if (parent) {
        parent.children.push(mapped);
      }
    }
  });
  return root;
}

@Injectable()
export class OrgChartService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
  ) {}

  async getTree() {
    const nodes = await this.db.select().from(orgChartNodes);

    if (nodes.length === 0) {
      await this.resetTree();
      const freshNodes = await this.db.select().from(orgChartNodes);
      return buildTree(freshNodes);
    }

    return buildTree(nodes);
  }

  async createNode(dto: CreateOrgNodeDto) {
    const [created] = await this.db
      .insert(orgChartNodes)
      .values({
        id: dto.id,
        parentId: dto.parentId || null,
        personName: dto.personName,
        title: dto.title,
        department: dto.department,
        grade: dto.grade,
        headcount: dto.headcount !== undefined ? dto.headcount : 1,
        openRoles: dto.openRoles !== undefined ? dto.openRoles : 0,
        avatarColor: dto.avatarColor,
      })
      .returning();

    return created;
  }

  async updateNode(id: string, dto: UpdateOrgNodeDto) {
    const [updated] = await this.db
      .update(orgChartNodes)
      .set({
        ...(dto.personName !== undefined && { personName: dto.personName }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.grade !== undefined && { grade: dto.grade }),
        ...(dto.headcount !== undefined && { headcount: dto.headcount }),
        ...(dto.openRoles !== undefined && { openRoles: dto.openRoles }),
        ...(dto.avatarColor !== undefined && { avatarColor: dto.avatarColor }),
      })
      .where(eq(orgChartNodes.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException(`Org node with ID "${id}" not found`);
    }

    return updated;
  }

  async deleteNode(id: string) {
    // Note: Drizzle cascade delete handles children hierarchy, but let's confirm the row is deleted
    const [deleted] = await this.db
      .delete(orgChartNodes)
      .where(eq(orgChartNodes.id, id))
      .returning();

    if (!deleted) {
      throw new NotFoundException(`Org node with ID "${id}" not found`);
    }

    return { message: 'Org node and descendants deleted successfully' };
  }

  async resetTree() {
    // Clean all existing
    await this.db.delete(orgChartNodes);

    // Flatten and seed
    const flatList = flattenNodes(defaultEnterpriseTree);

    // We must insert them level by level so the parent references exist in Postgres (FK validation)
    // A simple way to guarantee parent is inserted before child is sorting them by a BFS/level traversal,
    // which our flattenNodes function already guarantees because it starts at root and goes down recursively.
    // However, to be 100% safe, we will insert them one by one sequentially since the order in flatList
    // guarantees parent is always added before child.
    for (const node of flatList) {
      await this.db
        .insert(orgChartNodes)
        .values({
          id: node.id,
          parentId: node.parentId,
          personName: node.personName,
          title: node.title,
          department: node.department,
          grade: node.grade,
          headcount: node.headcount,
          openRoles: node.openRoles,
          avatarColor: node.avatarColor,
        });
    }

    const seeded = await this.db.select().from(orgChartNodes);
    return buildTree(seeded);
  }
}
