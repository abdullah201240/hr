import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight, CalendarClock, StickyNote, X, Printer } from "lucide-react"
import { cn } from "@/lib/utils"

interface PipelineTabProps {
  jobs: any[]
  candidates: any[]
  pipelineJobFilter: string
  setPipelineJobFilter: (val: string) => void
  pipelineStageFilter: string
  setPipelineStageFilter: (val: string) => void
  openCandidateDetail: (cand: any) => void
  deleteCandidate: (id: string) => void
  handleGenerateOfferLetter: (cand: any) => void
  handleGenerateJoiningLetter: (cand: any) => void
  promoteCandidate: (id: string, stage: any) => void
  navigate: (url: string) => void
}

const PIPELINE_PER_PAGE = 3
const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"] as const
const ALL_STAGES = [...PIPELINE_STAGES, "Rejected"] as const

export function PipelineTab({
  jobs,
  candidates,
  pipelineJobFilter,
  setPipelineJobFilter,
  pipelineStageFilter,
  setPipelineStageFilter,
  openCandidateDetail,
  deleteCandidate,
  handleGenerateOfferLetter,
  handleGenerateJoiningLetter,
  promoteCandidate,
  navigate,
}: PipelineTabProps) {
  const [pipelinePage, setPipelinePage] = useState(1)

  // Build pipeline groups
  const pipelineGroups = [
    ...jobs.filter(job => {
      const jobCandidates = candidates.filter(c => c.role === job.title)
      if (job.status === "Closed" && jobCandidates.length === 0) return false
      if (pipelineJobFilter !== "all" && job.title !== pipelineJobFilter) return false
      return true
    }).map(job => ({
      type: "active",
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      status: job.status,
      candidates: candidates.filter(c => c.role === job.title && (pipelineStageFilter === "all" || c.stage === pipelineStageFilter)),
    })),
    ...(() => {
      const activeTitles = jobs.map(j => j.title)
      const otherCandidates = candidates.filter(c => !activeTitles.includes(c.role))
      const otherRoles = Array.from(new Set(otherCandidates.map(c => c.role)))
      return otherRoles
        .filter(role => pipelineJobFilter === "all" || role === pipelineJobFilter)
        .map(roleName => ({
          type: "archived",
          id: roleName,
          title: roleName,
          department: "N/A",
          location: "N/A",
          status: "Archived",
          candidates: otherCandidates.filter(c => c.role === roleName && (pipelineStageFilter === "all" || c.stage === pipelineStageFilter)),
        }))
    })()
  ]

  const totalPages = Math.ceil(pipelineGroups.length / PIPELINE_PER_PAGE)
  const start = (pipelinePage - 1) * PIPELINE_PER_PAGE
  const paginated = pipelineGroups.slice(start, start + PIPELINE_PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Job-by-Job Candidate Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track candidate progression across the recruitment funnel, separated by active job requisition.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={pipelineJobFilter} onValueChange={(v) => { setPipelineJobFilter(v); setPipelinePage(1); }}>
            <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue placeholder="All Jobs" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map(j => (<SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>))}
              {(() => {
                const activeTitles = jobs.map(j => j.title)
                return Array.from(new Set(candidates.filter(c => !activeTitles.includes(c.role)).map(c => c.role))).map(role => (
                  <SelectItem key={role} value={role}>{role} (Archived)</SelectItem>
                ))
              })()}
            </SelectContent>
          </Select>
          <Select value={pipelineStageFilter} onValueChange={(v) => { setPipelineStageFilter(v); setPipelinePage(1); }}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Stages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {ALL_STAGES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {paginated.map(group => {
          const isArchived = group.type === "archived"
          return (
            <Card key={group.id} className={cn("border border-border/40 shadow-none", isArchived && "border-dashed bg-muted/5")}>
              <CardHeader className="pb-3 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">{group.title}</CardTitle>
                    <span className={cn("text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted", isArchived && "italic")}>
                      {isArchived ? "Archived / Unlisted Role" : group.department}
                    </span>
                  </div>
                  {!isArchived && (
                    <CardDescription className="text-[11px] mt-0.5">
                      Location: {group.location} • Status: <span className={cn("ml-1 font-bold", group.status === "Open" ? "text-emerald-600" : "text-muted-foreground")}>{group.status}</span>
                    </CardDescription>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {group.candidates.length} {group.candidates.length === 1 ? "Candidate" : "Candidates"}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PIPELINE_STAGES.map(stage => {
                    const stageCandidates = group.candidates.filter(c => c.stage === stage)
                    return (
                      <div key={stage} className="rounded-xl border border-border/40 bg-muted/10 p-2.5 min-w-[150px] flex flex-col space-y-2">
                        <div className="flex items-center justify-between border-b border-border/20 pb-1.5 mb-1">
                          <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{stage}</span>
                          <span className="text-[9px] font-bold px-1.5 rounded bg-muted text-muted-foreground">{stageCandidates.length}</span>
                        </div>
                        <div className="flex-1 space-y-2 overflow-y-auto max-h-[260px]">
                          {stageCandidates.length === 0 ? (
                            <div className="text-center py-5 text-[9px] text-muted-foreground/60 italic">Empty</div>
                          ) : (
                            stageCandidates.map(cand => (
                              <div key={cand.id} className="p-2.5 rounded-lg border border-border bg-card shadow-xs relative group hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => openCandidateDetail(cand)}>
                                <button
                                  type="button"
                                  className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={e => { e.stopPropagation(); deleteCandidate(cand.id) }}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                                <p className="text-[11px] font-bold truncate pr-3 text-foreground">{cand.name}</p>
                                <p className="text-[9px] text-muted-foreground truncate">{cand.email}</p>

                                {cand.interviewDate && (stage === "Interview" || stage === "Screening") && (
                                  <div className="mt-1.5 flex items-center gap-1 text-[8px] text-violet-600 bg-violet-500/10 px-1 py-0.5 rounded font-semibold">
                                    <CalendarClock className="h-2.5 w-2.5" />
                                    {cand.interviewDate} {cand.interviewTime}
                                  </div>
                                )}

                                {cand.notes && (
                                  <div className="mt-1 flex items-center gap-1 text-[8px] text-amber-600 font-semibold">
                                    <StickyNote className="h-2.5 w-2.5" />
                                    Note
                                  </div>
                                )}

                                {cand.stage === "Offer" && (
                                  <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
                                    {cand.offerLetterGenerated ? (
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="inline-flex items-center text-[8px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded">📄 Offer Sent</span>
                                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); navigate(`/recruitment/print-offer/${cand.id}`) }} className="h-5 w-5 text-emerald-600 hover:bg-emerald-500/5 cursor-pointer shrink-0">
                                          <Printer className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button variant="outline" className="w-full text-[9px] h-6 justify-center gap-1 text-primary cursor-pointer hover:bg-primary/5"
                                        onClick={e => { e.stopPropagation(); handleGenerateOfferLetter(cand) }}>
                                        📄 Make Offer
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {cand.stage === "Hired" && (
                                  <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
                                    {cand.joiningLetterGenerated ? (
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="inline-flex items-center text-[8px] font-bold text-teal-600 bg-teal-500/10 px-1 py-0.5 rounded">✉️ Joined</span>
                                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); navigate(`/recruitment/print/${cand.id}`) }} className="h-5 w-5 text-teal-600 hover:bg-teal-500/5 cursor-pointer shrink-0">
                                          <Printer className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button variant="outline" className="w-full text-[9px] h-6 justify-center gap-1 text-primary cursor-pointer hover:bg-primary/5"
                                        onClick={e => { e.stopPropagation(); handleGenerateJoiningLetter(cand) }}>
                                        ✉️ Join Letter
                                      </Button>
                                    )}
                                  </div>
                                )}

                                <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-border/30">
                                  <span className="text-[8px] font-medium text-muted-foreground/85 px-1 bg-muted/60 rounded">{cand.source}</span>
                                  {stage !== "Hired" && (
                                    <button type="button" onClick={e => { e.stopPropagation(); const idx = PIPELINE_STAGES.indexOf(stage); if (idx + 1 < PIPELINE_STAGES.length) promoteCandidate(cand.id, PIPELINE_STAGES[idx + 1]) }}
                                      className="text-[9px] text-primary font-semibold flex items-center gap-0.5 hover:underline">
                                      Move <ArrowRight className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {(() => {
                  const rejected = group.candidates.filter(c => c.stage === "Rejected")
                  if (rejected.length === 0) return null
                  return (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <X className="h-3 w-3" /> Rejected ({rejected.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {rejected.map(cand => (
                          <div key={cand.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-[11px] cursor-pointer hover:border-red-500/40 transition-colors"
                            onClick={() => openCandidateDetail(cand)}>
                            <span className="font-semibold text-foreground">{cand.name}</span>
                            <span className="text-muted-foreground">{cand.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )
        })}

        {pipelineGroups.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-muted/5">
            <p className="text-sm text-muted-foreground">No candidates match the selected filter.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <span className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + PIPELINE_PER_PAGE, pipelineGroups.length)} of {pipelineGroups.length} jobs</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPipelinePage(p => Math.max(p - 1, 1))} disabled={pipelinePage === 1} className="h-8 text-xs cursor-pointer">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPipelinePage(p => Math.min(p + 1, totalPages))} disabled={pipelinePage === totalPages} className="h-8 text-xs cursor-pointer">Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
