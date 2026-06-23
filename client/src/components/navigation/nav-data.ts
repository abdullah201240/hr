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
  Crown,
  BookOpenCheck,
} from "lucide-react"

import type { NavGroup } from "@/types"

export const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      {
        title: "Executive Dashboard",
        href: "/ceo-dashboard",
        icon: Crown,
        permissions: ["dashboard:view_executive"],
      },
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
        permissions: ["employees:view_all", "employees:view_team", "employees:read"],
      },
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
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
        permissions: ["employees:view_team", "employees:view_all"],
      },
      {
        title: "Leave Management",
        href: "/leave",
        icon: CalendarOff,
        permissions: ["leave:view_all", "leave:view_team", "leave:approve"],
      },
      {
        title: "HR Letters",
        href: "/letters",
        icon: FileText,
        permissions: ["letters:read", "letters:create"],
      },
      {
        title: "Separation",
        href: "/separation",
        icon: UserMinus,
        permissions: ["employees:delete"],
      },
      {
        title: "Disciplinary",
        href: "/disciplinary",
        icon: Scale,
        permissions: ["employees:update"],
      },
      {
        title: "KPI & Performance",
        href: "/performance",
        icon: Target,
        permissions: ["employees:view_team", "employees:view_all"],
      },
      {
        title: "Office Regulations",
        href: "/regulations",
        icon: BookOpenCheck,
        permissions: ["regulations:read", "regulations:apply", "regulations:view_own", "regulations:view_team", "regulations:view_all", "regulations:approve"],
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
        permissions: ["payroll:read", "payroll:view_all", "payroll:create", "payroll:process"],
      },
      {
        title: "Claims & Reimbursement",
        href: "/claims",
        icon: HeartPulse,
        permissions: ["claims:create", "claims:view_own", "claims:view_team", "claims:view_all", "claims:approve", "claims:reject", "claims:settle", "claims:delete"],
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
        permissions: ["departments:read", "designations:read"],
      },
      {
        title: "Announcements",
        href: "/announcements",
        icon: Megaphone,
        permissions: ["announcements:read", "announcements:create"],
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        permissions: ["employees:view_team", "employees:view_all", "payroll:read"],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        permissions: [
          "settings:read",
          "settings:update",
          "leave:create",
          "leave:update",
          "leave:delete",
          "attendance:create",
          "attendance:update",
          "attendance:delete"
        ],
      },
    ],
  },
]
