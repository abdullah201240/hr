import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { PerformanceStats } from "@/hooks/useExecutiveDashboard"

interface PerformanceOverviewProps {
  data: PerformanceStats | undefined
}

export function PerformanceOverview({ data }: PerformanceOverviewProps) {
  const totalAppraisals = (data?.pendingSelfAppraisals ?? 0) + (data?.pendingManagerAppraisals ?? 0) + (data?.completedAppraisals ?? 0)
  const selfCompletionPct = totalAppraisals > 0 ? Math.round(((data?.pendingSelfAppraisals ?? 0) / totalAppraisals) * 100) : 0
  const managerCompletionPct = totalAppraisals > 0 ? Math.round(((data?.pendingManagerAppraisals ?? 0) / totalAppraisals) * 100) : 0
  const completedPct = totalAppraisals > 0 ? Math.round(((data?.completedAppraisals ?? 0) / totalAppraisals) * 100) : 0

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Target className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-sm">Performance Reviews</CardTitle>
            <p className="text-[10px] text-muted-foreground">
              {data?.activeCycles ?? 0} active appraisal cycles
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Completed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium">Completed</span>
            </div>
            <span className="text-[11px] font-bold">{data?.completedAppraisals ?? 0}</span>
          </div>
          <Progress value={completedPct} className="h-1.5" />
        </div>

        {/* Pending Manager */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[11px] font-medium">Manager Review</span>
            </div>
            <span className="text-[11px] font-bold">{data?.pendingManagerAppraisals ?? 0}</span>
          </div>
          <Progress value={managerCompletionPct} className="h-1.5" />
        </div>

        {/* Pending Self */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-[11px] font-medium">Self Appraisal</span>
            </div>
            <span className="text-[11px] font-bold">{data?.pendingSelfAppraisals ?? 0}</span>
          </div>
          <Progress value={selfCompletionPct} className="h-1.5" />
        </div>

        {totalAppraisals === 0 && (
          <div className="h-[80px] flex items-center justify-center text-xs text-muted-foreground">
            No appraisal data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
