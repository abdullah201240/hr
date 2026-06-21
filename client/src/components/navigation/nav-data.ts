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
        roles: ["admin", "hr", "manager"], // Employees cannot browse the directory
      },
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
        roles: ["admin", "hr"], // Recruitment is HR-only
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
        roles: ["admin", "hr", "manager"], // Team-level view
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
        roles: ["admin", "hr"], // Letters are HR-only
      },
      {
        title: "Separation",
        href: "/separation",
        icon: UserMinus,
        roles: ["admin", "hr"], // Separation is HR-only
      },
      {
        title: "Disciplinary",
        href: "/disciplinary",
        icon: Scale,
        roles: ["admin", "hr"], // Disciplinary is HR-only
      },
      {
        title: "KPI & Performance",
        href: "/performance",
        icon: Target,
        roles: ["admin", "hr", "manager"], // Managers review team performance
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
        roles: ["admin", "hr"], // Payroll is HR-only
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
        roles: ["admin", "hr", "manager"], // Reports for managers+
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin"], // Settings for super admin only
      },
    ],
  },
]
