import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { CalendarOff } from "lucide-react"
import type { LeaveStats } from "@/hooks/useExecutiveDashboard"

interface LeaveAnalyticsProps {
  data: LeaveStats | undefined
}

const LEAVE_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1",
]

export function LeaveAnalytics({ data }: LeaveAnalyticsProps) {
  const typeData = data?.leaveTypeBreakdown?.map((t, i) => ({
    name: t.type,
    value: t.count,
    fill: LEAVE_COLORS[i % LEAVE_COLORS.length],
  })) || []

  const statusData = [
    { name: "Pending", count: data?.pendingApplications ?? 0, fill: "#f59e0b" },
    { name: "Approved", count: data?.approvedThisMonth ?? 0, fill: "#10b981" },
    { name: "Rejected", count: data?.rejectedThisMonth ?? 0, fill: "#ef4444" },
  ].filter((d) => d.count > 0)

  const typeConfig = typeData.reduce((acc, item, i) => {
    acc[item.name] = { label: item.name, color: LEAVE_COLORS[i % LEAVE_COLORS.length] }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <CalendarOff className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-sm">Leave Analytics</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              {data?.onLeaveToday ?? 0} on leave today
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Leave Type Distribution */}
        {typeData.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">By Type</p>
            <ChartContainer config={typeConfig} className="h-[120px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={LEAVE_COLORS[index % LEAVE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        )}

        {/* Status Summary */}
        {statusData.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">This Month</p>
            <div className="grid grid-cols-3 gap-2">
              {statusData.map((item) => (
                <div key={item.name} className="text-center p-2 rounded-lg bg-muted/30 border border-border/20">
                  <p className="text-lg font-bold" style={{ color: item.fill }}>{item.count}</p>
                  <p className="text-[10px] text-muted-foreground">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {typeData.length === 0 && statusData.length === 0 && (
          <div className="h-[120px] flex items-center justify-center text-xs text-muted-foreground">
            No leave data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
