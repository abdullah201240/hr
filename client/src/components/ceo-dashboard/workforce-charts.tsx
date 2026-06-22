import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Users } from "lucide-react"
import type { WorkforceStats } from "@/hooks/useExecutiveDashboard"

const DEPT_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316",
]

const TYPE_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
]

interface WorkforceChartsProps {
  data: WorkforceStats | undefined
}

export function WorkforceCharts({ data }: WorkforceChartsProps) {
  const deptData = data?.departmentBreakdown?.map((d, i) => ({
    name: d.department,
    value: d.count,
    fill: DEPT_COLORS[i % DEPT_COLORS.length],
  })) || []

  const typeData = data?.employeeTypeBreakdown?.map((t, i) => ({
    name: t.type,
    count: t.count,
    fill: TYPE_COLORS[i % TYPE_COLORS.length],
  })) || []

  const deptChartConfig = deptData.reduce((acc, item, i) => {
    acc[item.name] = { label: item.name, color: DEPT_COLORS[i % DEPT_COLORS.length] }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Department Distribution - Donut Chart */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Workforce by Department</CardTitle>
              <p className="text-[10px] text-muted-foreground">{data?.activeEmployees ?? 0} active employees</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {deptData.length > 0 ? (
            <ChartContainer config={deptChartConfig} className="h-[220px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {deptData.map((entry, index) => (
                    <Cell key={entry.name} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              No department data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Type - Bar Chart */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Workforce by Type</CardTitle>
              <p className="text-[10px] text-muted-foreground">Employment categories</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {typeData.length > 0 ? (
            <ChartContainer config={{}} className="h-[220px]">
              <BarChart data={typeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {typeData.map((entry, index) => (
                    <Cell key={entry.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              No employee type data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
