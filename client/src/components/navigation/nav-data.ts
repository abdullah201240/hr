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
      },
      {
        title: "Chats & Channels",
        href: "/chat",
        icon: MessageSquare,
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
        badge: "248",
      },
      {
        title: "Recruitment",
        href: "/recruitment",
        icon: UserPlus,
      },
      {
        title: "Task Management",
        href: "/tasks",
        icon: CheckSquare,
      },
      {
        title: "Attendance",
        href: "/attendance",
        icon: CalendarClock,
      },
      {
        title: "Company Attendance",
        href: "/attendance/company",
        icon: CalendarClock,
      },
      {
        title: "Leave Management",
        href: "/leave",
        icon: CalendarOff,
        badge: "3",
      },
      {
        title: "HR Letters",
        href: "/letters",
        icon: FileText,
        badge: "10",
      },
      {
        title: "Separation",
        href: "/separation",
        icon: UserMinus,
      },
      {
        title: "Disciplinary",
        href: "/disciplinary",
        icon: Scale,
      },
      {
        title: "KPI & Performance",
        href: "/performance",
        icon: Target,
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
      },
      {
        title: "Claims & Reimbursement",
        href: "/claims",
        icon: HeartPulse,
        badge: "3",
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
      },
      {
        title: "Announcements",
        href: "/announcements",
        icon: Megaphone,
      },
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]
