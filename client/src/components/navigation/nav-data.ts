import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CalendarOff,
  DollarSign,
  CheckSquare,
  FolderKanban,
  Building2,
  BarChart3,
  Settings,
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
        title: "Attendance",
        href: "/attendance",
        icon: CalendarClock,
      },
      {
        title: "Leave Management",
        href: "/leave",
        icon: CalendarOff,
        badge: "3",
      },
      {
        title: "Payroll",
        href: "/payroll",
        icon: DollarSign,
      },
    ],
  },
  {
    label: "Productivity",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
        badge: "12",
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderKanban,
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
