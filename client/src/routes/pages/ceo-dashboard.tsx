import { useExecutiveDashboardQuery } from "@/hooks/useExecutiveDashboard"
import { KpiMetricCards } from "@/components/ceo-dashboard/kpi-metric-cards"
import { WorkforceCharts } from "@/components/ceo-dashboard/workforce-charts"
import { AttendanceTrendChart } from "@/components/ceo-dashboard/attendance-trend-chart"
import { RecruitmentPipeline } from "@/components/ceo-dashboard/recruitment-pipeline"
import { LeaveAnalytics } from "@/components/ceo-dashboard/leave-analytics"
import { PerformanceOverview } from "@/components/ceo-dashboard/performance-overview"
import { ActivityFeed } from "@/components/ceo-dashboard/activity-feed"
import { QuickActions } from "@/components/ceo-dashboard/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, Gift, ArrowRight } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "react-router"

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

export default function CeoDashboardPage() {
  const { data, isLoading } = useExecutiveDashboardQuery()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CEO Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-md border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-24 w-24 rounded-full bg-white/10 blur-lg" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase text-blue-100">
              <Sparkles className="h-3 w-3 animate-pulse text-yellow-300" />
              Executive Dashboard
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hello, {user?.fullNameEnglish || 'Executive'}
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-xl leading-relaxed">
              Here is your central control center. Monitor total workforce productivity, attendance ratios, recruitment pipelines, and payroll health live.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <KpiMetricCards data={data} isLoading={isLoading} />

      {/* Festival Bonus Overview Section */}
      {isLoading ? (
        <Skeleton className="h-[120px] rounded-xl" />
      ) : (
        data?.festivalBonus && (
          <Card className="shadow-none border-border/40 bg-gradient-to-br from-indigo-500/[0.01] to-violet-500/[0.03] overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-indigo-500/[0.03] blur-2xl" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Gift className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Active Festival Bonus Register</CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Cycle Name: <strong className="text-foreground">{data.festivalBonus.activeCycleName || 'None'}</strong>
                    </p>
                  </div>
                </div>
                <Badge variant={
                  data.festivalBonus.activeCycleStatus === 'Disbursed' ? 'secondary' :
                  data.festivalBonus.activeCycleStatus === 'Awaiting_MD_Approval' ? 'destructive' :
                  data.festivalBonus.activeCycleStatus === 'Awaiting_LM_Approval' ? 'default' : 'outline'
                } className="text-[10px] px-2.5 py-0.5 font-semibold">
                  {data.festivalBonus.activeCycleStatus?.replace(/_/g, ' ') || 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 pt-0 items-center">
              <div className="bg-background/60 backdrop-blur-md rounded-xl p-3 border border-border/30 flex flex-col justify-between h-20 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] text-muted-foreground font-medium">Total Bonus Budget</span>
                <span className="text-xl font-bold tracking-tight text-indigo-600">
                  {formatCurrency(data.festivalBonus.totalBonusAmount)}
                </span>
              </div>
              <div className="bg-background/60 backdrop-blur-md rounded-xl p-3 border border-border/30 flex flex-col justify-between h-20 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.02)]">
                <span className="text-[11px] text-muted-foreground font-medium">Awaiting MD Approval</span>
                <span className="text-xl font-bold tracking-tight text-rose-500">
                  {data.festivalBonus.awaitingMdApprovalCount} payouts
                </span>
              </div>
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs h-9 cursor-pointer"
                  onClick={() => navigate('/payroll/md-approvals?tab=bonus')}
                >
                  <span>Open Bonus Approvals</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Row 2: Workforce Charts + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-[280px] rounded-xl" />
              <Skeleton className="h-[280px] rounded-xl" />
            </div>
          ) : (
            <WorkforceCharts data={data?.workforce} />
          )}
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Row 3: Attendance Trend + Recruitment Pipeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[280px] rounded-xl" />
            <Skeleton className="h-[280px] rounded-xl" />
          </>
        ) : (
          <>
            <AttendanceTrendChart data={data?.attendance} />
            <RecruitmentPipeline data={data?.recruitment} />
          </>
        )}
      </div>

      {/* Row 4: Leave Analytics + Performance + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <LeaveAnalytics data={data?.leave} />
            <PerformanceOverview data={data?.performance} />
            <ActivityFeed data={data} />
          </>
        )}
      </div>
    </div>
  )
}
