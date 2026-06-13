import { useState, useEffect } from "react"
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
  Briefcase,
  Users,
  ArrowRight,
  Plus,
  Search,
  UserPlus,
  TrendingUp,
  FileCheck2,
  Trash2,
  CheckCircle,
  Calendar,
  ClipboardList,
  X,
  Pencil,
  Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { useSearchParams, useNavigate } from "react-router"

// Interfaces
interface JobOpening {
  id: string
  title: string
  department: string
  type: string
  location: string
  experience: string
  status: "Open" | "Closed"
  dateOpened: string
  applicants: number
}

interface Candidate {
  id: string
  name: string
  email: string
  role: string
  source: string
  stage: "Applied" | "Screening" | "Interview" | "Technical" | "Offer" | "Hired"
  appliedDate: string
  offerLetterGenerated?: boolean
  joiningLetterGenerated?: boolean
  offeredSalary?: string
  offeredStartDate?: string
  joiningManager?: string
}

interface OnboardingTask {
  id: string
  title: string
  completed: boolean
}

interface OnboardingHire {
  id: string
  candidateId: string
  name: string
  role: string
  department: string
  startDate: string
  tasks: OnboardingTask[]
}

// Initial Mock Data
const INITIAL_JOBS: JobOpening[] = [
  { id: "job-1", title: "Software Engineer", department: "Engineering", type: "Full-time", location: "Dhaka, BD (Hybrid)", experience: "2-4 years", status: "Open", dateOpened: "2026-06-01", applicants: 18 },
  { id: "job-2", title: "Senior Product Designer", department: "Product", type: "Full-time", location: "Remote", experience: "5+ years", status: "Open", dateOpened: "2026-05-25", applicants: 12 },
  { id: "job-3", title: "HR Manager", department: "HR", type: "Full-time", location: "Dhaka, BD (Onsite)", experience: "4-6 years", status: "Open", dateOpened: "2026-06-05", applicants: 8 },
  { id: "job-4", title: "DevOps Engineer", department: "Engineering", type: "Full-time", location: "Remote", experience: "3-5 years", status: "Closed", dateOpened: "2026-05-10", applicants: 15 },
]

const INITIAL_CANDIDATES: Candidate[] = [
  { id: "cand-1", name: "Alex Rivera", email: "alex.rivera@gmail.com", role: "Software Engineer", source: "LinkedIn", stage: "Applied", appliedDate: "2026-06-11" },
  { id: "cand-2", name: "Maya Lin", email: "maya.lin@outlook.com", role: "Senior Product Designer", source: "Referral", stage: "Interview", appliedDate: "2026-06-08" },
  { id: "cand-3", name: "Liam Patel", email: "liam.patel@yahoo.com", role: "Software Engineer", source: "Job Board", stage: "Technical", appliedDate: "2026-06-05" },
  { id: "cand-4", name: "Emily Watson", email: "emily.watson@gmail.com", role: "HR Manager", source: "LinkedIn", stage: "Offer", appliedDate: "2026-06-07" },
  { id: "cand-5", name: "Jane Cooper", email: "jane.cooper@company.com", role: "Software Engineer", source: "Careers Site", stage: "Hired", appliedDate: "2026-06-02" },
]

const INITIAL_ONBOARDING: OnboardingHire[] = [
  {
    id: "onb-1",
    candidateId: "cand-5",
    name: "Jane Cooper",
    role: "Software Engineer",
    department: "Engineering",
    startDate: "2026-07-01",
    tasks: [
      { id: "task-1", title: "Sign employment contract & NDA", completed: true },
      { id: "task-2", title: "Complete payroll & banking documentation", completed: true },
      { id: "task-3", title: "IT hardware setup & account provisioning", completed: false },
      { id: "task-4", title: "Welcome & intro meeting with the team", completed: false },
      { id: "task-5", title: "Review product roadmap and tech docs", completed: false },
    ]
  }
]

const PIPELINE_STAGES = ["Applied", "Screening", "Interview", "Technical", "Offer", "Hired"] as const

export default function RecruitmentPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get("tab") as "overview" | "jobs" | "pipeline" | "onboarding") || "overview"

  const setActiveTab = (tab: "overview" | "jobs" | "pipeline" | "onboarding") => {
    setSearchParams({ tab }, { replace: true })
  }

  // Core States
  const [jobs, setJobs] = useState<JobOpening[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [onboardingHires, setOnboardingHires] = useState<OnboardingHire[]>([])
  const [pipelineJobFilter, setPipelineJobFilter] = useState<string>("all")
  const [onboardingJobFilter, setOnboardingJobFilter] = useState<string>("all")

  // Pagination & Search States
  const [jobsSearch, setJobsSearch] = useState("")
  const [jobsPage, setJobsPage] = useState(1)
  const [pipelinePage, setPipelinePage] = useState(1)
  const [onboardingPage, setOnboardingPage] = useState(1)

  const JOBS_PER_PAGE = 5
  const PIPELINE_PER_PAGE = 3
  const ONBOARDING_PER_PAGE = 2

  const handleGenerateOfferLetter = (cand: Candidate) => {
    Swal.fire({
      title: "Generate Offer Letter",
      html: `
        <div class="text-left space-y-3">
          <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mb-1">Annual Salary Offered *</label>
          <input id="swal-salary" class="swal2-input !mt-0 !w-full" placeholder="e.g. $75,000 / year" value="$80,000">
          
          <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mt-3 mb-1">Proposed Start Date *</label>
          <input id="swal-start-date" type="date" class="swal2-input !mt-0 !w-full" value="2026-07-01">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Generate & Send",
      preConfirm: () => {
        const salary = (document.getElementById("swal-salary") as HTMLInputElement).value
        const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value
        if (!salary || !startDate) {
          Swal.showValidationMessage("Please enter all details")
          return false
        }
        return { salary, startDate }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const updated = candidates.map(c => {
          if (c.id === cand.id) {
            return {
              ...c,
              offerLetterGenerated: true,
              offeredSalary: result.value.salary,
              offeredStartDate: result.value.startDate
            }
          }
          return c
        })
        saveCandidates(updated)
        
        Swal.fire({
          title: "Offer Letter Generated!",
          icon: "success",
          html: `
            <div class="text-left border p-3 rounded bg-muted/30 text-xs font-mono space-y-2 max-h-60 overflow-y-auto">
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>To:</strong> ${cand.name} (${cand.email})</p>
              <p>Dear ${cand.name},</p>
              <p>We are pleased to offer you the position of <strong>${cand.role}</strong> at our organization. We offer a starting salary of <strong>${result.value.salary}</strong> with a start date of <strong>${result.value.startDate}</strong>.</p>
              <p>Sincerely,<br/>HR Department</p>
            </div>
          `
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
          <input id="swal-manager" class="swal2-input !mt-0 !w-full" placeholder="e.g. Michael Torres" value="Michael Torres">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Generate & Issue",
      preConfirm: () => {
        const manager = (document.getElementById("swal-manager") as HTMLInputElement).value
        if (!manager) {
          Swal.showValidationMessage("Please enter manager name")
          return false
        }
        return { manager }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const updated = candidates.map(c => {
          if (c.id === cand.id) {
            return {
              ...c,
              joiningLetterGenerated: true,
              joiningManager: result.value.manager
            }
          }
          return c
        })
        saveCandidates(updated)
        
        Swal.fire({
          title: "Joining Letter Issued!",
          icon: "success",
          html: `
            <div class="text-left border p-3 rounded bg-muted/30 text-xs font-mono space-y-2 max-h-60 overflow-y-auto">
              <p><strong>OFFICIAL JOINING LETTER</strong></p>
              <p><strong>Employee:</strong> ${cand.name}</p>
              <p><strong>Designation:</strong> ${cand.role}</p>
              <p><strong>Reporting To:</strong> ${result.value.manager}</p>
              <p>Dear ${cand.name},</p>
              <p>Welcome to our team! This letter confirms your active placement. Please report to <strong>${result.value.manager}</strong> on your start date.</p>
            </div>
          `
        })
      }
    })
  }

  // Modal States
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null)

  // Form Fields
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

  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    role: "",
    source: "LinkedIn",
    stage: "Applied" as Candidate["stage"],
  })

  // Load from localStorage or seed initial data
  useEffect(() => {
    const storedJobs = localStorage.getItem("recruitment_jobs")
    const storedCandidates = localStorage.getItem("recruitment_candidates")
    const storedOnboarding = localStorage.getItem("onboarding_hires")

    if (storedJobs) setJobs(JSON.parse(storedJobs))
    else {
      setJobs(INITIAL_JOBS)
      localStorage.setItem("recruitment_jobs", JSON.stringify(INITIAL_JOBS))
    }

    if (storedCandidates) setCandidates(JSON.parse(storedCandidates))
    else {
      setCandidates(INITIAL_CANDIDATES)
      localStorage.setItem("recruitment_candidates", JSON.stringify(INITIAL_CANDIDATES))
    }

    if (storedOnboarding) setOnboardingHires(JSON.parse(storedOnboarding))
    else {
      setOnboardingHires(INITIAL_ONBOARDING)
      localStorage.setItem("onboarding_hires", JSON.stringify(INITIAL_ONBOARDING))
    }
  }, [])

  // Reset pages when filters change
  useEffect(() => {
    setJobsPage(1)
  }, [jobsSearch])

  useEffect(() => {
    setPipelinePage(1)
  }, [pipelineJobFilter])

  useEffect(() => {
    setOnboardingPage(1)
  }, [onboardingJobFilter])

  // Helper to persist state updates
  const saveJobs = (updatedJobs: JobOpening[]) => {
    setJobs(updatedJobs)
    localStorage.setItem("recruitment_jobs", JSON.stringify(updatedJobs))
  }

  const saveCandidates = (updatedCandidates: Candidate[]) => {
    setCandidates(updatedCandidates)
    localStorage.setItem("recruitment_candidates", JSON.stringify(updatedCandidates))
  }

  const saveOnboarding = (updatedOnboarding: OnboardingHire[]) => {
    setOnboardingHires(updatedOnboarding)
    localStorage.setItem("onboarding_hires", JSON.stringify(updatedOnboarding))
  }

  // Job Opening Submissions
  const handleAddJob = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJob.title || !newJob.location || !newJob.experience) {
      Swal.fire("Error", "Please fill in all mandatory fields.", "error")
      return
    }

    if (editingJob) {
      const updated = jobs.map(j => {
        if (j.id === editingJob.id) {
          return {
            ...j,
            title: newJob.title,
            department: newJob.department,
            type: newJob.type,
            location: newJob.location,
            experience: newJob.experience,
            status: newJob.status,
            description: newJob.description,
            applicants: newJob.applicants,
          }
        }
        return j
      })
      saveJobs(updated)
      setIsJobModalOpen(false)
      setEditingJob(null)
      Swal.fire("Updated!", "Job requisition updated successfully.", "success")
    } else {
      const jobToAdd: JobOpening = {
        id: `job-${Date.now()}`,
        title: newJob.title,
        department: newJob.department,
        type: newJob.type,
        location: newJob.location,
        experience: newJob.experience,
        status: "Open",
        dateOpened: new Date().toISOString().split("T")[0],
        applicants: 0,
      }

      saveJobs([jobToAdd, ...jobs])
      setIsJobModalOpen(false)
      Swal.fire("Created!", "Job requisition opened successfully.", "success")
    }

    setNewJob({
      title: "",
      department: "Engineering",
      type: "Full-time",
      location: "",
      experience: "",
      description: "",
      status: "Open",
      applicants: 0,
    })
  }

  const handleEditJobClick = (job: JobOpening) => {
    setEditingJob(job)
    setNewJob({
      title: job.title,
      department: job.department,
      type: job.type,
      location: job.location,
      experience: job.experience,
      description: "",
      status: job.status,
      applicants: job.applicants,
    })
    setIsJobModalOpen(true)
  }

  // Candidate Submissions
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCandidate.name || !newCandidate.email || !newCandidate.role) {
      Swal.fire("Error", "Please fill in all mandatory fields.", "error")
      return
    }

    const candidateToAdd: Candidate = {
      id: `cand-${Date.now()}`,
      name: newCandidate.name,
      email: newCandidate.email,
      role: newCandidate.role,
      source: newCandidate.source,
      stage: newCandidate.stage,
      appliedDate: new Date().toISOString().split("T")[0],
    }

    const updatedCandidates = [candidateToAdd, ...candidates]
    saveCandidates(updatedCandidates)

    // Increment applicants counter for the selected job
    const updatedJobs = jobs.map(j => {
      if (j.title === newCandidate.role) {
        return { ...j, applicants: j.applicants + 1 }
      }
      return j
    })
    saveJobs(updatedJobs)

    // If candidate is created directly as "Hired", push to onboarding
    if (newCandidate.stage === "Hired") {
      createOnboardingForCandidate(candidateToAdd)
    }

    setIsCandidateModalOpen(false)
    setNewCandidate({
      name: "",
      email: "",
      role: "",
      source: "LinkedIn",
      stage: "Applied",
    })
    Swal.fire("Added!", "Candidate has been entered into the pipeline.", "success")
  }

  // Promote Candidate Stage
  const promoteCandidate = (candidateId: string, nextStage: Candidate["stage"]) => {
    const updated = candidates.map(c => {
      if (c.id === candidateId) {
        // If promoting to hired, create onboarding checklist
        if (nextStage === "Hired" && c.stage !== "Hired") {
          const matchingCandidate = { ...c, stage: nextStage }
          createOnboardingForCandidate(matchingCandidate)
        }
        return { ...c, stage: nextStage }
      }
      return c
    })
    saveCandidates(updated)
  }

  // Create Onboarding Profile
  const createOnboardingForCandidate = (c: Candidate) => {
    const match = onboardingHires.find(o => o.candidateId === c.id)
    if (match) return // already onboarded

    // Get department or guess it
    const matchingJob = jobs.find(j => j.title === c.role)
    const department = matchingJob ? matchingJob.department : "Engineering"

    const onboardingProfile: OnboardingHire = {
      id: `onb-${Date.now()}`,
      candidateId: c.id,
      name: c.name,
      role: c.role,
      department,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // default 2 weeks out
      tasks: [
        { id: `t-1-${Date.now()}`, title: "Sign employment contract & NDA", completed: false },
        { id: `t-2-${Date.now()}`, title: "Complete payroll & banking documentation", completed: false },
        { id: `t-3-${Date.now()}`, title: "IT hardware setup & account provisioning", completed: false },
        { id: `t-4-${Date.now()}`, title: "Welcome & intro meeting with the team", completed: false },
        { id: `t-5-${Date.now()}`, title: "Company compliance & security training", completed: false },
      ]
    }
    saveOnboarding([onboardingProfile, ...onboardingHires])
  }

  // Delete Job Requisition
  const deleteJob = (id: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will archive this job opening.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    }).then(result => {
      if (result.isConfirmed) {
        saveJobs(jobs.filter(j => j.id !== id))
        Swal.fire("Archived", "Job requisition archived.", "success")
      }
    })
  }

  // Delete Candidate
  const deleteCandidate = (id: string) => {
    Swal.fire({
      title: "Remove Candidate?",
      text: "This candidate record will be removed from pipeline.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove!"
    }).then(result => {
      if (result.isConfirmed) {
        saveCandidates(candidates.filter(c => c.id !== id))
        saveOnboarding(onboardingHires.filter(o => o.candidateId !== id))
        Swal.fire("Removed", "Candidate removed.", "success")
      }
    })
  }

  // Toggle Onboarding Task completion
  const toggleOnboardingTask = (hireId: string, taskId: string) => {
    const updated = onboardingHires.map(hire => {
      if (hire.id === hireId) {
        const updatedTasks = hire.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, completed: !t.completed }
          }
          return t
        })
        return { ...hire, tasks: updatedTasks }
      }
      return hire
    })
    saveOnboarding(updated)
  }

  // Calculations for dashboard
  const openJobsCount = jobs.filter(j => j.status === "Open").length
  const totalCandidatesCount = candidates.length
  const hiredCandidatesCount = candidates.filter(c => c.stage === "Hired").length
  const onboardingCompletionRate = Math.round(
    onboardingHires.length > 0
      ? (onboardingHires.reduce((acc, hire) => {
          const completed = hire.tasks.filter(t => t.completed).length
          return acc + (completed / hire.tasks.length)
        }, 0) / onboardingHires.length) * 100
      : 0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recruitment & Onboarding</h2>
          <p className="text-muted-foreground text-sm">
            Manage your recruitment pipeline, open roles, candidate tracking, and new hire onboarding checklists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "jobs" && (
            <Button className="gap-2 shadow-sm" onClick={() => {
              setEditingJob(null)
              setNewJob({
                title: "",
                department: "Engineering",
                type: "Full-time",
                location: "",
                experience: "",
                description: "",
                status: "Open",
                applicants: 0,
              })
              setIsJobModalOpen(true)
            }}>
              <Plus className="h-4 w-4" /> Open Requisition
            </Button>
          )}
          {activeTab === "pipeline" && (
            <Button className="gap-2 shadow-sm" onClick={() => setIsCandidateModalOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add Candidate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border">
        {(["overview", "jobs", "pipeline", "onboarding"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-[2px] transition-all",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Openings</p>
                  <p className="text-2xl font-bold">{openJobsCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Candidates</p>
                  <p className="text-2xl font-bold">{totalCandidatesCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Hired Overall</p>
                  <p className="text-2xl font-bold">{hiredCandidatesCount}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <FileCheck2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Onboarding Rate</p>
                  <p className="text-2xl font-bold">{onboardingCompletionRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Pipeline Stage Counts */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/75">
                  Pipeline Funnel
                </CardTitle>
                <CardDescription>Visual breakdown of candidates across key hiring stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {PIPELINE_STAGES.map(stage => {
                    const count = candidates.filter(c => c.stage === stage).length
                    const percentage = totalCandidatesCount > 0 ? (count / totalCandidatesCount) * 100 : 0
                    return (
                      <div key={stage} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground/80">{stage}</span>
                          <span className="text-muted-foreground font-bold">{count} {count === 1 ? "candidate" : "candidates"}</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              stage === "Hired" ? "bg-emerald-500" :
                              stage === "Offer" ? "bg-indigo-500" :
                              stage === "Technical" ? "bg-purple-500" : "bg-primary/75"
                            )}
                            style={{ width: `${percentage || 3}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions / Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground/75">
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Jane Cooper completed NDA signature</p>
                      <p className="text-[10px] text-muted-foreground">Onboarding • Just now</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Alex Rivera applied for Software Engineer</p>
                      <p className="text-[10px] text-muted-foreground">Recruitment • 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Liam Patel promoted to Technical Interview</p>
                      <p className="text-[10px] text-muted-foreground">Recruitment • Yesterday</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">New job position opened: HR Manager</p>
                      <p className="text-[10px] text-muted-foreground">Requisition • 2 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* JOB OPENINGS TAB */}
      {activeTab === "jobs" && (() => {
        const filteredJobs = jobs.filter(job => 
          job.title.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          job.department.toLowerCase().includes(jobsSearch.toLowerCase()) ||
          job.location.toLowerCase().includes(jobsSearch.toLowerCase())
        )
        const totalJobsPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
        const startIndex = (jobsPage - 1) * JOBS_PER_PAGE
        const paginatedJobs = filteredJobs.slice(startIndex, startIndex + JOBS_PER_PAGE)

        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">Open Requisitions</CardTitle>
                  <CardDescription>Monitor currently active and filled job requisitions</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search job roles..." 
                    className="pl-9" 
                    value={jobsSearch}
                    onChange={e => setJobsSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border font-bold text-muted-foreground">
                      <th className="p-3">Job Title</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Type / Location</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Date Opened</th>
                      <th className="p-3 text-center">Applicants</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedJobs.map(job => (
                      <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{job.title}</td>
                        <td className="p-3">{job.department}</td>
                        <td className="p-3 text-muted-foreground">
                          <span className="font-medium">{job.type}</span> • {job.location}
                        </td>
                        <td className="p-3">{job.experience}</td>
                        <td className="p-3">{job.dateOpened}</td>
                        <td className="p-3 text-center font-bold">{job.applicants}</td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                              job.status === "Open"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border/80"
                            )}
                          >
                            {job.status}
                          </span>
                        </td>
                        <td className="p-3 text-right flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditJobClick(job)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {paginatedJobs.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No jobs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalJobsPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} entries
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setJobsPage(prev => Math.max(prev - 1, 1))}
                      disabled={jobsPage === 1}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setJobsPage(prev => Math.min(prev + 1, totalJobsPages))}
                      disabled={jobsPage === totalJobsPages}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* PIPELINE ATS TAB */}
      {activeTab === "pipeline" && (() => {
        // Collect all job groups based on filter
        const pipelineGroups = [
          ...jobs.filter(job => {
            const jobCandidates = candidates.filter(c => c.role === job.title)
            if (job.status === "Closed" && jobCandidates.length === 0) return false
            return pipelineJobFilter === "all" || job.title === pipelineJobFilter
          }).map(job => ({
            type: "active",
            id: job.id,
            title: job.title,
            department: job.department,
            location: job.location,
            status: job.status,
            candidates: candidates.filter(c => c.role === job.title),
          })),
          ...(() => {
            const activeJobTitles = jobs.map(j => j.title)
            const otherCandidates = candidates.filter(c => !activeJobTitles.includes(c.role))
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
                candidates: otherCandidates.filter(c => c.role === roleName),
              }))
          })()
        ]

        const totalPipelinePages = Math.ceil(pipelineGroups.length / PIPELINE_PER_PAGE)
        const startIndex = (pipelinePage - 1) * PIPELINE_PER_PAGE
        const paginatedPipelineGroups = pipelineGroups.slice(startIndex, startIndex + PIPELINE_PER_PAGE)

        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">Job-by-Job Candidate Pipeline</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track candidate progression across the recruitment funnel, separated by active job requisition.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">Filter by Job:</span>
                <Select value={pipelineJobFilter} onValueChange={setPipelineJobFilter}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map(j => (
                      <SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>
                    ))}
                    {(() => {
                      const activeTitles = jobs.map(j => j.title)
                      const otherRoles = Array.from(
                        new Set(candidates.filter(c => !activeTitles.includes(c.role)).map(c => c.role))
                      )
                      return otherRoles.map(role => (
                        <SelectItem key={role} value={role}>{role} (Archived)</SelectItem>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              {paginatedPipelineGroups.map(group => {
                const isArchived = group.type === "archived"
                return (
                  <Card key={group.id} className={cn("border border-border/40 shadow-none", isArchived && "border-dashed bg-muted/5")}>
                    <CardHeader className="pb-3 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-bold text-foreground">
                            {group.title}
                          </CardTitle>
                          <span className={cn("text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted", isArchived && "bg-muted/80 italic")}>
                            {isArchived ? "Archived / Unlisted Role" : group.department}
                          </span>
                        </div>
                        {!isArchived && (
                          <CardDescription className="text-[11px] mt-0.5">
                            Location: {group.location} • Status: 
                            <span className={cn("ml-1 font-bold", group.status === "Open" ? "text-emerald-600" : "text-muted-foreground")}>
                              {group.status}
                            </span>
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {group.candidates.length} {group.candidates.length === 1 ? "Candidate" : "Candidates"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {/* Mini Kanban stages grid for this job */}
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
                        {PIPELINE_STAGES.map(stage => {
                          const stageCandidates = group.candidates.filter(c => c.stage === stage)
                          return (
                            <div key={stage} className="rounded-xl border border-border/40 bg-muted/10 p-2.5 min-w-[150px] flex flex-col space-y-2">
                              <div className="flex items-center justify-between border-b border-border/20 pb-1.5 mb-1">
                                <span className="text-[10px] font-bold text-foreground/75 uppercase tracking-wider">{stage}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.25 rounded bg-muted text-muted-foreground">
                                  {stageCandidates.length}
                                </span>
                              </div>

                              <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px]">
                                {stageCandidates.length === 0 ? (
                                  <div className="text-center py-5 text-[9px] text-muted-foreground/60 italic">
                                    Empty
                                  </div>
                                ) : (
                                  stageCandidates.map(cand => (
                                    <div key={cand.id} className="p-2.5 rounded-lg border border-border bg-card shadow-xs relative group hover:border-primary/50 transition-colors">
                                      <button
                                        type="button"
                                        className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => deleteCandidate(cand.id)}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                      <p className="text-[11px] font-bold truncate pr-3 text-foreground">{cand.name}</p>
                                      <p className="text-[9px] text-muted-foreground truncate">{cand.email}</p>

                                      {cand.stage === "Offer" && (
                                        <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
                                          {cand.offerLetterGenerated ? (
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="inline-flex items-center text-[8px] font-bold text-emerald-600 bg-emerald-500/10 px-1 py-0.5 rounded">
                                                📄 Offer Sent
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/recruitment/print-offer/${cand.id}`)}
                                                className="h-5 w-5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-500/5 cursor-pointer shrink-0"
                                                title="Print Offer Letter"
                                              >
                                                <Printer className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              className="w-full text-[9px] h-6 justify-center gap-1 text-primary cursor-pointer hover:bg-primary/5"
                                              onClick={() => handleGenerateOfferLetter(cand)}
                                            >
                                              📄 Make Offer
                                            </Button>
                                          )}
                                        </div>
                                      )}

                                      {cand.stage === "Hired" && (
                                        <div className="mt-1.5 pt-1.5 border-t border-border/40 space-y-1">
                                          {cand.joiningLetterGenerated ? (
                                            <div className="flex items-center justify-between gap-1">
                                              <span className="inline-flex items-center text-[8px] font-bold text-indigo-600 bg-indigo-500/10 px-1 py-0.5 rounded">
                                                ✉️ Joined
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => navigate(`/recruitment/print/${cand.id}`)}
                                                className="h-5 w-5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-500/5 cursor-pointer shrink-0"
                                                title="Print Joining Letter"
                                              >
                                                <Printer className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              className="w-full text-[9px] h-6 justify-center gap-1 text-primary cursor-pointer hover:bg-primary/5"
                                              onClick={() => handleGenerateJoiningLetter(cand)}
                                            >
                                              ✉️ Make Join Letter
                                            </Button>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-border/30">
                                        <span className="text-[8px] font-medium text-muted-foreground/85 px-1 bg-muted/60 rounded">
                                          {cand.source}
                                        </span>
                                        {stage !== "Hired" && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextIndex = PIPELINE_STAGES.indexOf(stage) + 1
                                              if (nextIndex < PIPELINE_STAGES.length) {
                                                promoteCandidate(cand.id, PIPELINE_STAGES[nextIndex])
                                              }
                                            }}
                                            className="text-[9px] text-primary font-semibold flex items-center gap-0.5 hover:underline"
                                          >
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
                    </CardContent>
                  </Card>
                )
              })}

              {pipelineGroups.length === 0 && (
                <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-muted/5">
                  <p className="text-sm text-muted-foreground">No candidates match the selected filter.</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPipelinePages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + PIPELINE_PER_PAGE, pipelineGroups.length)} of {pipelineGroups.length} jobs
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPipelinePage(prev => Math.max(prev - 1, 1))}
                      disabled={pipelinePage === 1}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPipelinePage(prev => Math.min(prev + 1, totalPipelinePages))}
                      disabled={pipelinePage === totalPipelinePages}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}
      {/* ONBOARDING TAB */}
      {activeTab === "onboarding" && (() => {
        // Collect onboarding groups
        const onboardingGroups = [
          ...jobs.filter(job => {
            const jobHires = onboardingHires.filter(h => h.role === job.title)
            if (jobHires.length === 0) return false
            return onboardingJobFilter === "all" || job.title === onboardingJobFilter
          }).map(job => ({
            type: "active",
            id: job.id,
            title: job.title,
            department: job.department,
            hires: onboardingHires.filter(h => h.role === job.title),
          })),
          ...(() => {
            const activeJobTitles = jobs.map(j => j.title)
            const otherHires = onboardingHires.filter(h => !activeJobTitles.includes(h.role))
            const otherRoles = Array.from(new Set(otherHires.map(h => h.role)))
            return otherRoles
              .filter(role => onboardingJobFilter === "all" || role === onboardingJobFilter)
              .map(roleName => ({
                type: "archived",
                id: roleName,
                title: roleName,
                department: "N/A",
                hires: otherHires.filter(h => h.role === roleName),
              }))
          })()
        ]

        const totalOnboardingPages = Math.ceil(onboardingGroups.length / ONBOARDING_PER_PAGE)
        const startIndex = (onboardingPage - 1) * ONBOARDING_PER_PAGE
        const paginatedOnboardingGroups = onboardingGroups.slice(startIndex, startIndex + ONBOARDING_PER_PAGE)

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold">Job-by-Job Onboarding Tracking</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitor onboarding task completion lists for new hires, grouped by job role.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">Filter by Job:</span>
                <Select value={onboardingJobFilter} onValueChange={setOnboardingJobFilter}>
                  <SelectTrigger className="w-[200px] h-8 text-xs">
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map(j => (
                      <SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>
                    ))}
                    {(() => {
                      const activeTitles = jobs.map(j => j.title)
                      const otherRoles = Array.from(
                        new Set(onboardingHires.filter(h => !activeTitles.includes(h.role)).map(h => h.role))
                      )
                      return otherRoles.map(role => (
                        <SelectItem key={role} value={role}>{role} (Archived)</SelectItem>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-8">
              {paginatedOnboardingGroups.map(group => {
                const isArchived = group.type === "archived"
                return (
                  <div key={group.id} className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-border/20 pb-2">
                      <h4 className="text-sm font-bold text-foreground">{group.title}</h4>
                      <span className={cn("text-[10px] text-muted-foreground font-semibold px-2 py-0.5 rounded bg-muted", isArchived && "bg-muted/80 italic")}>
                        {isArchived ? "Archived / Unlisted Role" : group.department}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-semibold ml-auto">
                        {group.hires.length} {group.hires.length === 1 ? "New Hire" : "New Hires"}
                      </Badge>
                    </div>

                    <div className="grid gap-5">
                      {group.hires.map(hire => {
                        const completedTasksCount = hire.tasks.filter(t => t.completed).length
                        const progressPct = Math.round((completedTasksCount / hire.tasks.length) * 100)

                        return (
                          <Card key={hire.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 bg-muted/10">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-base">{hire.name}</h3>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                                    New Hire
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {hire.role} • {hire.department}
                                </p>
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
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        progressPct === 100 ? "bg-emerald-500" : "bg-primary"
                                      )}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold tabular-nums min-w-[32px] text-right">
                                    {progressPct}%
                                  </span>
                                </div>

                                {(() => {
                                  const hireCandidate = candidates.find(c => c.id === hire.candidateId)
                                  if (!hireCandidate) return null
                                  return (
                                    <div className="text-xs shrink-0 flex items-center gap-1.5">
                                      {hireCandidate.joiningLetterGenerated ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 font-bold text-indigo-600 bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                                            ✉️ Joining Letter Sent
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigate(`/recruitment/print/${hireCandidate.id}`)}
                                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-500/5 cursor-pointer"
                                            title="Print Joining Letter"
                                          >
                                            <Printer className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleGenerateJoiningLetter(hireCandidate)}
                                          className="h-8 text-xs font-semibold cursor-pointer"
                                        >
                                          ✉️ Make Joining Letter
                                        </Button>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                            </div>

                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/30">
                                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-semibold text-foreground/80">Onboarding Checklist Tasks</span>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {hire.tasks.map(task => (
                                  <div
                                    key={task.id}
                                    onClick={() => toggleOnboardingTask(hire.id, task.id)}
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none",
                                      task.completed
                                        ? "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                                        : "border-border/60 hover:border-primary/20 hover:bg-muted/20"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "h-4.5 w-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                        task.completed
                                          ? "border-emerald-500 bg-emerald-500 text-white"
                                          : "border-border bg-background"
                                      )}
                                    >
                                      {task.completed && <CheckCircle className="h-3.5 w-3.5 fill-current" />}
                                    </div>
                                    <span className={cn(
                                      "text-xs font-medium transition-all",
                                      task.completed ? "line-through text-muted-foreground" : "text-foreground"
                                    )}>
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
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
                  <p className="text-sm text-muted-foreground">No new hires match the selected filter.</p>
                </div>
              )}

              {/* Pagination Controls */}
              {totalOnboardingPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                  <span className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + ONBOARDING_PER_PAGE, onboardingGroups.length)} of {onboardingGroups.length} jobs
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOnboardingPage(prev => Math.max(prev - 1, 1))}
                      disabled={onboardingPage === 1}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOnboardingPage(prev => Math.min(prev + 1, totalOnboardingPages))}
                      disabled={onboardingPage === totalOnboardingPages}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* MODALS */}
      {/* 1. Add Job Modal */}
      <Dialog open={isJobModalOpen} onOpenChange={setIsJobModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingJob ? "Edit Job Requisition" : "Open Job Requisition"}</DialogTitle>
            <DialogDescription>
              {editingJob ? "Update the details for this job posting." : "Create a new job posting for recruitment pipeline."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Job Title *</Label>
              <Input
                placeholder="e.g. Senior Frontend Engineer"
                value={newJob.title}
                onChange={e => setNewJob({ ...newJob, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department</Label>
                <Select
                  value={newJob.department}
                  onValueChange={v => setNewJob({ ...newJob, department: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Employment Type</Label>
                <Select
                  value={newJob.type}
                  onValueChange={v => setNewJob({ ...newJob, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location *</Label>
                <Input
                  placeholder="e.g. Dhaka, BD"
                  value={newJob.location}
                  onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Experience Needed *</Label>
                <Input
                  placeholder="e.g. 3-5 years"
                  value={newJob.experience}
                  onChange={e => setNewJob({ ...newJob, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                placeholder="Job requirements..."
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>

            {editingJob && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select
                    value={newJob.status}
                    onValueChange={v => setNewJob({ ...newJob, status: v as "Open" | "Closed" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Applicants Count</Label>
                  <Input
                    type="number"
                    min="0"
                    value={newJob.applicants}
                    onChange={e => setNewJob({ ...newJob, applicants: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsJobModalOpen(false)}>Cancel</Button>
              <Button type="submit">Open Requisition</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Candidate Modal */}
      <Dialog open={isCandidateModalOpen} onOpenChange={setIsCandidateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Candidate Record</DialogTitle>
            <DialogDescription>Enter a candidate into the recruitment workflow pipeline.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Candidate Name *</Label>
              <Input
                placeholder="John Doe"
                value={newCandidate.name}
                onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email *</Label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={newCandidate.email}
                onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Applied Role *</Label>
                <Select
                  value={newCandidate.role}
                  onValueChange={v => setNewCandidate({ ...newCandidate, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select active role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map(j => (
                      <SelectItem key={j.id} value={j.title}>{j.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Lead Source</Label>
                <Select
                  value={newCandidate.source}
                  onValueChange={v => setNewCandidate({ ...newCandidate, source: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Job Board">Job Board</SelectItem>
                    <SelectItem value="Careers Site">Careers Site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Initial Stage</Label>
              <Select
                value={newCandidate.stage}
                onValueChange={v => setNewCandidate({ ...newCandidate, stage: v as Candidate["stage"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCandidateModalOpen(false)}>Cancel</Button>
              <Button type="submit">Add Candidate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
