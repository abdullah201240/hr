import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  UserCheck,
  CalendarOff,
  Briefcase,
  ClipboardList,
  Coins,
  CheckSquare,
  Receipt,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutiveDashboardData } from "@/hooks/useExecutiveDashboard"

interface KpiMetricCardsProps {
  data: ExecutiveDashboardData | undefined
  isLoading: boolean
}

interface KpiCardConfig {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  trend?: { value: string; positive: boolean }
  badge?: { value: string; variant: "default" | "warning" | "success" | "danger" }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `৳${(amount / 10000000).toFixed(1)}Cr`
  }
  if (amount >= 100000) {
    return `৳${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `৳${(amount / 1000).toFixed(1)}K`
  }
  return `৳${amount.toLocaleString()}`
}

function getCards(data: ExecutiveDashboardData | undefined): KpiCardConfig[] {
  if (!data) {
    return [
      { title: "Total Workforce", value: "—", subtitle: "Active employees", icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-500" },
      { title: "Present Today", value: "—", subtitle: "Attendance rate", icon: UserCheck, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500" },
      { title: "On Leave Today", value: "—", subtitle: "Approved leaves", icon: CalendarOff, iconBg: "bg-amber-500/10", iconColor: "text-amber-500" },
      { title: "Open Positions", value: "—", subtitle: "Recruitment pipeline", icon: Briefcase, iconBg: "bg-violet-500/10", iconColor: "text-violet-500" },
      { title: "Pending Approvals", value: "—", subtitle: "Leave applications", icon: ClipboardList, iconBg: "bg-orange-500/10", iconColor: "text-orange-500" },
      { title: "Monthly Payroll", value: "—", subtitle: "Total disbursement", icon: Coins, iconBg: "bg-cyan-500/10", iconColor: "text-cyan-500" },
      { title: "Active Tasks", value: "—", subtitle: "In progress", icon: CheckSquare, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-500" },
      { title: "Pending Claims", value: "—", subtitle: "Awaiting approval", icon: Receipt, iconBg: "bg-rose-500/10", iconColor: "text-rose-500" },
    ]
  }

  return [
    {
      title: "Total Workforce",
      value: String(data.workforce.activeEmployees),
      subtitle: `${data.workforce.newHiresThisMonth} new hires this month`,
      icon: Users,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      trend: data.workforce.newHiresThisMonth > 0 ? { value: `+${data.workforce.newHiresThisMonth}`, positive: true } : undefined,
    },
    {
      title: "Present Today",
      value: String(data.attendance.presentToday + data.attendance.lateToday),
      subtitle: `${data.attendance.attendanceRate}% attendance rate`,
      icon: UserCheck,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      badge: data.attendance.lateToday > 0 ? { value: `${data.attendance.lateToday} late`, variant: "warning" } : undefined,
    },
    {
      title: "On Leave Today",
      value: String(data.leave.onLeaveToday),
      subtitle: `${data.leave.pendingApplications} pending applications`,
      icon: CalendarOff,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      title: "Open Positions",
      value: String(data.recruitment.openPositions),
      subtitle: `${data.recruitment.pipelineActive} candidates in pipeline`,
      icon: Briefcase,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      trend: data.recruitment.hiredThisMonth > 0 ? { value: `${data.recruitment.hiredThisMonth} hired`, positive: true } : undefined,
    },
    {
      title: "Pending Approvals",
      value: String(data.leave.pendingApplications),
      subtitle: `${data.leave.approvedThisMonth} approved this month`,
      icon: ClipboardList,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      badge: data.leave.pendingApplications > 5 ? { value: "Urgent", variant: "danger" } : undefined,
    },
    {
      title: "Monthly Payroll",
      value: formatCurrency(data.payroll.totalMonthlyPayroll),
      subtitle: `Avg. ${formatCurrency(data.payroll.averageSalary)}/employee`,
      icon: Coins,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-500",
    },
    {
      title: "Active Tasks",
      value: String(data.tasks.totalActive),
      subtitle: `${data.tasks.completedThisWeek} completed this week`,
      icon: CheckSquare,
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-500",
      badge: data.tasks.overdueTasks > 0 ? { value: `${data.tasks.overdueTasks} overdue`, variant: "danger" } : undefined,
    },
    {
      title: "Pending Claims",
      value: String(data.claims.pendingClaims),
      subtitle: `${formatCurrency(data.claims.totalClaimAmount)} total approved`,
      icon: Receipt,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-500",
    },
  ]
}

export function KpiMetricCards({ data, isLoading }: KpiMetricCardsProps) {
  const cards = getCards(data)

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="shadow-none border-border/40 p-4">
            <CardContent className="p-0">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="shadow-none border-border/40 p-4 hover:shadow-sm transition-shadow">
            <CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                    {card.trend && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        card.trend.positive
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      )}>
                        {card.trend.positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {card.trend.value}
                      </span>
                    )}
                    {card.badge && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        card.badge.variant === "danger" && "bg-red-500/10 text-red-600",
                        card.badge.variant === "warning" && "bg-amber-500/10 text-amber-600",
                        card.badge.variant === "success" && "bg-emerald-500/10 text-emerald-600",
                        card.badge.variant === "default" && "bg-muted text-muted-foreground",
                      )}>
                        {card.badge.value}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", card.iconBg)}>
                  <Icon className={cn("h-5 w-5", card.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
