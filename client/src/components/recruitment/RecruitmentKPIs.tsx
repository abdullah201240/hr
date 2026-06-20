import { BriefcaseBusiness, Users, TrendingUp, UserCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Stats {
  openJobs: number
  totalApplicants: number
  pipelineActive: number
  hiredThisMonth: number
}

interface RecruitmentKPIsProps {
  stats: Stats
}

export function RecruitmentKPIs({ stats }: RecruitmentKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Open Roles", value: stats.openJobs, icon: BriefcaseBusiness, color: "text-blue-600", bg: "bg-blue-500/10" },
        { label: "Total Applicants", value: stats.totalApplicants, icon: Users, color: "text-violet-600", bg: "bg-violet-500/10" },
        { label: "Active Pipeline", value: stats.pipelineActive, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-500/10" },
        { label: "Hired This Month", value: stats.hiredThisMonth, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
      ].map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border-border/40 shadow-none hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={cn("text-2xl font-bold mt-1", color)}>{value}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
