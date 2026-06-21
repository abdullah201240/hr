import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarClock,
  CalendarOff,
  Coins,
  Building2,
  BarChart3,
  Settings,
  HeartPulse,
  Car,
  Plane,
  Megaphone,
  FileText,
  UserMinus,
  Scale,
  Target,
  CheckSquare,
  MessageSquare,
  Bell,
} from "lucide-react"

import type { NavGroup } from "@/types"

export const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        // No roles — visible to all
      },
      {
        title: "Chats & Channels",
        href: "/chat",
        icon: MessageSquare,
        // No roles — visible to all
      },
      {
        title: "Notifications",
        href: "/notifications",
        icon: Bell,
        // No roles — visible to all
      },
    ],
  },
  {
    label: "Workforce",
    items: [
      {
        title: "Employees",
        href: "/employees",
        icon: Users,
        roles: ["admin", "hr", "manager"],
        permissions: ["employees:view_all", "employees:view_team", "employees:read"],
      },
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
        roles: ["admin", "hr"],
        permissions: ["recruitment:read", "recruitment:create"],
      },
      {
        title: "Task Management",
        href: "/tasks",
        icon: CheckSquare,
        // No roles — visible to all
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: CalendarClock,
        // No roles — visible to all
      },
      {
        title: "Company Attendance",
        href: "/attendance/company",
        icon: CalendarClock,
        roles: ["admin", "hr", "manager"],
        permissions: ["employees:view_team", "employees:view_all"],
      },
      {
        title: "Leave Management",
        href: "/leave",
        icon: CalendarOff,
        // No roles — visible to all
      },
      {
        title: "HR Letters",
        href: "/letters",
        icon: FileText,
        roles: ["admin", "hr"],
        permissions: ["letters:read", "letters:create"],
      },
      {
        title: "Separation",
        href: "/separation",
        icon: UserMinus,
        roles: ["admin", "hr"],
        permissions: ["employees:delete"],
      },
      {
        title: "Disciplinary",
        href: "/disciplinary",
        icon: Scale,
        roles: ["admin", "hr"],
        permissions: ["employees:update"],
      },
      {
        title: "KPI & Performance",
        href: "/performance",
        icon: Target,
        roles: ["admin", "hr", "manager"],
        permissions: ["employees:view_team", "employees:view_all"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Salary & Payroll",
        href: "/payroll",
        icon: Coins,
        roles: ["admin", "hr"],
        permissions: ["payroll:read", "payroll:view_all", "payroll:create", "payroll:process"],
      },
      {
        title: "Claims & Reimbursement",
        href: "/claims",
        icon: HeartPulse,
        // No roles — visible to all (employees can file claims)
        items: [
          {
            title: "Medical Reimbursement",
            href: "/claims/medical",
            icon: HeartPulse,
          },
          {
            title: "TA/DA Claim",
            href: "/claims/tada",
            icon: Car,
          },
          {
            title: "Business Travel Advance",
            href: "/claims/advance",
            icon: Plane,
          },
        ],
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Org Structure",
        href: "/departments",
        icon: Building2,
        // No roles — visible to all
      },
      {
        title: "Announcements",
        href: "/announcements",
        icon: Megaphone,
        // No roles — visible to all
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["admin", "hr", "manager"],
        permissions: ["employees:view_team", "employees:view_all", "payroll:read"],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin"],
        permissions: ["settings:read", "settings:update"],
      },
    ],
  },
]
