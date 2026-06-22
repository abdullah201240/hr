import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { UserPlus } from "lucide-react"
import type { RecruitmentStats } from "@/hooks/useExecutiveDashboard"

interface RecruitmentPipelineProps {
  data: RecruitmentStats | undefined
}

const STAGE_COLORS: Record<string, string> = {
  Applied: "#6366f1",
  Screening: "#8b5cf6",
  Interview: "#3b82f6",
  Technical: "#06b6d4",
  Offer: "#f59e0b",
  Hired: "#10b981",
}

const STAGE_ORDER = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"]

export function RecruitmentPipeline({ data }: RecruitmentPipelineProps) {
  const pipelineData = STAGE_ORDER
    .map((stage) => {
      const found = data?.pipelineByStage?.find((s) => s.stage === stage)
      return { stage, count: found?.count ?? 0 }
    })
    .filter((d) => d.count > 0)

  const chartConfig = pipelineData.reduce((acc, item) => {
    acc[item.stage] = { label: item.stage, color: STAGE_COLORS[item.stage] || "#6366f1" }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-sm">Recruitment Pipeline</CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {data?.pipelineActive ?? 0} active · {data?.openPositions ?? 0} open positions
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {pipelineData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={pipelineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent hideIndicator />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {pipelineData.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            No recruitment data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
