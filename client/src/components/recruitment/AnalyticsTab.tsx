import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Funnel, PieChart, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnalyticsTabProps {
  jobs: any[]
  candidates: any[]
}

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"] as const

const SOURCE_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
]

export function AnalyticsTab({ jobs, candidates }: AnalyticsTabProps) {
  // ── Funnel data ──
  const funnelData = PIPELINE_STAGES.map(stage => ({
    stage,
    count: candidates.filter(c => {
      const stageIdx = PIPELINE_STAGES.indexOf(stage as any)
      const candidateStageIdx = PIPELINE_STAGES.indexOf(c.stage as any)
      return candidateStageIdx >= stageIdx || c.stage === stage
    }).length,
    exact: candidates.filter(c => c.stage === stage).length,
  }))
  const funnelMax = funnelData[0]?.count || 1

  // ── Source breakdown ──
  const sourceCounts: Record<string, number> = {}
  candidates.forEach(c => { sourceCounts[c.source] = (sourceCounts[c.source] || 0) + 1 })
  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])
  const sourceTotal = candidates.length || 1

  // ── Monthly hires (last 6 months) ──
  const now = new Date()
  const monthlyHires = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthKey = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString("en-US", { month: "short" })
    const count = candidates.filter(c => {
      const hiredEntry = c.stageHistory?.find((s: any) => s.stage === "Hired")
      return hiredEntry?.date?.startsWith(monthKey)
    }).length
    return { label, count }
  })
  const hireMax = Math.max(...monthlyHires.map(m => m.count), 1)

  // ── Avg days to hire ──
  const hiredCandidates = candidates.filter(c => c.stage === "Hired" && c.appliedDate)
  const avgDays = hiredCandidates.length > 0
    ? Math.round(hiredCandidates.reduce((sum, c) => {
      const hiredEntry = c.stageHistory?.find((s: any) => s.stage === "Hired")
      if (!hiredEntry?.date) return sum
      return sum + Math.abs(new Date(hiredEntry.date).getTime() - new Date(c.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
    }, 0) / hiredCandidates.length)
    : 0

  const rejectedCount = candidates.filter(c => c.stage === "Rejected").length
  const offerAcceptRate = candidates.filter(c => c.stage === "Offer" || c.stage === "Hired").length > 0
    ? Math.round((candidates.filter(c => c.stage === "Hired").length / candidates.filter(c => c.stage === "Offer" || c.stage === "Hired").length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold">Recruitment Analytics</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Visual breakdown of your hiring funnel, candidate sources, and monthly hire trends.</p>
      </div>

      {/* Top metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg. Days to Hire", value: avgDays || "—", suffix: avgDays ? "days" : "", color: "text-blue-600" },
          { label: "Offer Accept Rate", value: `${offerAcceptRate}%`, suffix: "", color: "text-emerald-600" },
          { label: "Rejected Candidates", value: rejectedCount, suffix: "", color: "text-red-500" },
          { label: "Total Hires", value: candidates.filter(c => c.stage === "Hired").length, suffix: "", color: "text-teal-600" },
        ].map(({ label, value, suffix, color }) => (
          <Card key={label} className="border-border/40 shadow-none">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={cn("text-2xl font-bold mt-1", color)}>{value} <span className="text-sm font-normal text-muted-foreground">{suffix}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Hiring Funnel ── */}
        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Funnel className="h-4 w-4 text-primary" /> Hiring Funnel
            </CardTitle>
            <CardDescription className="text-xs">Candidate drop-off at each pipeline stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map(({ stage, count, exact }, i) => {
              const widthPct = (count / funnelMax) * 100
              const stageColors = [
                "bg-slate-500", "bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500", "bg-teal-500"
              ]
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{stage}</span>
                    <span className="text-muted-foreground">{exact} candidates</span>
                  </div>
                  <div className="h-7 bg-muted/40 rounded-lg overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-lg transition-all duration-700 flex items-center px-3", stageColors[i])}
                      style={{ width: `${Math.max(widthPct, 8)}%` }}
                    >
                      <span className="text-white text-[10px] font-bold">{count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* ── Source Breakdown ── */}
        <Card className="border-border/40 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" /> Candidate Sources
            </CardTitle>
            <CardDescription className="text-xs">Where your applicants are coming from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sourceEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            ) : (
              sourceEntries.map(([source, count], i) => {
                const pct = Math.round((count / sourceTotal) * 100)
                return (
                  <div key={source} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", SOURCE_COLORS[i % SOURCE_COLORS.length])} />
                        {source}
                      </span>
                      <span className="text-muted-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-700", SOURCE_COLORS[i % SOURCE_COLORS.length])} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Hires Bar Chart ── */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Monthly Hires (Last 6 Months)
          </CardTitle>
          <CardDescription className="text-xs">Number of candidates that reached "Hired" stage per month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-32">
            {monthlyHires.map(({ label, count }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-muted-foreground">{count || ""}</span>
                <div className="w-full flex items-end" style={{ height: "80px" }}>
                  <div
                    className="w-full bg-primary rounded-t-md transition-all duration-700 hover:bg-primary/80"
                    style={{ height: count > 0 ? `${(count / hireMax) * 100}%` : "4px", opacity: count > 0 ? 1 : 0.2 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Per-Job Stats Table ── */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Per-Job Recruitment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Job</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Applicants</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">In Pipeline</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Hired</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground text-center">Rejected</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map(job => {
                const jobCands = candidates.filter(c => c.role === job.title)
                const hired = jobCands.filter(c => c.stage === "Hired").length
                const rejected = jobCands.filter(c => c.stage === "Rejected").length
                const inPipeline = jobCands.filter(c => c.stage !== "Hired" && c.stage !== "Rejected").length
                return (
                  <TableRow key={job.id} className="border-b border-border/20 hover:bg-muted/10">
                    <TableCell className="py-2.5">
                      <p className="font-semibold text-sm">{job.title}</p>
                      <p className="text-[11px] text-muted-foreground">{job.department}</p>
                    </TableCell>
                    <TableCell className="py-2.5 text-center font-bold text-sm">{jobCands.length}</TableCell>
                    <TableCell className="py-2.5 text-center text-sm text-amber-600 font-semibold">{inPipeline}</TableCell>
                    <TableCell className="py-2.5 text-center text-sm text-emerald-600 font-bold">{hired}</TableCell>
                    <TableCell className="py-2.5 text-center text-sm text-red-500 font-semibold">{rejected}</TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant={job.status === "Open" ? "default" : "secondary"}
                        className={job.status === "Open" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                        {job.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
