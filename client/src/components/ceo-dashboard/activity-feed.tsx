import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, CalendarOff, CheckSquare, UserPlus, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutiveDashboardData } from "@/hooks/useExecutiveDashboard"

interface ActivityFeedProps {
  data: ExecutiveDashboardData | undefined
}

interface ActivityItem {
  id: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  description: string
  time: string
}

export function ActivityFeed({ data }: ActivityFeedProps) {
  const activities = useMemo<ActivityItem[]>(() => {
    if (!data) return []

    const items: ActivityItem[] = []

    // Leave pending
    if (data.leave.pendingApplications > 0) {
      items.push({
        id: "leave-pending",
        icon: CalendarOff,
        iconColor: "text-amber-500",
        iconBg: "bg-amber-500/10",
        title: "Leave Approvals Pending",
        description: `${data.leave.pendingApplications} applications awaiting review`,
        time: "Now",
      })
    }

    // Overdue tasks
    if (data.tasks.overdueTasks > 0) {
      items.push({
        id: "tasks-overdue",
        icon: AlertTriangle,
        iconColor: "text-red-500",
        iconBg: "bg-red-500/10",
        title: "Overdue Tasks Alert",
        description: `${data.tasks.overdueTasks} tasks past their due date`,
        time: "Now",
      })
    }

    // Recruitment active
    if (data.recruitment.pipelineActive > 0) {
      items.push({
        id: "recruitment-active",
        icon: UserPlus,
        iconColor: "text-violet-500",
        iconBg: "bg-violet-500/10",
        title: "Recruitment Pipeline Active",
        description: `${data.recruitment.pipelineActive} candidates in pipeline`,
        time: "Today",
      })
    }

    // Performance pending
    if (data.performance.pendingSelfAppraisals > 0) {
      items.push({
        id: "perf-self",
        icon: Clock,
        iconColor: "text-orange-500",
        iconBg: "bg-orange-500/10",
        title: "Self Appraisals Pending",
        description: `${data.performance.pendingSelfAppraisals} employees yet to submit`,
        time: "Today",
      })
    }

    // Claims pending
    if (data.claims.pendingClaims > 0) {
      items.push({
        id: "claims-pending",
        icon: CheckSquare,
        iconColor: "text-rose-500",
        iconBg: "bg-rose-500/10",
        title: "Claims Awaiting Approval",
        description: `${data.claims.pendingClaims} claims need review`,
        time: "Today",
      })
    }

    // Attendance today
    if (data.attendance.presentToday > 0 || data.attendance.lateToday > 0) {
      items.push({
        id: "attendance-today",
        icon: CheckCircle2,
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-500/10",
        title: "Today's Attendance",
        description: `${data.attendance.presentToday} present, ${data.attendance.lateToday} late, ${data.attendance.absentToday} absent`,
        time: "Today",
      })
    }

    return items
  }, [data])

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-cyan-500" />
          </div>
          <div>
            <CardTitle className="text-sm">Activity Feed</CardTitle>
            <p className="text-[10px] text-muted-foreground">Real-time system events</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-0">
        {activities.length > 0 ? (
          <ScrollArea className="h-[220px]">
            <div className="divide-y divide-border/20">
              {activities.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-muted/10 transition-colors">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", item.iconBg)}>
                      <Icon className={cn("h-3.5 w-3.5", item.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-[11px] font-semibold text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 font-medium shrink-0">{item.time}</span>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
            No activity to display
          </div>
        )}
      </CardContent>
    </Card>
  )
}
