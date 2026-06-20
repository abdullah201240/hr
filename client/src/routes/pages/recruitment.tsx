import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Plus,
  UserPlus,
  ClipboardList,
  BriefcaseBusiness,
  BarChart3,
  Funnel,
} from "lucide-react"

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
import { JobCreateDialog } from "@/components/recruitment/JobCreateDialog"
import {
  CandidateApplyDialog,
  JobDetailDialog,
  CandidateDetailDialog,
  InterviewScheduleDialog,
} from "@/components/recruitment/RecruitmentDialogs"
import { JobsTab } from "@/components/recruitment/JobsTab"
import { PipelineTab } from "@/components/recruitment/PipelineTab"
import { OnboardingTab } from "@/components/recruitment/OnboardingTab"
import { AnalyticsTab } from "@/components/recruitment/AnalyticsTab"
import { promptOfferLetter, promptJoiningLetter, formatDate, confirmAction, alertError, alertSuccess } from "@/components/recruitment/recruitment-utils"
import { RecruitmentKPIs } from "@/components/recruitment/RecruitmentKPIs"


// ─── Constants & Styling ───────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    promptOfferLetter(cand, (salary, startDate) => {
      generateOfferLetterMutation.mutate({
        id: cand.id,
        offeredSalary: salary,
        offeredStartDate: startDate,
      }, {
        onSuccess: (updatedCand) => {
          if (viewingCandidate?.id === cand.id) {
            setViewingCandidate(updatedCand)
          }
          alertSuccess("Offer Letter Generated!", "The offer has been recorded. Use the print button to generate the printable document.")
        }
      })
    })
  }

  const handleGenerateJoiningLetter = (cand: Candidate) => {
    promptJoiningLetter(cand, (manager) => {
      generateJoiningLetterMutation.mutate({
        id: cand.id,
        joiningManager: manager,
      }, {
        onSuccess: (updatedCand) => {
          if (viewingCandidate?.id === cand.id) {
            setViewingCandidate(updatedCand)
          }
          alertSuccess("Joining Letter Issued!", "Use the print button to generate the printable joining letter.")
        }
      })
    })
  }

  // ─── Job CRUD ──────────────────────────────────────────────────────────────
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJob.title || !newJob.location || !newJob.experience) {
      alertError("Please fill in all mandatory fields."); return
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
          alertSuccess("Updated!", "Job requisition updated successfully.")
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
          alertSuccess("Created!", "Job requisition opened successfully.")
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
    confirmAction("Archive this role?", "This will remove the job requisition.", "Yes, archive!", () => {
      deleteJobMutation.mutate(id, {
        onSuccess: () => {
          alertSuccess("Archived", "Job requisition removed.")
        }
      })
    })
  }

  // ─── Candidate CRUD ────────────────────────────────────────────────────────
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCandidate.name || !newCandidate.email || !newCandidate.role) {
      alertError("Please fill in all mandatory fields."); return
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
          alertSuccess("Updated!", "Candidate record updated.")
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
          alertSuccess("Added!", "Candidate entered into the pipeline.")
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
    confirmAction("Remove Candidate?", "This will remove the candidate record.", "Yes, remove!", () => {
      deleteCandidateMutation.mutate(id, {
        onSuccess: () => {
          setIsCandidateDetailOpen(false)
          alertSuccess("Removed", "Candidate removed.")
        }
      })
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
      alertError("Please provide date and time."); return
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
        alertSuccess("Scheduled!", "Interview has been scheduled and saved.")
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
      <RecruitmentKPIs stats={stats} />

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
      {activeTab === "jobs" && (
        <JobsTab
          jobs={jobs}
          getApplicantCount={getApplicantCount}
          setViewingJob={setViewingJob}
          setIsJobDetailOpen={setIsJobDetailOpen}
          handleEditJobClick={handleEditJobClick}
          deleteJob={deleteJob}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: PIPELINE ATS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "pipeline" && (
        <PipelineTab
          jobs={jobs}
          candidates={candidates}
          pipelineJobFilter={pipelineJobFilter}
          setPipelineJobFilter={setPipelineJobFilter}
          pipelineStageFilter={pipelineStageFilter}
          setPipelineStageFilter={setPipelineStageFilter}
          openCandidateDetail={openCandidateDetail}
          deleteCandidate={(id) => deleteCandidateMutation.mutate(id)}
          handleGenerateOfferLetter={handleGenerateOfferLetter}
          handleGenerateJoiningLetter={handleGenerateJoiningLetter}
          promoteCandidate={(id, stage) => updateStageMutation.mutate({ id, stage })}
          navigate={navigate}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ONBOARDING
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "onboarding" && (
        <OnboardingTab
          jobs={jobs}
          onboardingHires={onboardingHires}
          onboardingJobFilter={onboardingJobFilter}
          setOnboardingJobFilter={setOnboardingJobFilter}
          candidates={candidates}
          navigate={navigate}
          handleGenerateJoiningLetter={handleGenerateJoiningLetter}
          toggleOnboardingTask={toggleOnboardingTask}
          deleteOnboardingTask={deleteOnboardingTask}
          addOnboardingTask={addOnboardingTask}
          newOnboardingTaskText={newOnboardingTaskText}
          setNewOnboardingTaskText={setNewOnboardingTaskText}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB: ANALYTICS
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "analytics" && (
        <AnalyticsTab
          jobs={jobs}
          candidates={candidates}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════ */}

      <JobCreateDialog
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        editingJob={editingJob}
        newJob={newJob}
        setNewJob={setNewJob}
        onSubmit={handleAddJob}
      />

      <CandidateApplyDialog
        isOpen={isCandidateModalOpen}
        onClose={() => { setIsCandidateModalOpen(false); setEditingCandidate(null); }}
        editingCandidate={editingCandidate}
        newCandidate={newCandidate}
        setNewCandidate={setNewCandidate}
        onSubmit={handleAddCandidate}
        jobs={jobs}
      />

      <JobDetailDialog
        isOpen={isJobDetailOpen}
        onClose={() => setIsJobDetailOpen(false)}
        viewingJob={viewingJob}
        getApplicantCount={getApplicantCount}
        formatDate={formatDate}
        onEdit={(job) => { setIsJobDetailOpen(false); handleEditJobClick(job); }}
      />

      <CandidateDetailDialog
        isOpen={isCandidateDetailOpen}
        onClose={() => setIsCandidateDetailOpen(false)}
        viewingCandidate={viewingCandidate}
        setViewingCandidate={setViewingCandidate}
        formatDate={formatDate}
        promoteCandidate={promoteCandidate}
        detailNotes={detailNotes}
        setDetailNotes={setDetailNotes}
        saveNotes={saveNotes}
        handleEditCandidateClick={handleEditCandidateClick}
        handleEditCandidateInterview={(c) => {
          setInterviewCandidate(c)
          setInterviewForm({ date: c.interviewDate || "", time: c.interviewTime || "", location: c.interviewLocation || "" })
          setIsInterviewModalOpen(true)
        }}
        handleGenerateOfferLetter={handleGenerateOfferLetter}
        handlePrintOfferLetter={(id) => navigate(`/recruitment/print-offer/${id}`)}
        handleGenerateJoiningLetter={handleGenerateJoiningLetter}
        handlePrintJoiningLetter={(id) => navigate(`/recruitment/print/${id}`)}
        deleteCandidate={deleteCandidate}
      />

      <InterviewScheduleDialog
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        interviewCandidate={interviewCandidate}
        interviewForm={interviewForm}
        setInterviewForm={setInterviewForm}
        onSubmit={handleScheduleInterview}
      />
    </div>
  )
}
