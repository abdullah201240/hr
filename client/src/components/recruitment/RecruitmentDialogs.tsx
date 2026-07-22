import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BriefcaseBusiness,
  Edit2,
  CalendarClock,
  Phone,
  ExternalLink,
  FileText,
  Calendar,
  ChevronRight,
  Trash2,
  Printer,
  CheckCircle,
  MessageSquare,
  Link2,
  StickyNote,
} from "lucide-react"
import { cn } from "@/lib/utils"

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"] as const
const ALL_STAGES = [...PIPELINE_STAGES, "Rejected"] as const
type AnyStage = typeof ALL_STAGES[number]

const STAGE_COLORS: Record<AnyStage, string> = {
  Applied: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Screening: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  Interview: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Technical: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Offer: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Hired: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Rejected: "bg-red-500/10 text-red-600 border-red-500/20",
}

// --- CandidateApplyDialog ---
interface CandidateApplyDialogProps {
  isOpen: boolean
  onClose: () => void
  editingCandidate: any
  newCandidate: any
  setNewCandidate: (val: any) => void
  onSubmit: (e: React.FormEvent) => void
  jobs: any[]
}

export function CandidateApplyDialog({
  isOpen,
  onClose,
  editingCandidate,
  newCandidate,
  setNewCandidate,
  onSubmit,
  jobs,
}: CandidateApplyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-md text-xs">
        <DialogHeader>
          <DialogTitle>{editingCandidate ? "Edit Candidate Record" : "Add Candidate Record"}</DialogTitle>
          <DialogDescription>{editingCandidate ? "Update this candidate's profile details." : "Enter a candidate into the recruitment workflow pipeline."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold">Candidate Name *</Label>
              <Input placeholder="John Doe" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email *</Label>
              <Input type="email" placeholder="john@example.com" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Phone</Label>
              <Input type="tel" placeholder="+1-555-0000" value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">LinkedIn URL</Label>
            <Input placeholder="https://linkedin.com/in/..." value={newCandidate.linkedIn} onChange={e => setNewCandidate({ ...newCandidate, linkedIn: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Resume / CV Link</Label>
            <Input placeholder="https://drive.google.com/..." value={newCandidate.resumeUrl} onChange={e => setNewCandidate({ ...newCandidate, resumeUrl: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Applied Role *</Label>
              <Select value={newCandidate.role} onValueChange={v => setNewCandidate({ ...newCandidate, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {jobs.map(j => (<SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Lead Source</Label>
              <Select value={newCandidate.source} onValueChange={v => setNewCandidate({ ...newCandidate, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LinkedIn", "Referral", "Job Board", "Careers Site", "Instagram", "Headhunter", "Walk-in"].map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!editingCandidate && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Initial Stage</Label>
              <Select value={newCandidate.stage} onValueChange={v => setNewCandidate({ ...newCandidate, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STAGES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{editingCandidate ? "Save Changes" : "Add Candidate"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// --- JobDetailDialog ---
interface JobDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  viewingJob: any
  getApplicantCount: (title: string) => number
  formatDate: (dateStr: string) => string
  onEdit: (job: any) => void
}

export function JobDetailDialog({
  isOpen,
  onClose,
  viewingJob,
  getApplicantCount,
  formatDate,
  onEdit,
}: JobDetailDialogProps) {
  if (!viewingJob) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg text-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            {viewingJob?.title}
          </DialogTitle>
          <DialogDescription>{viewingJob?.department} • {viewingJob?.type} • {viewingJob?.location}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Experience", value: viewingJob.experience },
              { label: "Status", value: viewingJob.status },
              { label: "Applicants", value: `${getApplicantCount(viewingJob.title)} actual` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
                <p className="text-sm font-bold mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          {viewingJob.description && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Description</Label>
              <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {viewingJob.description}
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Opened on: {formatDate(viewingJob.dateOpened)}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => onEdit(viewingJob)}>
            <Edit2 className="h-4 w-4 mr-1" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- CandidateDetailDialog ---
interface CandidateDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  viewingCandidate: any
  setViewingCandidate: React.Dispatch<React.SetStateAction<any>>
  formatDate: (dateStr: string) => string
  promoteCandidate: (id: string, stage: any) => void
  detailNotes: string
  setDetailNotes: (notes: string) => void
  saveNotes: (id: string, notes: string) => void
  handleEditCandidateClick: (c: any) => void
  handleEditCandidateInterview: (c: any) => void
  handleGenerateOfferLetter: (c: any) => void
  handlePrintOfferLetter: (id: string) => void
  handleGenerateJoiningLetter: (c: any) => void
  handlePrintJoiningLetter: (id: string) => void
  deleteCandidate: (id: string) => void
}

export function CandidateDetailDialog({
  isOpen,
  onClose,
  viewingCandidate,
  setViewingCandidate,
  formatDate,
  promoteCandidate,
  detailNotes,
  setDetailNotes,
  saveNotes,
  handleEditCandidateClick,
  handleEditCandidateInterview,
  handleGenerateOfferLetter,
  handlePrintOfferLetter,
  handleGenerateJoiningLetter,
  handlePrintJoiningLetter,
  deleteCandidate,
}: CandidateDetailDialogProps) {
  if (!viewingCandidate) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-xs">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl">{viewingCandidate.name}</DialogTitle>
              <DialogDescription className="mt-1">{viewingCandidate.role}</DialogDescription>
            </div>
            <Badge className={cn("mt-1 shrink-0 border", STAGE_COLORS[viewingCandidate.stage as AnyStage] || "")}>
              {viewingCandidate.stage}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Email</p>
                <p className="font-semibold text-foreground text-xs">{viewingCandidate.email}</p>
              </div>
            </div>
            {viewingCandidate.phone && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Phone</p>
                  <p className="font-semibold text-foreground text-xs">{viewingCandidate.phone}</p>
                </div>
              </div>
            )}
            {viewingCandidate.linkedIn && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">LinkedIn</p>
                  <a href={viewingCandidate.linkedIn} target="_blank" rel="noreferrer" className="font-semibold text-primary text-xs hover:underline truncate block max-w-[160px]">View Profile</a>
                </div>
              </div>
            )}
            {viewingCandidate.resumeUrl && (
              <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">Resume / CV</p>
                  <a href={viewingCandidate.resumeUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary text-xs hover:underline">View Document</a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Source</p>
                <p className="font-semibold text-foreground text-xs">{viewingCandidate.source}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm p-3 rounded-xl bg-muted/20 border border-border/30">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Applied Date</p>
                <p className="font-semibold text-foreground text-xs">{formatDate(viewingCandidate.appliedDate)}</p>
              </div>
            </div>
          </div>

          {/* Interview Info */}
          {viewingCandidate.interviewDate && (
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <p className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-2">
                <CalendarClock className="h-3.5 w-3.5" /> Interview Scheduled
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground">Date: </span><span className="font-semibold">{formatDate(viewingCandidate.interviewDate)}</span></div>
                <div><span className="text-muted-foreground">Time: </span><span className="font-semibold">{viewingCandidate.interviewTime}</span></div>
                <div><span className="text-muted-foreground">Location: </span><span className="font-semibold">{viewingCandidate.interviewLocation || "TBD"}</span></div>
              </div>
            </div>
          )}

          {/* Offer Info */}
          {(viewingCandidate.offeredSalary || viewingCandidate.offeredStartDate) && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
                <CheckCircle className="h-3.5 w-3.5" /> Offer Details
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {viewingCandidate.offeredSalary && <div><span className="text-muted-foreground">Salary: </span><span className="font-semibold">{viewingCandidate.offeredSalary}</span></div>}
                {viewingCandidate.offeredStartDate && <div><span className="text-muted-foreground">Start Date: </span><span className="font-semibold">{formatDate(viewingCandidate.offeredStartDate)}</span></div>}
                {viewingCandidate.joiningManager && <div><span className="text-muted-foreground">Manager: </span><span className="font-semibold">{viewingCandidate.joiningManager}</span></div>}
              </div>
            </div>
          )}

          {/* Stage History */}
          {viewingCandidate.stageHistory && viewingCandidate.stageHistory.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Stage History</p>
              <div className="flex flex-wrap gap-2">
                {viewingCandidate.stageHistory.map((h: any, i: number) => (
                  <div key={i} className="flex items-center gap-1">
                    <Badge variant="outline" className={cn("text-[10px] border", STAGE_COLORS[h.stage as AnyStage] || "")}>
                      {h.stage}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(h.date)}</span>
                    {i < viewingCandidate.stageHistory!.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change Stage */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Change Stage</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STAGES.map(stage => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => { promoteCandidate(viewingCandidate.id, stage); setViewingCandidate((prev: any) => prev ? { ...prev, stage: stage } : null) }}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all",
                    viewingCandidate.stage === stage
                      ? cn(STAGE_COLORS[stage], "border-current")
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <StickyNote className="h-3.5 w-3.5" /> Notes
            </p>
            <Textarea
              placeholder="Add notes about this candidate..."
              className="resize-none text-xs"
              rows={3}
              value={detailNotes}
              onChange={e => setDetailNotes(e.target.value)}
              onBlur={() => saveNotes(viewingCandidate.id, detailNotes)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Notes are auto-saved when you click outside the field.</p>
          </div>
        </div>

        <DialogFooter className="mt-4 flex flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEditCandidateClick(viewingCandidate)}>
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
            {(viewingCandidate.stage === "Screening" || viewingCandidate.stage === "Interview") && (
              <Button variant="outline" size="sm" onClick={() => handleEditCandidateInterview(viewingCandidate)}>
                <CalendarClock className="h-4 w-4 mr-1" /> {viewingCandidate.interviewDate ? "Reschedule" : "Schedule Interview"}
              </Button>
            )}
            {viewingCandidate.stage === "Offer" && !viewingCandidate.offerLetterGenerated && (
              <Button size="sm" onClick={() => handleGenerateOfferLetter(viewingCandidate)}>📄 Generate Offer Letter</Button>
            )}
            {viewingCandidate.stage === "Offer" && viewingCandidate.offerLetterGenerated && (
              <Button size="sm" variant="outline" onClick={() => handlePrintOfferLetter(viewingCandidate.id)}>
                <Printer className="h-4 w-4 mr-1" /> Print Offer Letter
              </Button>
            )}
            {viewingCandidate.stage === "Hired" && !viewingCandidate.joiningLetterGenerated && (
              <Button size="sm" onClick={() => handleGenerateJoiningLetter(viewingCandidate)}>✉️ Generate Joining Letter</Button>
            )}
            {viewingCandidate.stage === "Hired" && viewingCandidate.joiningLetterGenerated && (
              <Button size="sm" variant="outline" onClick={() => handlePrintJoiningLetter(viewingCandidate.id)}>
                <Printer className="h-4 w-4 mr-1" /> Print Joining Letter
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={() => deleteCandidate(viewingCandidate.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- InterviewScheduleDialog ---
interface InterviewScheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  interviewCandidate: any
  interviewForm: any
  setInterviewForm: (val: any) => void
  onSubmit: (e: React.FormEvent) => void
}

export function InterviewScheduleDialog({
  isOpen,
  onClose,
  interviewCandidate,
  interviewForm,
  setInterviewForm,
  onSubmit,
}: InterviewScheduleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" /> Schedule Interview
          </DialogTitle>
          <DialogDescription>
            {interviewCandidate ? `Set interview details for ${interviewCandidate.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Interview Date *</Label>
            <Input type="date" value={interviewForm.date} onChange={e => setInterviewForm({ ...interviewForm, date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Interview Time *</Label>
            <Input type="time" value={interviewForm.time} onChange={e => setInterviewForm({ ...interviewForm, time: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Location / Platform</Label>
            <Input placeholder="e.g. Google Meet, Office Room 3A" value={interviewForm.location} onChange={e => setInterviewForm({ ...interviewForm, location: e.target.value })} />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Interview</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
