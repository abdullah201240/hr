import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { CalendarClock } from "lucide-react"
import type { AttendanceStats } from "@/hooks/useExecutiveDashboard"

interface AttendanceTrendChartProps {
  data: AttendanceStats | undefined
}

const chartConfig = {
  present: { label: "Present", color: "#10b981" },
  late: { label: "Late", color: "#f59e0b" },
  absent: { label: "Absent", color: "#ef4444" },
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const trendData = data?.weeklyTrend || []

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Attendance Trend</CardTitle>
              <p className="text-[10px] text-muted-foreground">Last 7 days overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-muted-foreground">Late</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-muted-foreground">Absent</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {trendData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px]">
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="present"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="late"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="absent"
                stackId="3"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            No attendance data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
