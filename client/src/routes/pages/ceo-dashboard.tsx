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


export default function CeoDashboardPage() {
  const { data, isLoading } = useExecutiveDashboardQuery()

  return (
    <div className="space-y-6 animate-fade-in">
      

      {/* KPI Metric Cards */}
      <KpiMetricCards data={data} isLoading={isLoading} />

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
