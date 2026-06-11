import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MoreHorizontal,
  Plus,
  Minus,
  Maximize2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  RotateCcw,
  Crown,
  Shield,
  Star,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string
  personName: string
  title: string
  department: string
  grade: string
  headcount: number
  openRoles: number
  avatarColor: string
  children: OrgNode[]
}

// ── Department Colors ──────────────────────────────────────────────────────────

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
  "Board of Directors": "bg-gradient-to-br from-yellow-500 to-amber-600",
}

const DEPT_BORDER: Record<string, string> = {
  Executive: "border-violet-500/30",
  Engineering: "border-blue-500/30",
  Product: "border-purple-500/30",
  Marketing: "border-pink-500/30",
  Sales: "border-emerald-500/30",
  HR: "border-amber-500/30",
  Finance: "border-cyan-500/30",
  Operations: "border-slate-500/30",
  Legal: "border-red-500/30",
  "Board of Directors": "border-yellow-500/30",
}

// ── Grade Helpers ──────────────────────────────────────────────────────────────

function gradeInfo(grade: string): { label: string; color: string; icon: React.ReactNode } {
  const g = grade.toUpperCase()
  if (g === "C-SUITE" || g === "CEO" || g === "CTO" || g === "CFO" || g === "COO" || g === "CHRO" || g === "CMO")
    return { label: grade, color: "bg-violet-500/15 text-violet-700 dark:text-violet-400", icon: <Crown className="h-2.5 w-2.5" /> }
  if (g.startsWith("VP") || g === "VICE PRESIDENT")
    return { label: "VP", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: <Shield className="h-2.5 w-2.5" /> }
  if (g.startsWith("DIR") || g === "DIRECTOR")
    return { label: "Dir", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: <Star className="h-2.5 w-2.5" /> }
  if (g.startsWith("MGR") || g === "MANAGER")
    return { label: "Mgr", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: <Zap className="h-2.5 w-2.5" /> }
  if (g.startsWith("L4")) return { label: "L4", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400", icon: null }
  if (g.startsWith("L3")) return { label: "L3", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: null }
  if (g.startsWith("L2")) return { label: "L2", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: null }
  return { label: g || "L1", color: "bg-muted text-muted-foreground", icon: null }
}

// ── Default Enterprise Org Tree ────────────────────────────────────────────────

function buildEnterpriseTree(): OrgNode {
  return {
    id: "ceo",
    personName: "Alexandra Reeves",
    title: "Chief Executive Officer",
    department: "Executive",
    grade: "CEO",
    headcount: 1,
    openRoles: 0,
    avatarColor: DEPT_COLORS["Executive"],
    children: [
      // Board Advisors
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
      // CTO
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
      // CPO
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
      // CFO
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
      // CMO
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
      // CRO / VP Sales
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
      // CHRO
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
      // COO
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
  }
}

// ── Tree Node Card (Compact) ─────────────────────────────────────────────────

function OrgCard({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: OrgNode
  onAdd?: (parentId: string, parentName: string) => void
  onEdit?: (node: OrgNode) => void
  onDelete?: (node: OrgNode) => void
}) {
  const initials = node.personName === "—"
    ? "—"
    : node.personName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const gi = gradeInfo(node.grade)
  const borderColor = DEPT_BORDER[node.department] || "border-border/50"

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 w-[150px] sm:w-[160px] rounded-xl border bg-card/90 shadow-xs hover:shadow-sm transition-all overflow-hidden",
        borderColor,
      )}
    >
      {/* Left color strip */}
      <div className={cn("w-1 self-stretch shrink-0", node.avatarColor)} />

      <div className="flex items-center gap-2 py-2 pr-1.5 flex-1 min-w-0">
        {/* Avatar */}
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0", node.avatarColor)}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-foreground truncate leading-tight">
            {node.personName === "—" ? node.title : node.personName}
          </p>
          {node.personName !== "—" && (
            <p className="text-[8px] text-muted-foreground truncate leading-tight">{node.title}</p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn("text-[7px] font-bold px-1 py-px rounded", gi.color)}>
              {gi.label}
            </span>
            <span className="text-[7px] text-muted-foreground flex items-center gap-px">
              <Users className="h-2 w-2" />{node.headcount}
            </span>
            {node.openRoles > 0 && (
              <span className="text-[7px] font-bold text-emerald-600">+{node.openRoles}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions menu */}
      <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-4 w-4 rounded bg-background/80 border border-border/40 flex items-center justify-center hover:bg-muted transition-colors">
              <MoreHorizontal className="h-2 w-2" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {onAdd && (
              <DropdownMenuItem onClick={() => onAdd(node.id, node.personName)}>
                <Plus className="mr-2 h-3 w-3" /> Add Report
              </DropdownMenuItem>
            )}
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Pencil className="mr-2 h-3 w-3" /> Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                <Trash2 className="mr-2 h-3 w-3" /> Remove
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ── Recursive Tree Layout ──────────────────────────────────────────────────────

function TreeBranch({
  node,
  onAdd,
  onEdit,
  onDelete,
  collapsed,
  toggleCollapse,
}: {
  node: OrgNode
  onAdd?: (parentId: string, parentName: string) => void
  onEdit?: (node: OrgNode) => void
  onDelete?: (node: OrgNode) => void
  collapsed: Set<string>
  toggleCollapse: (id: string) => void
}) {
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative">
        <OrgCard node={node} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />

        {/* Collapse toggle */}
        {hasChildren && (
          <button
            onClick={() => toggleCollapse(node.id)}
            className={cn(
              "absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 h-5 w-5 rounded-full border border-background bg-card flex items-center justify-center shadow-xs hover:bg-muted transition-colors",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground rotate-90" />
            ) : (
              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
            )}
            {isCollapsed && (
              <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[7px] font-bold flex items-center justify-center">
                {node.children.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Connector line down */}
      {hasChildren && !isCollapsed && (
        <div className="w-[1.5px] h-3 bg-border/50" />
      )}

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div className="relative">
          {/* Horizontal connector bar */}
          {node.children.length > 1 && (
            <div
              className="absolute top-0 h-[1.5px] bg-border/50"
              style={{
                left: `calc(50% / ${node.children.length})`,
                right: `calc(50% / ${node.children.length})`,
              }}
            />
          )}

          <div className="flex items-start gap-2 sm:gap-3">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-[1.5px] h-3 bg-border/50" />
                <TreeBranch
                  node={child}
                  onAdd={onAdd}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  collapsed={collapsed}
                  toggleCollapse={toggleCollapse}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main OrgChart Component ────────────────────────────────────────────────────

export default function OrgChart() {
  const [tree, setTree] = useState<OrgNode>(() => {
    const stored = localStorage.getItem("org_chart_tree_v2")
    if (stored) {
      try { return JSON.parse(stored) } catch { /* fallback */ }
    }
    return buildEnterpriseTree()
  })

  const [filterDept, setFilterDept] = useState<string>("all")
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // Default: collapse all nodes so user sees CEO + direct reports only
    const ids = new Set<string>()
    const collectAll = (n: OrgNode) => {
      if (n.children.length > 0) ids.add(n.id)
      n.children.forEach(collectAll)
    }
    const stored = localStorage.getItem("org_chart_tree_v2")
    let initialTree: OrgNode
    if (stored) {
      try { initialTree = JSON.parse(stored) } catch { initialTree = buildEnterpriseTree() }
    } else {
      initialTree = buildEnterpriseTree()
    }
    collectAll(initialTree)
    return ids
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [parentInfo, setParentInfo] = useState<{ id: string; name: string } | null>(null)
  const [formName, setFormName] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formDept, setFormDept] = useState("Engineering")
  const [formGrade, setFormGrade] = useState("L1")
  const [formCount, setFormCount] = useState("1")
  const [formOpenRoles, setFormOpenRoles] = useState("0")
  const [zoomScale, setZoomScale] = useState(0.7)

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const ZOOM_STEPS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

  const zoomIn = () => {
    setZoomScale((s) => ZOOM_STEPS.find((z) => z > s + 0.01) ?? 1.0)
  }
  const zoomOut = () => {
    setZoomScale((s) => [...ZOOM_STEPS].reverse().find((z) => z < s - 0.01) ?? 0.3)
  }
  const zoomReset = () => setZoomScale(0.7)

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const persistTree = (newTree: OrgNode) => {
    setTree(newTree)
    localStorage.setItem("org_chart_tree_v2", JSON.stringify(newTree))
  }

  const openAddDialog = (parentId: string, parentName: string) => {
    setDialogMode("add")
    setParentInfo({ id: parentId, name: parentName })
    setFormName("")
    setFormTitle("")
    setFormDept("Engineering")
    setFormGrade("L1")
    setFormCount("1")
    setFormOpenRoles("0")
    setDialogOpen(true)
  }

  const openEditDialog = (node: OrgNode) => {
    setDialogMode("edit")
    setEditingNode(node)
    setFormName(node.personName)
    setFormTitle(node.title)
    setFormDept(node.department)
    setFormGrade(node.grade)
    setFormCount(String(node.headcount))
    setFormOpenRoles(String(node.openRoles))
    setDialogOpen(true)
  }

  const findAndMutate = (parent: OrgNode, targetId: string, fn: (n: OrgNode) => OrgNode): OrgNode => {
    if (parent.id === targetId) return fn(parent)
    return { ...parent, children: parent.children.map((c) => findAndMutate(c, targetId, fn)) }
  }

  const handleDelete = (node: OrgNode) => {
    const remove = (p: OrgNode): OrgNode => ({
      ...p, children: p.children.filter((c) => c.id !== node.id).map(remove),
    })
    persistTree(remove(tree))
  }

  const handleSave = () => {
    if (!formName.trim() || !formTitle.trim()) return
    const deptColor = DEPT_COLORS[formDept] || DEPT_COLORS["Engineering"]

    if (dialogMode === "add" && parentInfo) {
      const newNode: OrgNode = {
        id: `node-${Date.now()}`,
        personName: formName.trim(),
        title: formTitle.trim(),
        department: formDept,
        grade: formGrade,
        headcount: parseInt(formCount) || 1,
        openRoles: parseInt(formOpenRoles) || 0,
        avatarColor: deptColor,
        children: [],
      }
      const addChild = (p: OrgNode): OrgNode => {
        if (p.id === parentInfo.id) return { ...p, children: [...p.children, newNode] }
        return { ...p, children: p.children.map(addChild) }
      }
      persistTree(addChild(tree))
    }

    if (dialogMode === "edit" && editingNode) {
      persistTree(findAndMutate(tree, editingNode.id, (n) => ({
        ...n,
        personName: formName.trim(),
        title: formTitle.trim(),
        department: formDept,
        grade: formGrade,
        headcount: parseInt(formCount) || 1,
        openRoles: parseInt(formOpenRoles) || 0,
        avatarColor: deptColor,
      })))
    }

    setDialogOpen(false)
    setEditingNode(null)
    setParentInfo(null)
  }

  const handleReset = () => {
    persistTree(buildEnterpriseTree())
    setCollapsed(new Set())
  }

  const handleCollapseAll = () => {
    const ids = new Set<string>()
    const collect = (n: OrgNode) => { if (n.children.length) ids.add(n.id); n.children.forEach(collect) }
    collect(tree)
    setCollapsed(ids)
  }

  const handleExpandAll = () => setCollapsed(new Set())

  // ── Filtered tree ────────────────────────────────────────────────────────

  const filteredTree: OrgNode = filterDept === "all"
    ? tree
    : {
        ...tree,
        children: tree.children.filter(
          (c) => c.department === filterDept || c.children.some((gc) => gc.department === filterDept),
        ).map((c) => ({
          ...c,
          children: c.children.filter((gc) => gc.department === filterDept),
        })),
      }

  // ── Stats ────────────────────────────────────────────────────────────────

  const countAll = (n: OrgNode): { nodes: number; people: number; open: number } => {
    let nodes = 1, people = n.headcount, open = n.openRoles
    n.children.forEach((c) => {
      const r = countAll(c)
      nodes += r.nodes
      people += r.people
      open += r.open
    })
    return { nodes, people, open }
  }
  const stats = countAll(filteredTree)

  // Unique departments in filtered tree
  const allDepts = new Set<string>()
  const collectDepts = (n: OrgNode) => { allDepts.add(n.department); n.children.forEach(collectDepts) }
  collectDepts(tree)

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-200px)]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {[...allDepts].sort().map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExpandAll}>
            <ChevronDown className="h-3 w-3" /> Expand All
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCollapseAll}>
            <ChevronRight className="h-3 w-3" /> Collapse All
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold">{stats.nodes} positions</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            {stats.people} people
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
            {stats.open} open roles
          </span>
        </div>
      </div>

      {/* Org Chart Canvas with Zoom */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
        {/* Zoom Controls floating top-right */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-card/95 backdrop-blur rounded-lg border border-border/50 shadow-sm p-0.5">
          <button
            onClick={zoomOut}
            disabled={zoomScale <= 0.3}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground min-w-[32px] text-center select-none">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoomScale >= 1.0}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="w-px h-4 bg-border/50" />
          <button
            onClick={zoomReset}
            className="h-7 px-1.5 flex items-center justify-center rounded hover:bg-muted transition-colors text-[9px] font-bold text-muted-foreground"
            title="Fit to screen"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>

        {/* Scrollable canvas */}
        <div className="h-full overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div
            className="inline-flex justify-center p-6 origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
          >
            <TreeBranch
              node={filteredTree}
              onAdd={openAddDialog}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
            />
          </div>
        </div>
      </div>

      {/* Legend - compact */}
      <div className="flex items-center gap-2 flex-wrap text-[9px] shrink-0">
        <span className="font-bold text-foreground/40 uppercase tracking-wider mr-1">Grade:</span>
        {[
          { grade: "CEO", label: "CEO" },
          { grade: "VP", label: "VP" },
          { grade: "Director", label: "Dir" },
          { grade: "Manager", label: "Mgr" },
          { grade: "L3", label: "Sr" },
          { grade: "L2", label: "Mid" },
          { grade: "L1", label: "Jr" },
        ].map(({ grade, label }) => {
          const gi = gradeInfo(grade)
          return (
            <span key={grade} className="flex items-center gap-0.5">
              <span className={cn("text-[8px] font-bold px-1 py-px rounded", gi.color)}>
                {gi.label}
              </span>
              <span className="text-muted-foreground">{label}</span>
            </span>
          )
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Direct Report" : "Edit Position"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? `Adding a new position under "${parentInfo?.name}"`
                : "Update position details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Person Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. John Smith" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Job Title</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...allDepts].sort().map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Grade Level</Label>
                <Select value={formGrade} onValueChange={setFormGrade}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C-SUITE">C-Suite</SelectItem>
                    <SelectItem value="VP">Vice President</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="L4">L4 – Senior Lead</SelectItem>
                    <SelectItem value="L3">L3 – Senior</SelectItem>
                    <SelectItem value="L2">L2 – Mid</SelectItem>
                    <SelectItem value="L1">L1 – Junior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Headcount</Label>
                <Input type="number" min={0} value={formCount} onChange={(e) => setFormCount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Open Roles</Label>
                <Input type="number" min={0} value={formOpenRoles} onChange={(e) => setFormOpenRoles(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim() || !formTitle.trim()}>
              {dialogMode === "add" ? "Add Position" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
