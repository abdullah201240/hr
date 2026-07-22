import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ClipboardList, CheckCircle, X, Printer, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingTabProps {
  jobs: any[]
  onboardingHires: any[]
  onboardingJobFilter: string
  setOnboardingJobFilter: (val: string) => void
  candidates: any[]
  navigate: (url: string) => void
  handleGenerateJoiningLetter: (cand: any) => void
  toggleOnboardingTask: (hireId: string, taskId: string) => void
  deleteOnboardingTask: (hireId: string, taskId: string) => void
  addOnboardingTask: (hireId: string) => void
  newOnboardingTaskText: Record<string, string>
  setNewOnboardingTaskText: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

const ONBOARDING_PER_PAGE = 2

export function OnboardingTab({
  jobs,
  onboardingHires,
  onboardingJobFilter,
  setOnboardingJobFilter,
  candidates,
  navigate,
  handleGenerateJoiningLetter,
  toggleOnboardingTask,
  deleteOnboardingTask,
  addOnboardingTask,
  newOnboardingTaskText,
  setNewOnboardingTaskText,
}: OnboardingTabProps) {
  const [onboardingPage, setOnboardingPage] = useState(1)

  const onboardingGroups = [
    ...jobs.filter(job => {
      const jobHires = onboardingHires.filter(h => h.role === job.title)
      if (jobHires.length === 0) return false
      return onboardingJobFilter === "all" || job.title === onboardingJobFilter
    }).map(job => ({
      type: "active", id: job.id, title: job.title, department: job.department,
      hires: onboardingHires.filter(h => h.role === job.title),
    })),
    ...(() => {
      const activeTitles = jobs.map(j => j.title)
      const otherHires = onboardingHires.filter(h => !activeTitles.includes(h.role))
      return Array.from(new Set(otherHires.map(h => h.role)))
        .filter(role => onboardingJobFilter === "all" || role === onboardingJobFilter)
        .map(roleName => ({ type: "archived", id: roleName, title: roleName, department: "N/A", hires: otherHires.filter(h => h.role === roleName) }))
    })()
  ]

  const totalPages = Math.ceil(onboardingGroups.length / ONBOARDING_PER_PAGE)
  const start = (onboardingPage - 1) * ONBOARDING_PER_PAGE
  const paginated = onboardingGroups.slice(start, start + ONBOARDING_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Job-by-Job Onboarding Tracking</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor onboarding task completion lists for new hires, grouped by job role.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">Filter by Job:</span>
          <Select value={onboardingJobFilter} onValueChange={(v) => { setOnboardingJobFilter(v); setOnboardingPage(1); }}>
            <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="All Jobs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(j => (<SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>))}
              {(() => {
                const activeTitles = jobs.map(j => j.title)
                return Array.from(new Set(onboardingHires.filter(h => !activeTitles.includes(h.role)).map(h => h.role))).map(role => (
                  <SelectItem key={role} value={role}>{role} (Archived)</SelectItem>
                ))
              })()}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-8">
        {paginated.map(group => {
          const isArchived = group.type === "archived"
          return (
            <div key={group.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                <h4 className="text-sm font-bold text-foreground">{group.title}</h4>
                <span className={cn("text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted", isArchived && "italic")}>
                  {isArchived ? "Archived / Unlisted Role" : group.department}
                </span>
                <Badge variant="secondary" className="text-[10px] font-semibold ml-auto">
                  {group.hires.length} {group.hires.length === 1 ? "New Hire" : "New Hires"}
                </Badge>
              </div>

              <div className="grid gap-5">
                {group.hires.map(hire => {
                  const completedCount = hire.tasks.filter((t: any) => t.completed).length
                  const progressPct = hire.tasks.length > 0 ? Math.round((completedCount / hire.tasks.length) * 100) : 0
                  const hireCandidate = candidates.find(c => c.id === hire.candidateId)

                  return (
                    <Card key={hire.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 bg-muted/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base">{hire.name}</h3>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">New Hire</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{hire.role} • {hire.department}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-5 self-start md:self-auto shrink-0">
                          <div className="text-xs text-right">
                            <p className="font-medium text-muted-foreground">Start Date</p>
                            <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {hire.startDate}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-24 sm:w-32 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all duration-500", progressPct === 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${progressPct}%` }} />
                            </div>
                            <span className={cn("text-xs font-bold tabular-nums min-w-[36px] text-right", progressPct === 100 ? "text-emerald-600" : "")}>
                              {progressPct}%
                            </span>
                          </div>

                          {hireCandidate && (
                            <div className="text-xs shrink-0 flex items-center gap-1.5">
                              {hireCandidate.joiningLetterGenerated ? (
                                <>
                                  <span className="inline-flex items-center gap-1 font-bold text-teal-600 bg-teal-500/10 px-2.5 py-1 rounded-lg">✉️ Joining Letter Sent</span>
                                  <Button variant="ghost" size="icon" onClick={() => navigate(`/recruitment/print/${hireCandidate.id}`)} className="h-8 w-8 text-teal-600 hover:bg-teal-500/5 cursor-pointer">
                                    <Printer className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleGenerateJoiningLetter(hireCandidate)} className="h-8 text-xs font-semibold cursor-pointer">
                                  ✉️ Make Joining Letter
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground/80">Onboarding Checklist</span>
                          <span className="text-xs text-muted-foreground ml-auto">{completedCount}/{hire.tasks.length} completed</span>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {hire.tasks.map((task: any) => (
                            <div key={task.id}
                              className={cn("flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none group/task",
                                task.completed ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-border/60 hover:border-primary/20 hover:bg-muted/20")}
                              onClick={() => toggleOnboardingTask(hire.id, task.id)}>
                              <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                task.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-background")}>
                                {task.completed && <CheckCircle className="h-3 w-3 fill-current" />}
                              </div>
                              <span className={cn("text-xs font-medium flex-1 transition-all", task.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                                {task.title}
                              </span>
                              <button type="button" onClick={e => { e.stopPropagation(); deleteOnboardingTask(hire.id, task.id) }}
                                className="opacity-0 group-hover/task:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Add custom task */}
                        <div className="mt-4 flex items-center gap-2">
                          <Input
                            placeholder="Add custom task..."
                            className="h-8 text-xs flex-1"
                            value={newOnboardingTaskText[hire.id] || ""}
                            onChange={e => setNewOnboardingTaskText(prev => ({ ...prev, [hire.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOnboardingTask(hire.id) } }}
                          />
                          <Button size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0" onClick={() => addOnboardingTask(hire.id)}>
                            <Plus className="h-3 w-3" /> Add Task
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {onboardingGroups.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-muted/5">
            <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No new hires yet. Hire candidates from the Pipeline tab.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <span className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + ONBOARDING_PER_PAGE, onboardingGroups.length)} of {onboardingGroups.length} jobs</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOnboardingPage(p => Math.max(p - 1, 1))} disabled={onboardingPage === 1} className="h-8 text-xs cursor-pointer">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setOnboardingPage(p => Math.min(p + 1, totalPages))} disabled={onboardingPage === totalPages} className="h-8 text-xs cursor-pointer">Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
