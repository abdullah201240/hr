import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowRight,
  Plus,
  Search,
  UserPlus,
  Trash2,
  CheckCircle,
  Calendar,
  ClipboardList,
  X,
  Edit2,
  MoreHorizontal,
  Printer,
  Users,
  BriefcaseBusiness,
  TrendingUp,
  Eye,
  Phone,
  ExternalLink,
  FileText,
  MessageSquare,
  CalendarClock,
  ChevronRight,
  StickyNote,
  Link2,
  UserCheck,
  BarChart3,
  PieChart,
  Funnel,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { useSearchParams, useNavigate } from "react-router"
import {
  useJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
  useCandidatesQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useDeleteCandidateMutation,
  useUpdateCandidateStageMutation,
  useScheduleInterviewMutation,
  useGenerateOfferLetterMutation,
  useGenerateJoiningLetterMutation,
  useOnboardingHiresQuery,
  useToggleOnboardingTaskMutation,
  useAddOnboardingTaskMutation,
  useRemoveOnboardingTaskMutation,
} from "@/hooks/useRecruitment"
import type { JobOpening, Candidate } from "@/hooks/useRecruitment"

// ─── Constants & Styling ───────────────────────────────────────────────────

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"] as const
const ALL_STAGES = [...PIPELINE_STAGES, "Rejected"] as const

type PipelineStage = typeof PIPELINE_STAGES[number]
type AnyStage = typeof ALL_STAGES[number]

const STAGE_COLORS: Record<AnyStage, string> = {
  Applied: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  Screening: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Interview: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Technical: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Offer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Hired: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  Rejected: "bg-red-500/10 text-red-600 border-red-500/20",
}

const SOURCE_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const escHtml = (str: string | undefined | null): string => {
  if (!str) return ""
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecruitmentPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") as "jobs" | "pipeline" | "onboarding" | "analytics") || "jobs"

  const setActiveTab = (tab: "jobs" | "pipeline" | "onboarding" | "analytics") => {
    setSearchParams({ tab }, { replace: true })
  }

  // ─── Core Queries ──────────────────────────────────────────────────────────
  const { data: jobs = [] } = useJobsQuery()
  const { data: candidates = [] } = useCandidatesQuery()
  const { data: onboardingHires = [] } = useOnboardingHiresQuery()

  // ─── Core Mutations ────────────────────────────────────────────────────────
  const createJobMutation = useCreateJobMutation()
  const updateJobMutation = useUpdateJobMutation()
  const deleteJobMutation = useDeleteJobMutation()

  const createCandidateMutation = useCreateCandidateMutation()
  const updateCandidateMutation = useUpdateCandidateMutation()
  const deleteCandidateMutation = useDeleteCandidateMutation()
  const updateStageMutation = useUpdateCandidateStageMutation()
  const scheduleInterviewMutation = useScheduleInterviewMutation()
  const generateOfferLetterMutation = useGenerateOfferLetterMutation()
  const generateJoiningLetterMutation = useGenerateJoiningLetterMutation()

  const toggleOnboardingTaskMutation = useToggleOnboardingTaskMutation()
  const addOnboardingTaskMutation = useAddOnboardingTaskMutation()
  const removeOnboardingTaskMutation = useRemoveOnboardingTaskMutation()

  // ─── Filter States ─────────────────────────────────────────────────────────
  const [pipelineJobFilter, setPipelineJobFilter] = useState<string>("all")
  const [pipelineStageFilter, setPipelineStageFilter] = useState<string>("all")
  const [onboardingJobFilter, setOnboardingJobFilter] = useState<string>("all")

  // ─── Search & Pagination ───────────────────────────────────────────────────
  const [jobsSearch, setJobsSearch] = useState("")
  const [jobsPage, setJobsPage] = useState(1)
  const [pipelinePage, setPipelinePage] = useState(1)
  const [onboardingPage, setOnboardingPage] = useState(1)

  const JOBS_PER_PAGE = 6
  const PIPELINE_PER_PAGE = 3
  const ONBOARDING_PER_PAGE = 2

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false)
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false)
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false)
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [viewingJob, setViewingJob] = useState<JobOpening | null>(null)
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null)
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null)

  // ─── Form State: Job ───────────────────────────────────────────────────────
  const [newJob, setNewJob] = useState({
    title: "",
    department: "Engineering",
    type: "Full-time",
    location: "",
    experience: "",
    description: "",
    status: "Open" as "Open" | "Closed",
    applicants: 0,
  })

  // ─── Form State: Candidate ─────────────────────────────────────────────────
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    linkedIn: "",
    resumeUrl: "",
    role: "",
    source: "LinkedIn",
    stage: "Applied" as Candidate["stage"],
  })

  // ─── Form State: Interview ─────────────────────────────────────────────────
  const [interviewForm, setInterviewForm] = useState({
    date: "",
    time: "",
    location: "",
  })

  // ─── Inline notes for candidate detail ────────────────────────────────────
  const [detailNotes, setDetailNotes] = useState("")
  const [newOnboardingTaskText, setNewOnboardingTaskText] = useState<Record<string, string>>({})

  useEffect(() => { setJobsPage(1) }, [jobsSearch])
  useEffect(() => { setPipelinePage(1) }, [pipelineJobFilter, pipelineStageFilter])
  useEffect(() => { setOnboardingPage(1) }, [onboardingJobFilter])

  // ─── Computed Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const openJobs = jobs.filter(j => j.status === "Open").length
    const totalApplicants = candidates.length
    const thisMonth = new Date().toISOString().slice(0, 7)
    const hiredThisMonth = candidates.filter(c => c.stage === "Hired" && (c.stageHistory?.find(s => s.stage === "Hired")?.date || "").startsWith(thisMonth)).length
    const pipelineActive = candidates.filter(c => c.stage !== "Hired" && c.stage !== "Rejected").length
    return { openJobs, totalApplicants, hiredThisMonth, pipelineActive }
  }, [jobs, candidates])

  // ─── Offer Letter ──────────────────────────────────────────────────────────
  const handleGenerateOfferLetter = (cand: Candidate) => {
    Swal.fire({
      title: "Generate Offer Letter",
      html: `
        <div class="text-left space-y-3">
          <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mb-1">Annual Salary Offered *</label>
          <input id="swal-salary" class="swal2-input !mt-0 !w-full" placeholder="e.g. BDT 1,20,000 / month" value="${escHtml(cand.offeredSalary) || "BDT 1,20,000 / month"}">
          <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mt-3 mb-1">Proposed Start Date *</label>
          <input id="swal-start-date" type="date" class="swal2-input !mt-0 !w-full" value="${cand.offeredStartDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Generate & Send",
      preConfirm: () => {
        const salary = (document.getElementById("swal-salary") as HTMLInputElement).value
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value
        if (!salary || !startDate) { Swal.showValidationMessage("Please enter all details"); return false }
        return { salary, startDate }
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        generateOfferLetterMutation.mutate({
          id: cand.id,
          offeredSalary: result.value.salary,
          offeredStartDate: result.value.startDate,
        }, {
          onSuccess: (updatedCand) => {
            if (viewingCandidate?.id === cand.id) {
              setViewingCandidate(updatedCand)
            }
            Swal.fire({ title: "Offer Letter Generated!", icon: "success", text: "The offer has been recorded. Use the print button to generate the printable document." })
          }
        })
      }
    })
  }

  const handleGenerateJoiningLetter = (cand: Candidate) => {
    Swal.fire({
      title: "Generate Joining Letter",
      html: `
        <div class="text-left space-y-3">
          <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mb-1">Reporting Manager *</label>
          <input id="swal-manager" class="swal2-input !mt-0 !w-full" placeholder="e.g. Michael Torres" value="${escHtml(cand.joiningManager) || ""}">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Generate & Issue",
      preConfirm: () => {
        const manager = (document.getElementById("swal-manager") as HTMLInputElement).value
        if (!manager) { Swal.showValidationMessage("Please enter manager name"); return false }
        return { manager }
      }
    }).then(result => {
      if (result.isConfirmed && result.value) {
        generateJoiningLetterMutation.mutate({
          id: cand.id,
          joiningManager: result.value.manager,
        }, {
          onSuccess: (updatedCand) => {
            if (viewingCandidate?.id === cand.id) {
              setViewingCandidate(updatedCand)
            }
            Swal.fire({ title: "Joining Letter Issued!", icon: "success", text: "Use the print button to generate the printable joining letter." })
          }
        })
      }
    })
  }

  // ─── Job CRUD ──────────────────────────────────────────────────────────────
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJob.title || !newJob.location || !newJob.experience) {
      Swal.fire("Error", "Please fill in all mandatory fields.", "error"); return
    }
    if (editingJob) {
      updateJobMutation.mutate({
        id: editingJob.id,
        data: {
          title: newJob.title,
          department: newJob.department,
          type: newJob.type,
          location: newJob.location,
          experience: newJob.experience,
          description: newJob.description,
          status: newJob.status,
        }
      }, {
        onSuccess: () => {
          Swal.fire("Updated!", "Job requisition updated successfully.", "success")
          setIsJobModalOpen(false)
          setEditingJob(null)
          setNewJob({ title: "", department: "Engineering", type: "Full-time", location: "", experience: "", description: "", status: "Open", applicants: 0 })
        }
      })
    } else {
      createJobMutation.mutate({
        title: newJob.title,
        department: newJob.department,
        type: newJob.type,
        location: newJob.location,
        experience: newJob.experience,
        description: newJob.description,
        status: newJob.status,
      }, {
        onSuccess: () => {
          Swal.fire("Created!", "Job requisition opened successfully.", "success")
          setIsJobModalOpen(false)
          setEditingJob(null)
          setNewJob({ title: "", department: "Engineering", type: "Full-time", location: "", experience: "", description: "", status: "Open", applicants: 0 })
        }
      })
    }
  }

  const handleEditJobClick = (job: JobOpening) => {
    setEditingJob(job)
    setNewJob({ title: job.title, department: job.department, type: job.type, location: job.location, experience: job.experience, description: job.description || "", status: job.status, applicants: job.applicants || 0 })
    setIsJobModalOpen(true)
  }

  const deleteJob = (id: string) => {
    Swal.fire({ title: "Archive this role?", text: "This will remove the job requisition.", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, archive!" })
      .then(r => {
        if (r.isConfirmed) {
          deleteJobMutation.mutate(id, {
            onSuccess: () => {
              Swal.fire("Archived", "Job requisition removed.", "success")
            }
          })
        }
      })
  }

  // ─── Candidate CRUD ────────────────────────────────────────────────────────
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCandidate.name || !newCandidate.email || !newCandidate.role) {
      Swal.fire("Error", "Please fill in all mandatory fields.", "error"); return
    }

    if (editingCandidate) {
      updateCandidateMutation.mutate({
        id: editingCandidate.id,
        data: {
          name: newCandidate.name,
          email: newCandidate.email,
          phone: newCandidate.phone,
          linkedIn: newCandidate.linkedIn,
          resumeUrl: newCandidate.resumeUrl,
          role: newCandidate.role,
          source: newCandidate.source,
        }
      }, {
        onSuccess: (updatedCand) => {
          if (viewingCandidate?.id === editingCandidate.id) {
            setViewingCandidate(updatedCand)
          }
          Swal.fire("Updated!", "Candidate record updated.", "success")
          setIsCandidateModalOpen(false)
          setEditingCandidate(null)
          setNewCandidate({ name: "", email: "", phone: "", linkedIn: "", resumeUrl: "", role: "", source: "LinkedIn", stage: "Applied" })
        }
      })
    } else {
      createCandidateMutation.mutate({
        name: newCandidate.name,
        email: newCandidate.email,
        phone: newCandidate.phone || undefined,
        linkedIn: newCandidate.linkedIn || undefined,
        resumeUrl: newCandidate.resumeUrl || undefined,
        role: newCandidate.role,
        source: newCandidate.source,
        stage: newCandidate.stage,
        notes: "",
      }, {
        onSuccess: () => {
          Swal.fire("Added!", "Candidate entered into the pipeline.", "success")
          setIsCandidateModalOpen(false)
          setEditingCandidate(null)
          setNewCandidate({ name: "", email: "", phone: "", linkedIn: "", resumeUrl: "", role: "", source: "LinkedIn", stage: "Applied" })
        }
      })
    }
  }

  const handleEditCandidateClick = (cand: Candidate) => {
    setEditingCandidate(cand)
    setNewCandidate({
      name: cand.name,
      email: cand.email,
      phone: cand.phone || "",
      linkedIn: cand.linkedIn || "",
      resumeUrl: cand.resumeUrl || "",
      role: cand.role,
      source: cand.source,
      stage: cand.stage,
    })
    setIsCandidateDetailOpen(false)
    setIsCandidateModalOpen(true)
  }

  const deleteCandidate = (id: string) => {
    Swal.fire({ title: "Remove Candidate?", text: "This will remove the candidate record.", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, remove!" })
      .then(r => {
        if (r.isConfirmed) {
          deleteCandidateMutation.mutate(id, {
            onSuccess: () => {
              setIsCandidateDetailOpen(false)
              Swal.fire("Removed", "Candidate removed.", "success")
            }
          })
        }
      })
  }

  // ─── Stage Promotion ───────────────────────────────────────────────────────
  const promoteCandidate = (candidateId: string, nextStage: Candidate["stage"]) => {
    updateStageMutation.mutate({ id: candidateId, stage: nextStage }, {
      onSuccess: (updatedCand) => {
        if (viewingCandidate?.id === candidateId) {
          setViewingCandidate(updatedCand)
        }
      }
    })
  }

  // ─── Interview Scheduling ──────────────────────────────────────────────────
  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!interviewCandidate) return
    if (!interviewForm.date || !interviewForm.time) {
      Swal.fire("Error", "Please provide date and time.", "error"); return
    }
    scheduleInterviewMutation.mutate({
      id: interviewCandidate.id,
      date: interviewForm.date,
      time: interviewForm.time,
      location: interviewForm.location,
    }, {
      onSuccess: (updatedCand) => {
        if (viewingCandidate?.id === interviewCandidate.id) {
          setViewingCandidate(updatedCand)
        }
        setIsInterviewModalOpen(false)
        setInterviewCandidate(null)
        setInterviewForm({ date: "", time: "", location: "" })
        Swal.fire("Scheduled!", "Interview has been scheduled and saved.", "success")
      }
    })
  }

  // ─── Notes Save ────────────────────────────────────────────────────────────
  const saveNotes = (candidateId: string, notes: string) => {
    updateCandidateMutation.mutate({
      id: candidateId,
      data: { notes }
    }, {
      onSuccess: (updatedCand) => {
        if (viewingCandidate?.id === candidateId) {
          setViewingCandidate(updatedCand)
        }
      }
    })
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────
  const toggleOnboardingTask = (_hireId: string, taskId: string) => {
    toggleOnboardingTaskMutation.mutate(taskId)
  }

  const addOnboardingTask = (hireId: string) => {
    const text = (newOnboardingTaskText[hireId] || "").trim()
    if (!text) return
    addOnboardingTaskMutation.mutate({ hireId, title: text }, {
      onSuccess: () => {
        setNewOnboardingTaskText(prev => ({ ...prev, [hireId]: "" }))
      }
    })
  }

  const deleteOnboardingTask = (_hireId: string, taskId: string) => {
    removeOnboardingTaskMutation.mutate(taskId)
  }

  // ─── Dynamic Applicant Counts ──────────────────────────────────────────────
  const getApplicantCount = (jobTitle: string) => candidates.filter(c => c.role === jobTitle).length

  // ─── Open Candidate Detail ─────────────────────────────────────────────────
  const openCandidateDetail = (cand: Candidate) => {
    setViewingCandidate(cand)
    setDetailNotes(cand.notes || "")
    setIsCandidateDetailOpen(true)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment & Onboarding</h2>
          <p className="text-muted-foreground text-sm">
            Manage your recruitment pipeline, open roles, candidate tracking, and new hire onboarding checklists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "jobs" && (
            <Button className="gap-2 shadow-sm" onClick={() => { setEditingJob(null); setNewJob({ title: "", department: "Engineering", type: "Full-time", location: "", experience: "", description: "", status: "Open", applicants: 0 }); setIsJobModalOpen(true) }}>
              <Plus className="h-4 w-4" /> Open Requisition
            </Button>
          )}
          {activeTab === "pipeline" && (
            <Button className="gap-2 shadow-sm" onClick={() => { setEditingCandidate(null); setNewCandidate({ name: "", email: "", phone: "", linkedIn: "", resumeUrl: "", role: "", source: "LinkedIn", stage: "Applied" }); setIsCandidateModalOpen(true) }}>
              <UserPlus className="h-4 w-4" /> Add Candidate
            </Button>
          )}
        </div>
      </div>

      {/* ─── Stats KPI Bar ───────────────────────────────────────────── */}
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

      {/* ─── Tab Selector ───────────────────────────────────────────── */}
      <div className="flex border-b border-border overflow-x-auto">
        {(["jobs", "pipeline", "onboarding", "analytics"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold capitalize border-b-2 -mb-[2px] transition-all whitespace-nowrap flex items-center gap-1.5",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "jobs" && <BriefcaseBusiness className="h-3.5 w-3.5" />}
            {tab === "pipeline" && <Funnel className="h-3.5 w-3.5" />}
            {tab === "onboarding" && <ClipboardList className="h-3.5 w-3.5" />}
            {tab === "analytics" && <BarChart3 className="h-3.5 w-3.5" />}
            {tab === "jobs" ? "Job Openings" : tab === "pipeline" ? "Pipeline ATS" : tab === "onboarding" ? "Onboarding" : "Analytics"}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB: JOB OPENINGS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "jobs" && (() => {
        const filteredJobs = jobs.filter(job =>
          job.title.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          job.department.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          job.location.toLowerCase().includes(jobsSearch.toLowerCase())
        )
        const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
        const start = (jobsPage - 1) * JOBS_PER_PAGE
        const paginated = filteredJobs.slice(start, start + JOBS_PER_PAGE)

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">Open Requisitions</h3>
                <p className="text-sm text-muted-foreground">Monitor currently active and filled job requisitions</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search job roles..." className="pl-9" value={jobsSearch} onChange={e => setJobsSearch(e.target.value)} />
              </div>
            </div>

            <div className="w-full overflow-x-auto bg-transparent">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Job Title</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Type / Location</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Experience</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Date Opened</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground text-center">Applicants</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(job => (
                    <TableRow key={job.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{job.title}</p>
                          {job.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 max-w-[200px]">{job.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">{job.department}</TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-sm text-muted-foreground">
                        <span className="font-medium">{job.type}</span> • {job.location}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-3 text-sm">{job.experience}</TableCell>
                      <TableCell className="hidden md:table-cell py-3 text-sm">{job.dateOpened}</TableCell>
                      <TableCell className="hidden lg:table-cell py-3 text-center">
                        <span className="font-bold text-sm">{getApplicantCount(job.title)}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant={job.status === "Open" ? "default" : "secondary"}
                          className={job.status === "Open" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {job.description && (
                              <DropdownMenuItem onClick={() => { setViewingJob(job); setIsJobDetailOpen(true) }}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditJobClick(job)}>
                              <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => deleteJob(job.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center border-b-0">
                        <p className="text-sm text-muted-foreground">No jobs found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                <span className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setJobsPage(p => Math.max(p - 1, 1))} disabled={jobsPage === 1} className="h-8 text-xs cursor-pointer">Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setJobsPage(p => Math.min(p + 1, totalPages))} disabled={jobsPage === totalPages} className="h-8 text-xs cursor-pointer">Next</Button>
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: PIPELINE ATS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "pipeline" && (() => {
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
                <Select value={pipelineJobFilter} onValueChange={setPipelineJobFilter}>
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
                <Select value={pipelineStageFilter} onValueChange={setPipelineStageFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="All Stages" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {ALL_STAGES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
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
                                      {/* Delete button */}
                                      <button
                                        type="button"
                                        className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={e => { e.stopPropagation(); deleteCandidate(cand.id) }}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                      <p className="text-[11px] font-bold truncate pr-3 text-foreground">{cand.name}</p>
                                      <p className="text-[9px] text-muted-foreground truncate">{cand.email}</p>

                                      {/* Interview badge */}
                                      {cand.interviewDate && (stage === "Interview" || stage === "Screening") && (
                                        <div className="mt-1.5 flex items-center gap-1 text-[8px] text-violet-600 bg-violet-500/10 px-1 py-0.5 rounded font-semibold">
                                          <CalendarClock className="h-2.5 w-2.5" />
                                          {cand.interviewDate} {cand.interviewTime}
                                        </div>
                                      )}

                                      {/* Notes badge */}
                                      {cand.notes && (
                                        <div className="mt-1 flex items-center gap-1 text-[8px] text-amber-600 font-semibold">
                                          <StickyNote className="h-2.5 w-2.5" />
                                          Note
                                        </div>
                                      )}

                                      {/* Offer stage actions */}
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

                                      {/* Hired stage actions */}
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

                                      {/* Bottom row */}
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

                      {/* Rejected section */}
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
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ONBOARDING
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "onboarding" && (() => {
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
                <Select value={onboardingJobFilter} onValueChange={setOnboardingJobFilter}>
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
                        const completedCount = hire.tasks.filter(t => t.completed).length
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
                                {hire.tasks.map(task => (
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
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ANALYTICS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (() => {
        // ── Funnel data ──
        const funnelData = PIPELINE_STAGES.map(stage => ({
          stage,
          count: candidates.filter(c => {
            const stageIdx = PIPELINE_STAGES.indexOf(stage as PipelineStage)
            const candidateStageIdx = PIPELINE_STAGES.indexOf(c.stage as PipelineStage)
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
            const hiredEntry = c.stageHistory?.find(s => s.stage === "Hired")
            return hiredEntry?.date?.startsWith(monthKey)
          }).length
          return { label, count }
        })
        const hireMax = Math.max(...monthlyHires.map(m => m.count), 1)

        // ── Avg days to hire ──
        const hiredCandidates = candidates.filter(c => c.stage === "Hired" && c.appliedDate)
        const avgDays = hiredCandidates.length > 0
          ? Math.round(hiredCandidates.reduce((sum, c) => {
            const hiredEntry = c.stageHistory?.find(s => s.stage === "Hired")
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
                        <div key={source} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
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
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      {/* 1. Add / Edit Job Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job Requisition" : "Open Job Requisition"}</DialogTitle>
            <DialogDescription>{editingJob ? "Update the details for this job posting." : "Create a new job posting for the recruitment pipeline."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Title *</Label>
              <Input placeholder="e.g. Senior Frontend Engineer" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department</Label>
                <Select value={newJob.department} onValueChange={v => setNewJob({ ...newJob, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Engineering", "Product", "HR", "Sales", "Finance", "Marketing", "Operations"].map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Employment Type</Label>
                <Select value={newJob.type} onValueChange={v => setNewJob({ ...newJob, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location *</Label>
                <Input placeholder="e.g. Dhaka, BD" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Experience Needed *</Label>
                <Input placeholder="e.g. 3-5 years" value={newJob.experience} onChange={e => setNewJob({ ...newJob, experience: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Description</Label>
              <Textarea placeholder="Describe the role, responsibilities, and requirements..." value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} rows={3} className="resize-none" />
            </div>
            {editingJob && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={newJob.status} onValueChange={v => setNewJob({ ...newJob, status: v as "Open" | "Closed" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Applicants Count</Label>
                  <Input type="number" min="0" value={newJob.applicants} onChange={e => setNewJob({ ...newJob, applicants: Number(e.target.value) || 0 })} />
                </div>
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsJobModalOpen(false)}>Cancel</Button>
              <Button type="submit">{editingJob ? "Save Changes" : "Open Requisition"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add / Edit Candidate Modal */}
      <Dialog open={isCandidateModalOpen} onOpenChange={v => { if (!v) setEditingCandidate(null); setIsCandidateModalOpen(v) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCandidate ? "Edit Candidate Record" : "Add Candidate Record"}</DialogTitle>
            <DialogDescription>{editingCandidate ? "Update this candidate's profile details." : "Enter a candidate into the recruitment workflow pipeline."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCandidate} className="space-y-4">
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
                <Select value={newCandidate.stage} onValueChange={v => setNewCandidate({ ...newCandidate, stage: v as Candidate["stage"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_STAGES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsCandidateModalOpen(false); setEditingCandidate(null) }}>Cancel</Button>
              <Button type="submit">{editingCandidate ? "Save Changes" : "Add Candidate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Job Detail Modal */}
      <Dialog open={isJobDetailOpen} onOpenChange={setIsJobDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5 text-primary" />
              {viewingJob?.title}
            </DialogTitle>
            <DialogDescription>{viewingJob?.department} • {viewingJob?.type} • {viewingJob?.location}</DialogDescription>
          </DialogHeader>
          {viewingJob && (
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
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsJobDetailOpen(false)}>Close</Button>
            <Button onClick={() => { setIsJobDetailOpen(false); if (viewingJob) handleEditJobClick(viewingJob) }}>
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Candidate Detail Modal */}
      <Dialog open={isCandidateDetailOpen} onOpenChange={setIsCandidateDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {viewingCandidate && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl">{viewingCandidate.name}</DialogTitle>
                    <DialogDescription className="mt-1">{viewingCandidate.role}</DialogDescription>
                  </div>
                  <Badge className={cn("mt-1 shrink-0 border", STAGE_COLORS[viewingCandidate.stage] || "")}>
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
                      {viewingCandidate.stageHistory.map((h, i) => (
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
                        onClick={() => { promoteCandidate(viewingCandidate.id, stage as Candidate["stage"]); setViewingCandidate(prev => prev ? { ...prev, stage: stage as Candidate["stage"] } : null) }}
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
                    <Button variant="outline" size="sm" onClick={() => {
                      setInterviewCandidate(viewingCandidate)
                      setInterviewForm({ date: viewingCandidate.interviewDate || "", time: viewingCandidate.interviewTime || "", location: viewingCandidate.interviewLocation || "" })
                      setIsInterviewModalOpen(true)
                    }}>
                      <CalendarClock className="h-4 w-4 mr-1" /> {viewingCandidate.interviewDate ? "Reschedule" : "Schedule Interview"}
                    </Button>
                  )}
                  {viewingCandidate.stage === "Offer" && !viewingCandidate.offerLetterGenerated && (
                    <Button size="sm" onClick={() => handleGenerateOfferLetter(viewingCandidate)}>📄 Generate Offer Letter</Button>
                  )}
                  {viewingCandidate.stage === "Offer" && viewingCandidate.offerLetterGenerated && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/print-offer/${viewingCandidate.id}`)}>
                      <Printer className="h-4 w-4 mr-1" /> Print Offer Letter
                    </Button>
                  )}
                  {viewingCandidate.stage === "Hired" && !viewingCandidate.joiningLetterGenerated && (
                    <Button size="sm" onClick={() => handleGenerateJoiningLetter(viewingCandidate)}>✉️ Generate Joining Letter</Button>
                  )}
                  {viewingCandidate.stage === "Hired" && viewingCandidate.joiningLetterGenerated && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/recruitment/print/${viewingCandidate.id}`)}>
                      <Printer className="h-4 w-4 mr-1" /> Print Joining Letter
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={() => deleteCandidate(viewingCandidate.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsCandidateDetailOpen(false)}>Close</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 5. Schedule Interview Modal */}
      <Dialog open={isInterviewModalOpen} onOpenChange={setIsInterviewModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" /> Schedule Interview
            </DialogTitle>
            <DialogDescription>
              {interviewCandidate ? `Set interview details for ${interviewCandidate.name}` : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleInterview} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setIsInterviewModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Interview</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
