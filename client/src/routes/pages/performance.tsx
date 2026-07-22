import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Target,
  Plus,
  AlertTriangle,
  Loader2,
  Calendar,
  Award,
  Building,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Trophy,
  Briefcase,
  Printer
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { z } from "zod"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useDesignationOptionsQuery } from "@/hooks/useDesignations"
import {
  useAppraisalCyclesQuery,
  useCreateCycleMutation,
  useUpdateCycleStatusMutation,
  useCycleAppraisalsQuery,
  useEmployeeAppraisalQuery,
  useSubmitSelfAppraisalMutation,
  useSubmitManagerAppraisalMutation,
  useCreateKpiMutation,
  useDeleteKpiMutation,
} from "@/hooks/usePerformance"
import { useAuthStore } from "@/store/useAuthStore"

const cycleSchema = z.object({
  name: z.string().min(3, "Cycle Name must be at least 3 characters"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  description: z.string().optional(),
})

const kpiSchema = z.object({
  title: z.string().min(1, "KPI Title is required"),
  description: z.string().min(1, "Objective Description is required"),
  targetMetric: z.string().min(1, "Target Success Metric is required"),
  weight: z.number({ message: "Weight must be a number" })
    .min(5, "Weight must be at least 5%")
    .max(100, "Weight cannot exceed 100%"),
})

export default function PerformancePage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("center")
  const [selectedCycleId, setSelectedCycleId] = useState("")
  const [selectedEmpId, setSelectedEmpId] = useState("")
  const [mobileDetailView, setMobileDetailView] = useState(false)

  // Permission-based access (replaces old role simulation)
  const hasPerformanceViewAll = user?.permissions?.includes("performance:view_all") || false
  const hasPerformanceUpdate = user?.permissions?.includes("performance:update") || false
  const hasPerformanceCreate = user?.permissions?.includes("performance:create") || false
  const canManagePerformance = hasPerformanceViewAll || hasPerformanceUpdate || hasPerformanceCreate

  // Modals state
  const [isAddCycleOpen, setIsAddCycleOpen] = useState(false)
  const [isAddKpiOpen, setIsAddKpiOpen] = useState(false)

  // Cycle creation fields
  const [newCycleName, setNewCycleName] = useState("")
  const [newCycleStart, setNewCycleStart] = useState("")
  const [newCycleEnd, setNewCycleEnd] = useState("")
  const [newCycleDesc, setNewCycleDesc] = useState("")
  const [cycleErrors, setCycleErrors] = useState<{ [key: string]: string }>({})

  // KPI creation fields
  const [newKpiTitle, setNewKpiTitle] = useState("")
  const [newKpiDesc, setNewKpiDesc] = useState("")
  const [newKpiMetric, setNewKpiMetric] = useState("")
  const [newKpiWeight, setNewKpiWeight] = useState(25)
  const [kpiErrors, setKpiErrors] = useState<{ [key: string]: string }>({})

  // Live score inputs for appraisals
  const [liveSelfScores, setLiveSelfScores] = useState<{ [kpiId: string]: number }>({})
  const [liveSelfComments, setLiveSelfComments] = useState<{ [kpiId: string]: string }>({})
  const [liveManagerScores, setLiveManagerScores] = useState<{ [kpiId: string]: number }>({})
  const [liveManagerComments, setLiveManagerComments] = useState<{ [kpiId: string]: string }>({})
  const [liveSelfFeedback, setLiveSelfFeedback] = useState("")
  const [liveManagerFeedback, setLiveManagerFeedback] = useState("")

  // Promotion fields for manager evaluation
  const [promoRecommended, setPromoRecommended] = useState(false)
  const [promoReadiness, setPromoReadiness] = useState<"ready_now" | "ready_1_2_years" | "not_eligible">("not_eligible")
  const [promoDesignationId, setPromoDesignationId] = useState("")
  const [promoNotes, setPromoNotes] = useState("")

  // API Queries
  const { data: cycles = [], isLoading: isCyclesLoading } = useAppraisalCyclesQuery()
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery({ limit: 100, status: "Active" })
  const employees = employeesResponse?.data || []
  const { data: designations = [] } = useDesignationOptionsQuery()

  // Initialize selected cycle ID
  useEffect(() => {
    if (cycles.length > 0 && !selectedCycleId) {
      const activeCycle = cycles.find(c => c.status === "active") || cycles[0]
      setSelectedCycleId(activeCycle.id)
    }
  }, [cycles, selectedCycleId])

  // Initialize selected employee ID
  useEffect(() => {
    const activeEmployees = employees
    if (activeEmployees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(activeEmployees[0].id)
    }
  }, [employees, selectedEmpId])

  // Query appraisals for current cycle (for ledger)
  const { data: ledgerItems = [] } = useCycleAppraisalsQuery(selectedCycleId)

  // Query appraisal details for selected employee + cycle
  const { data: appraisalContext, isLoading: isContextLoading } = useEmployeeAppraisalQuery(selectedEmpId, selectedCycleId)
  const appraisal = appraisalContext?.appraisal
  const kpis = appraisalContext?.kpis || []

  // Mutations
  const createCycleMutation = useCreateCycleMutation()
  const updateCycleStatusMutation = useUpdateCycleStatusMutation()
  const createKpiMutation = useCreateKpiMutation(selectedCycleId)
  const deleteKpiMutation = useDeleteKpiMutation(selectedEmpId, selectedCycleId)
  const submitSelfMutation = useSubmitSelfAppraisalMutation()
  const submitManagerMutation = useSubmitManagerAppraisalMutation()

  // Synced local inputs when appraisal context changes
  useEffect(() => {
    if (appraisalContext) {
      const selfScores: { [id: string]: number } = {}
      const selfComments: { [id: string]: string } = {}
      const managerScores: { [id: string]: number } = {}
      const managerComments: { [id: string]: string } = {}

      kpis.forEach(k => {
        selfScores[k.id] = k.selfScore !== null && k.selfScore !== undefined ? k.selfScore : 80
        selfComments[k.id] = k.comments || ""
        managerScores[k.id] = k.managerScore !== null && k.managerScore !== undefined ? k.managerScore : 80
        managerComments[k.id] = k.comments || ""
      })

      setLiveSelfScores(selfScores)
      setLiveSelfComments(selfComments)
      setLiveManagerScores(managerScores)
      setLiveManagerComments(managerComments)

      setLiveSelfFeedback(appraisal?.selfFeedback || "")
      setLiveManagerFeedback(appraisal?.managerFeedback || "")
      setPromoRecommended(appraisal?.promotionRecommended || false)
      setPromoReadiness(appraisal?.promotionReadiness || "not_eligible")
      setPromoDesignationId(appraisal?.recommendedDesignationId || "")
      setPromoNotes(appraisal?.managerNotes || "")
    }
  }, [appraisalContext])

  const selectedCycle = cycles.find(c => c.id === selectedCycleId)
  const currentEmp = employees.find((e: any) => e.id === selectedEmpId)

  // Calculate tenure
  const getTenureMonths = (joinDateStr?: string) => {
    if (!joinDateStr) return 0
    const joinDate = new Date(joinDateStr)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - joinDate.getTime())
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375))
    return diffMonths
  }

  const tenureMonths = getTenureMonths(currentEmp?.joinDate)

  // Compute live scores dynamically
  const totalKpiWeight = kpis.reduce((sum, k) => sum + k.weight, 0)

  const liveSelfScore = Math.round(
    kpis.reduce((sum, k) => {
      const scoreVal = liveSelfScores[k.id] ?? 80
      return sum + (scoreVal * (k.weight / 100))
    }, 0)
  )

  const liveManagerScore = Math.round(
    kpis.reduce((sum, k) => {
      const scoreVal = liveManagerScores[k.id] ?? 80
      return sum + (scoreVal * (k.weight / 100))
    }, 0)
  )

  // Auto-calculated Recommendation Flag
  const isSystemRecommended = liveManagerScore >= 80 && tenureMonths >= 12

  const getRatingBand = (score: number) => {
    if (score >= 90) return { label: "Outstanding", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
    if (score >= 80) return { label: "Exceeds Expectations", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" }
    if (score >= 70) return { label: "Meets Expectations", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
    return { label: "Needs Improvement", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" }
  }

  // Handle Cycle Create
  const handleCreateCycle = () => {
    setCycleErrors({})
    const result = cycleSchema.safeParse({
      name: newCycleName,
      startDate: newCycleStart,
      endDate: newCycleEnd,
      description: newCycleDesc,
    })

    if (!result.success) {
      const errorsMap: { [key: string]: string } = {}
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          errorsMap[err.path[0].toString()] = err.message
        }
      })
      setCycleErrors(errorsMap)
      return
    }

    createCycleMutation.mutate(
      {
        name: newCycleName.trim(),
        startDate: newCycleStart,
        endDate: newCycleEnd,
        description: newCycleDesc.trim(),
      },
      {
        onSuccess: (data) => {
          setIsAddCycleOpen(false)
          setSelectedCycleId(data.id)
          setNewCycleName("")
          setNewCycleStart("")
          setNewCycleEnd("")
          setNewCycleDesc("")
          Swal.fire("Success", "Performance appraisal cycle established.", "success")
        }
      }
    )
  }

  // Handle Toggle Cycle Status
  const handleToggleCycleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "draft" ? "active" : currentStatus === "active" ? "completed" : "active"
    Swal.fire({
      title: `Set Cycle to ${nextStatus.toUpperCase()}?`,
      text: `Are you sure you want to transition this appraisal cycle status?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
    }).then((res) => {
      if (res.isConfirmed) {
        updateCycleStatusMutation.mutate({ id, status: nextStatus })
      }
    })
  }

  // Handle Add KPI Target
  const handleAddKpi = () => {
    setKpiErrors({})
    const result = kpiSchema.safeParse({
      title: newKpiTitle,
      description: newKpiDesc,
      targetMetric: newKpiMetric,
      weight: newKpiWeight,
    })

    if (!result.success) {
      const errorsMap: { [key: string]: string } = {}
      result.error.issues.forEach(err => {
        if (err.path[0]) {
          errorsMap[err.path[0].toString()] = err.message
        }
      })
      setKpiErrors(errorsMap)
      return
    }

    createKpiMutation.mutate(
      {
        employeeId: selectedEmpId,
        cycleId: selectedCycleId,
        title: newKpiTitle.trim(),
        description: newKpiDesc.trim(),
        targetMetric: newKpiMetric.trim(),
        weight: newKpiWeight,
      },
      {
        onSuccess: () => {
          setIsAddKpiOpen(false)
          setNewKpiTitle("")
          setNewKpiDesc("")
          setNewKpiMetric("")
          setNewKpiWeight(25)
          Swal.fire("Created", "KPI target registered for this cycle.", "success")
        }
      }
    )
  }

  // Handle Delete KPI
  const handleDeleteKpi = (kpiId: string) => {
    Swal.fire({
      title: "Remove KPI Target?",
      text: "Remove this metric definition from the current appraisal cycle?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
    }).then(res => {
      if (res.isConfirmed) {
        deleteKpiMutation.mutate(kpiId)
      }
    })
  }

  // Handle Submit Self Appraisal
  const handleSubmitSelf = () => {
    if (!appraisal) return
    const scoresPayload = Object.entries(liveSelfScores).map(([kpiId, score]) => ({
      kpiId,
      selfScore: score,
      comments: liveSelfComments[kpiId] || "",
    }))

    submitSelfMutation.mutate(
      {
        appraisalId: appraisal.id,
        employeeId: selectedEmpId,
        cycleId: selectedCycleId,
        scores: scoresPayload,
        selfFeedback: liveSelfFeedback,
      },
      {
        onSuccess: () => {
          Swal.fire("Self Assessment Saved", "Your self-appraisal ratings have been recorded.", "success")
        }
      }
    )
  }

  // Handle Submit Manager Evaluation
  const handleSubmitManager = () => {
    if (!appraisal) return
    const scoresPayload = Object.entries(liveManagerScores).map(([kpiId, score]) => ({
      kpiId,
      managerScore: score,
      comments: liveManagerComments[kpiId] || "",
    }))

    submitManagerMutation.mutate(
      {
        appraisalId: appraisal.id,
        employeeId: selectedEmpId,
        cycleId: selectedCycleId,
        scores: scoresPayload,
        managerFeedback: liveManagerFeedback,
        promotionRecommended: promoRecommended,
        promotionReadiness: promoReadiness,
        recommendedDesignationId: promoDesignationId || undefined,
        managerNotes: promoNotes,
      },
      {
        onSuccess: () => {
          Swal.fire("Assessment Finalized", "Manager appraisal and promotion recommendation registered.", "success")
        }
      }
    )
  }

  // Printable format trigger
  const handlePrintLedger = () => {
    window.print()
  }

  // Calculate Appraisal Summary Metrics for active cycle
  const completedAppraisalsCount = ledgerItems.filter(item => item.appraisal?.status === "completed").length
  const totalRosterCount = ledgerItems.length
  const completionPercentage = totalRosterCount > 0 ? Math.round((completedAppraisalsCount / totalRosterCount) * 100) : 0

  if (isCyclesLoading || isEmployeesLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Initializing Performance Framework...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Top Banner (Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500 animate-pulse" />
            <h2 className="text-2xl font-bold tracking-tight">World-Class Enterprise Appraisal Engine</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure SMART metrics, compare multi-source evaluations (Self vs Manager), and trigger automated promotion recommendations.
          </p>
        </div>

        {/* Global Cycle Selection & Simulator controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {cycles.length > 0 && (
            <div className="flex items-center gap-2 bg-muted/20 border border-border/40 px-3 py-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedCycleId}
                onChange={e => {
                  setSelectedCycleId(e.target.value)
                  // reset employee selection
                  const activeEmployees = employees
                  if (activeEmployees.length > 0) {
                    setSelectedEmpId(activeEmployees[0].id)
                  }
                }}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role simulation removed - access controlled by permissions */}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3 shadow-none border border-border/40 bg-muted/20 print:hidden">
          <TabsTrigger value="center" className="text-xs">Appraisal Center</TabsTrigger>
          <TabsTrigger value="ledger" className="text-xs">Promotion Ledger</TabsTrigger>
          <TabsTrigger value="cycles" className="text-xs">Cycle Config</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: APPRAISAL CENTER --- */}
        <TabsContent value="center" className="outline-none">
          {cycles.length === 0 ? (
            <Card className="text-center p-12 border-dashed">
              <CardContent className="space-y-4">
                <Target className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <h3 className="font-semibold text-lg">No Appraisal Cycles Active</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Appraisals require cycles (e.g. Annual, Mid-Year) to establish timeline structures and KPI benchmarks.
                </p>
                <Button onClick={() => setIsAddCycleOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Create First Cycle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Employee roster list */}
              <div className={cn("lg:col-span-1 space-y-4 print:hidden", mobileDetailView ? "hidden lg:block" : "block")}>
                <Card className="shadow-none border-border/40">
                  <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evaluations</CardTitle>
                      <CardDescription className="text-[10px]">Select member below</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                      {completionPercentage}% Done
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
                    {ledgerItems.map(item => {
                      const isSelected = selectedEmpId === item.employee.id
                      const status = item.appraisal?.status || "pending_self"
                      let badgeColor = "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      let statusText = "Self Evaluation"
                      if (status === "pending_manager") {
                        badgeColor = "bg-sky-500/10 text-sky-600 border-sky-500/20"
                        statusText = "Manager Eval"
                      } else if (status === "completed") {
                        badgeColor = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        statusText = "Signed Off"
                      }

                      return (
                        <button
                          key={item.employee.id}
                          onClick={() => {
                            setSelectedEmpId(item.employee.id)
                            setMobileDetailView(true)
                          }}
                          className={cn(
                            "w-full text-left p-3 rounded-lg text-xs transition-all flex items-center justify-between group",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-muted/50 text-foreground"
                          )}
                        >
                          <div className="truncate pr-2">
                            <p className="truncate font-semibold">{item.employee.fullNameEnglish}</p>
                            <p className={cn("text-[10px] mt-0.5 truncate", isSelected ? "text-primary-foreground/75" : "text-muted-foreground")}>
                              {item.employee.designationName}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn("text-[9px] shrink-0 font-bold", isSelected ? "bg-primary-foreground/10 text-primary-foreground border-transparent" : badgeColor)}>
                            {statusText}
                          </Badge>
                        </button>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Main evaluation screen */}
              <div className={cn("lg:col-span-3 space-y-6", mobileDetailView ? "block" : "hidden lg:block")}>
                {/* Back button for mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileDetailView(false)}
                  className="lg:hidden gap-1.5 mb-2 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to List
                </Button>

                {isContextLoading ? (
                  <Card className="p-12 text-center text-muted-foreground shadow-none border-border/40">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-xs">Retrieving appraisal metrics...</p>
                  </Card>
                ) : !currentEmp ? (
                  <Card className="p-12 text-center text-muted-foreground shadow-none border-border/40">
                    <p className="text-xs">No employee selected.</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Employee Profile and Live Status Card */}
                    <Card className="shadow-none border-border/40 relative overflow-hidden bg-gradient-to-r from-muted/5 to-muted/20">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                      <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-foreground">{currentEmp.fullNameEnglish}</h3>
                            <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-primary/5 border-primary/20 text-primary">
                              {currentEmp.departmentName || "Engineering"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-semibold py-0.5">
                              Level/Grade: {(currentEmp as any).grade || "L2"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:flex md:items-center md:gap-x-6 gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5" />
                              <span>{currentEmp.designationName || "Software Engineer"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Tenure: <strong className="text-foreground">{tenureMonths} Months</strong> ({currentEmp.joinDate})</span>
                            </div>
                            {tenureMonths >= 12 ? (
                              <Badge className="w-fit text-[9px] bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 font-bold">
                                Tenure Eligible (&gt;12m)
                              </Badge>
                            ) : (
                              <Badge className="w-fit text-[9px] bg-muted text-muted-foreground font-semibold">
                                Sub-12 Months
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Top Score Summaries */}
                        <div className="flex items-center gap-4 bg-background/50 border border-border/40 p-3 rounded-xl backdrop-blur-sm self-start md:self-auto shadow-sm">
                          <div className="text-center pr-4 border-r border-border/20">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Self Weighted</p>
                            <p className="text-xl font-black text-sky-600 mt-0.5">{totalKpiWeight > 0 ? `${liveSelfScore}%` : "—"}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Manager Final</p>
                            <p className="text-xl font-black text-emerald-600 mt-0.5">{totalKpiWeight > 0 ? `${liveManagerScore}%` : "—"}</p>
                            {totalKpiWeight > 0 && (
                              <Badge className={cn("text-[8px] font-bold border-none mt-1 block scale-95", getRatingBand(liveManagerScore).color)}>
                                {getRatingBand(liveManagerScore).label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Weight mismatch warning */}
                    {totalKpiWeight !== 100 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-600 font-semibold animate-pulse">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Weight Sum is {totalKpiWeight}% (Must equal exactly 100% to save evaluation).</span>
                        {(hasPerformanceViewAll || hasPerformanceUpdate) && selectedCycle?.status !== "completed" && (
                          <Button variant="outline" size="xs" onClick={() => setIsAddKpiOpen(true)} className="ml-auto text-[10px] bg-background border-amber-500/30 hover:bg-amber-500/5 text-amber-700 font-bold px-2 py-0.5 h-auto">
                            Fix Target weights
                          </Button>
                        )}
                      </div>
                    )}

                    {/* KPI Evaluation list */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-primary" /> Key Performance Indicators
                        </h4>
                        {(hasPerformanceViewAll || hasPerformanceUpdate) && selectedCycle?.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsAddKpiOpen(true)}
                            className="text-xs h-8 border-border/40 gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Cycle KPI
                          </Button>
                        )}
                      </div>

                      {kpis.length === 0 ? (
                        <Card className="p-8 text-center text-muted-foreground shadow-none border-border/40">
                          <p className="text-xs font-semibold">No targets established for this cycle.</p>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {kpis.map(kpi => {
                            const selfScore = liveSelfScores[kpi.id] ?? 80
                            const selfComment = liveSelfComments[kpi.id] || ""
                            const managerScore = liveManagerScores[kpi.id] ?? 80
                            const managerComment = liveManagerComments[kpi.id] || ""

                            const isSelfEditable =
                              !hasPerformanceViewAll && !hasPerformanceUpdate &&
                              appraisal?.status === "pending_self" &&
                              selectedCycle?.status === "active"

                            const isManagerEditable =
                              (hasPerformanceViewAll || hasPerformanceUpdate) &&
                              appraisal?.status === "pending_manager" &&
                              selectedCycle?.status === "active"

                            return (
                              <Card key={kpi.id} className="shadow-none border-border/40 hover:border-border/80 transition-colors">
                                <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-xs text-foreground">{kpi.title}</h5>
                                      <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 bg-muted/60 border border-border/30">
                                        Weight: {kpi.weight}%
                                      </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{kpi.description}</p>
                                  </div>
                                  {(hasPerformanceViewAll || hasPerformanceUpdate) && selectedCycle?.status !== "completed" && (
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 px-2 py-0.5 h-6 text-[10px]"
                                      onClick={() => handleDeleteKpi(kpi.id)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                  {/* Success Criteria */}
                                  <div className="text-[10px] text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-lg w-full flex items-center gap-1.5 font-medium border border-border/20">
                                    <span className="font-bold text-foreground">Success Target:</span>
                                    <span>{kpi.targetMetric}</span>
                                  </div>

                                  {/* Double Rating Slider/Inputs */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {/* SELF RATING CARD */}
                                    <div className={cn("p-3 rounded-xl border border-border/30 bg-muted/5 space-y-3", isSelfEditable ? "ring-1 ring-primary/20 bg-primary/[0.01]" : "opacity-85")}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
                                          👤 Self Evaluation
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <Label className="text-[10px] text-muted-foreground">Self Score:</Label>
                                          {isSelfEditable ? (
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={selfScore}
                                              onChange={e => setLiveSelfScores({ ...liveSelfScores, [kpi.id]: Math.min(100, Math.max(0, Number(e.target.value))) })}
                                              className="w-12 h-6 text-[11px] text-center font-bold px-1"
                                            />
                                          ) : (
                                            <strong className="text-xs text-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/20">
                                              {kpi.selfScore ?? "—"}
                                            </strong>
                                          )}
                                        </div>
                                      </div>

                                      {isSelfEditable && (
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={selfScore}
                                          onChange={e => setLiveSelfScores({ ...liveSelfScores, [kpi.id]: Number(e.target.value) })}
                                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-sky-600"
                                        />
                                      )}

                                      {isSelfEditable ? (
                                        <Textarea
                                          placeholder="Enter self-reflection metrics, achievements, or context..."
                                          value={selfComment}
                                          onChange={e => setLiveSelfComments({ ...liveSelfComments, [kpi.id]: e.target.value })}
                                          className="text-[11px] min-h-[60px] max-h-[80px]"
                                        />
                                      ) : (
                                        <p className="text-[11px] text-muted-foreground italic bg-muted/10 p-2 rounded-lg leading-relaxed border border-border/10">
                                          {kpi.comments && appraisal?.status !== "pending_self" ? kpi.comments : "No comment submitted."}
                                        </p>
                                      )}
                                    </div>

                                    {/* MANAGER RATING CARD */}
                                    <div className={cn("p-3 rounded-xl border border-border/30 bg-muted/5 space-y-3", isManagerEditable ? "ring-1 ring-primary/20 bg-primary/[0.01]" : "opacity-85")}>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                                          💼 Manager Assessment
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <Label className="text-[10px] text-muted-foreground">Manager Score:</Label>
                                          {isManagerEditable ? (
                                            <Input
                                              type="number"
                                              min={0}
                                              max={100}
                                              value={managerScore}
                                              onChange={e => setLiveManagerScores({ ...liveManagerScores, [kpi.id]: Math.min(100, Math.max(0, Number(e.target.value))) })}
                                              className="w-12 h-6 text-[11px] text-center font-bold px-1"
                                            />
                                          ) : (
                                            <strong className="text-xs text-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/20">
                                              {kpi.managerScore ?? "—"}
                                            </strong>
                                          )}
                                        </div>
                                      </div>

                                      {isManagerEditable && (
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={managerScore}
                                          onChange={e => setLiveManagerScores({ ...liveManagerScores, [kpi.id]: Number(e.target.value) })}
                                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                        />
                                      )}

                                      {isManagerEditable ? (
                                        <Textarea
                                          placeholder="Evaluate metrics, highlight strengths, or point out gaps..."
                                          value={managerComment}
                                          onChange={e => setLiveManagerComments({ ...liveManagerComments, [kpi.id]: e.target.value })}
                                          className="text-[11px] min-h-[60px] max-h-[80px]"
                                        />
                                      ) : (
                                        <p className="text-[11px] text-muted-foreground italic bg-muted/10 p-2 rounded-lg leading-relaxed border border-border/10">
                                          {appraisal?.status === "completed" ? (kpi.comments || "No comments.") : "Manager appraisal pending."}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Overall feedback & recommendation form */}
                    {appraisal && (
                      <div className="space-y-6">
                        {/* EMPLOYEE WORKSPACE: Self Comments submission */}
                        {appraisal.status === "pending_self" && (
                          <Card className="shadow-none border-border/40">
                            <CardHeader>
                              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Self-Appraisal Statement</CardTitle>
                              <CardDescription className="text-xs">Provide a summary statement of your key accomplishments this cycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {canManagePerformance ? (
                                <>
                                  <Textarea
                                    placeholder="Summarize your performance, core learnings, training milestones, and promotion self-assessment..."
                                    value={liveSelfFeedback}
                                    onChange={e => setLiveSelfFeedback(e.target.value)}
                                    className="text-xs min-h-[100px]"
                                  />
                                  <Button
                                    disabled={submitSelfMutation.isPending || totalKpiWeight !== 100}
                                    onClick={handleSubmitSelf}
                                    className="w-full bg-primary hover:bg-primary/95 text-xs font-semibold"
                                  >
                                    {submitSelfMutation.isPending ? "Submitting..." : "Submit Self Assessment (Unlock Manager Review)"}
                                  </Button>
                                </>
                              ) : (
                                <div className="p-4 bg-muted/20 border border-border/30 rounded-xl text-xs text-muted-foreground text-center">
                                  To fill and submit this assessment, toggle <strong>Employee role simulation</strong> at the top right of this screen.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* MANAGER EVALUATION AND PROMOTION DECISION PANEL */}
                        {appraisal.status === "pending_manager" && (
                          <Card className="shadow-none border-border/40 border-l-4 border-l-emerald-600">
                            <CardHeader>
                              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                                <Sparkles className="h-4 w-4" /> Manager appraisal & Promotion Decision Panel
                              </CardTitle>
                              <CardDescription className="text-xs">Agreed score finalization, qualitative feedback, and promotion recommendation stamps.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {hasPerformanceViewAll || hasPerformanceUpdate ? (
                                <div className="space-y-4">
                                  {/* Promotion Recommendation fields */}
                                  <div className="p-4 rounded-xl border border-border/40 bg-muted/5 space-y-4">
                                    <h5 className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                                      <Briefcase className="h-4 w-4 text-primary" /> Promotion Eligibility and Readiness
                                    </h5>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* System Flag */}
                                      <div className="p-3.5 rounded-lg border border-border/20 bg-background flex flex-col justify-center space-y-2">
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Automated Eligibility Match</span>
                                        {isSystemRecommended ? (
                                          <div className="flex items-center gap-2 text-yellow-600 font-extrabold text-xs">
                                            <Trophy className="h-4.5 w-4.5 animate-bounce" />
                                            <span>👑 SYSTEM HIGHLY RECOMMENDED</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-xs">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Does not meet automated thresholds (Score &gt;= 80 & Tenure &gt;= 12m)</span>
                                          </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">Thresholds require at least 12 months tenure and a Manager final score of 80% or higher.</p>
                                      </div>

                                      {/* Promotion Option checkbox */}
                                      <div className="flex flex-col justify-center space-y-2">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            id="promoCheck"
                                            checked={promoRecommended}
                                            onChange={e => setPromoRecommended(e.target.checked)}
                                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-2"
                                          />
                                          <Label htmlFor="promoCheck" className="text-xs font-bold cursor-pointer">Recommending for Promotion?</Label>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Select if you want to officially recommend this employee for a grade/title upgrade.</p>
                                      </div>
                                    </div>

                                    {promoRecommended && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1.5">
                                          <Label className="text-[11px] font-semibold">Promotion Readiness</Label>
                                          <Select
                                            value={promoReadiness}
                                            onValueChange={(val: any) => setPromoReadiness(val)}
                                          >
                                            <SelectTrigger className="text-xs h-9">
                                              <SelectValue placeholder="Readiness Stage" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="ready_now" className="text-xs">Ready Now (Promote in current cycle)</SelectItem>
                                              <SelectItem value="ready_1_2_years" className="text-xs">Ready in 1-2 Years (Build career path)</SelectItem>
                                              <SelectItem value="not_eligible" className="text-xs">Needs More Experience / Not Eligible</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                          <Label className="text-[11px] font-semibold">Target Designation (Promotion Title)</Label>
                                          <Select
                                            value={promoDesignationId}
                                            onValueChange={setPromoDesignationId}
                                          >
                                            <SelectTrigger className="text-xs h-9">
                                              <SelectValue placeholder="Select target role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {designations.map(d => (
                                                <SelectItem key={d.id} value={d.id} className="text-xs">
                                                  {d.name} ({d.code})
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    )}

                                    <div className="space-y-1.5">
                                      <Label className="text-[11px] font-semibold">Manager Justification / Promotion Notes</Label>
                                      <Textarea
                                        placeholder="Outline detailed metrics, qualitative performance feedback, leadership capabilities, and reasoning for this promotion decision..."
                                        value={promoNotes}
                                        onChange={e => setPromoNotes(e.target.value)}
                                        className="text-xs min-h-[80px]"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <Label className="text-[11px] font-semibold">Overall Manager Feedback Statement</Label>
                                    <Textarea
                                      placeholder="Provide cycles performance summary feedback, growth goals, and target expectations for the next cycle..."
                                      value={liveManagerFeedback}
                                      onChange={e => setLiveManagerFeedback(e.target.value)}
                                      className="text-xs min-h-[90px]"
                                    />
                                  </div>

                                  <Button
                                    disabled={submitManagerMutation.isPending || totalKpiWeight !== 100}
                                    onClick={handleSubmitManager}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                  >
                                    {submitManagerMutation.isPending ? "Processing..." : "Finalize & Sign Off Appraisal Review"}
                                  </Button>
                                </div>
                              ) : (
                                <div className="p-4 bg-muted/20 border border-border/30 rounded-xl text-xs text-muted-foreground text-center">
                                  To perform Manager Assessment, toggle <strong>Manager/HR role simulation</strong> at the top right of this screen.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* COMPLETED SIGNED OFF AUDIT CARD */}
                        {appraisal.status === "completed" && (
                          <Card className="shadow-none border-border/40 border-l-4 border-l-emerald-500 bg-emerald-500/[0.01]">
                            <CardHeader className="pb-3 border-b border-border/10 flex flex-row items-center justify-between">
                              <div>
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-4 w-4" /> Signed Off Appraisal Record
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  This appraisal has been completed and signed off. All ratings are locked.
                                </CardDescription>
                              </div>
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[9px] uppercase px-2 py-0.5">
                                Completed
                              </Badge>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/10 border border-border/20 rounded-xl space-y-2">
                                  <h6 className="font-bold text-[10px] text-sky-600 uppercase tracking-wide">Self Assessment Summary</h6>
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                    {appraisal.selfFeedback || "No summary provided."}
                                  </p>
                                </div>
                                <div className="p-3 bg-muted/10 border border-border/20 rounded-xl space-y-2">
                                  <h6 className="font-bold text-[10px] text-emerald-600 uppercase tracking-wide">Manager Final Assessment</h6>
                                  <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                    {appraisal.managerFeedback || "No summary provided."}
                                  </p>
                                </div>
                              </div>

                              {/* Promotion recommendation decision result */}
                              <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-3">
                                <h5 className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                                  <Award className="h-4.5 w-4.5 text-yellow-500" /> Executive Promotion Decision Recommendation
                                </h5>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div className="bg-background border border-border/20 p-2.5 rounded-lg flex flex-col justify-center">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Manager Decision</span>
                                    <span className="font-extrabold text-[11px] mt-1 text-foreground">
                                      {appraisal.promotionRecommended ? (
                                        <Badge className="bg-yellow-500/10 text-yellow-600 border-none font-bold text-[10px] py-0.5 h-auto">
                                          Recommended for promotion
                                        </Badge>
                                      ) : "Not Recommended"}
                                    </span>
                                  </div>
                                  <div className="bg-background border border-border/20 p-2.5 rounded-lg flex flex-col justify-center">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Readiness Level</span>
                                    <span className="font-bold text-[11px] mt-1 text-foreground">
                                      {appraisal.promotionReadiness === "ready_now" ? "Ready Now (Direct Upgrade)" :
                                       appraisal.promotionReadiness === "ready_1_2_years" ? "Ready in 1-2 Years" :
                                       "Retain/Not Eligible"}
                                    </span>
                                  </div>
                                  <div className="bg-background border border-border/20 p-2.5 rounded-lg flex flex-col justify-center">
                                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Target Title</span>
                                    <span className="font-bold text-[11px] mt-1 text-foreground">
                                      {appraisal.recommendedDesignationId
                                        ? (designations.find(d => d.id === appraisal.recommendedDesignationId)?.name || "New Role Title")
                                        : "—"}
                                    </span>
                                  </div>
                                </div>

                                {appraisal.managerNotes && (
                                  <div className="pt-2 text-[11px] border-t border-border/10">
                                    <p className="font-bold text-foreground">Justification Notes:</p>
                                    <p className="text-muted-foreground italic mt-1 leading-relaxed bg-background/50 p-2.5 rounded-lg border border-border/20">
                                      {appraisal.managerNotes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- TAB 2: PROMOTION & CAREER BOARD LEDGER --- */}
        <TabsContent value="ledger" className="space-y-6 outline-none">
          <Card className="shadow-none border-border/40 print:border-none print:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/20 print:border-none">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Award className="h-5 w-5 text-yellow-500" /> Promotion recommendation Decision Board
                </CardTitle>
                <CardDescription className="text-xs">
                  Automated promotion analysis compared with managers assessments and career readiness tracks.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 border-border/40 print:hidden"
                onClick={handlePrintLedger}
              >
                <Printer className="h-3.5 w-3.5" /> Print / Export Board
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Detail</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Tenure (Months)</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Appraisal Status</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Scores (Self/Mgr)</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">System Recommendation</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Manager decision</TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Career readiness</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                        No employees loaded for this cycle.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledgerItems.map(item => {
                      const appraisalObj = item.appraisal
                      const tenureM = getTenureMonths(item.employee.joinDate)
                      const isSystemElig = appraisalObj?.finalScore !== null && appraisalObj?.finalScore !== undefined
                        ? (appraisalObj.finalScore >= 80 && tenureM >= 12)
                        : false

                      const statusStr = appraisalObj?.status || "pending_self"
                      const selfS = appraisalObj?.selfScore !== null && appraisalObj?.selfScore !== undefined ? `${appraisalObj.selfScore}%` : "—"
                      const mgrS = appraisalObj?.managerScore !== null && appraisalObj?.managerScore !== undefined ? `${appraisalObj.managerScore}%` : "—"

                      return (
                        <TableRow key={item.employee.id} className="border-b border-border/20 hover:bg-muted/5 transition-colors">
                          <TableCell className="py-3">
                            <p className="text-xs font-bold text-foreground">{item.employee.fullNameEnglish}</p>
                            <p className="text-[10px] text-muted-foreground">{item.employee.designationName} • Grade {item.employee.grade || "L2"}</p>
                          </TableCell>
                          <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                            <span className={cn("font-medium", tenureM >= 12 ? "text-yellow-600 font-semibold" : "text-muted-foreground")}>{tenureM} months</span>
                          </TableCell>
                          <TableCell className="py-3">
                            {statusStr === "pending_self" && (
                              <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">
                                Self Assessment
                              </Badge>
                            )}
                            {statusStr === "pending_manager" && (
                              <Badge variant="outline" className="text-[9px] font-bold bg-sky-500/10 text-sky-600 border-sky-500/20">
                                Manager Eval
                              </Badge>
                            )}
                            {statusStr === "completed" && (
                              <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Signed Off
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-bold text-foreground">
                            {selfS} / {mgrS}
                          </TableCell>
                          <TableCell className="py-3">
                            {isSystemElig ? (
                              <Badge className="text-[9px] font-extrabold bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                                👑 HIGHLY RECOMMENDED
                              </Badge>
                            ) : statusStr === "completed" ? (
                              <span className="text-[10px] text-muted-foreground font-medium">Under criteria thresholds</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Evaluation incomplete</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {appraisalObj?.promotionRecommended ? (
                              <div className="space-y-0.5">
                                <Badge className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                  Promote Approved
                                </Badge>
                                <p className="text-[9px] text-muted-foreground font-medium truncate max-w-[120px]">
                                  To: {item.recommendedDesignation?.name || "Next grade"}
                                </p>
                              </div>
                            ) : statusStr === "completed" ? (
                              <span className="text-[10px] text-muted-foreground font-medium">Keep in Role</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Pending</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                            {appraisalObj?.promotionReadiness === "ready_now" ? "Ready Now (Direct Upgrade)" :
                             appraisalObj?.promotionReadiness === "ready_1_2_years" ? "Ready 1-2 years" :
                             statusStr === "completed" ? "Retain in Current Role" : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: CYCLE TIMELINE & SETUP --- */}
        <TabsContent value="cycles" className="space-y-6 outline-none">
          <div className="flex items-center justify-between print:hidden">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Performance Cycles</h3>
              <p className="text-xs text-muted-foreground">Admin appraisal setup, active cycle toggling, and review history logs.</p>
            </div>
            {(hasPerformanceUpdate || hasPerformanceViewAll) && (
              <Button size="sm" onClick={() => setIsAddCycleOpen(true)} className="gap-1.5 text-xs bg-primary">
                <Plus className="h-4 w-4" /> Create Appraisal Cycle
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cycles.map(c => {
              const isActive = c.status === "active"
              const isClosed = c.status === "completed"

              return (
                <Card key={c.id} className={cn("shadow-none border-border/40 relative overflow-hidden", isActive && "border-primary/50 ring-1 ring-primary/10")}>
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                      Active review cycle
                    </div>
                  )}
                  <CardHeader className="pb-3 border-b border-border/10">
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
                      {c.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Timeline: <strong>{c.startDate}</strong> to <strong>{c.endDate}</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 text-xs">
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {c.description || "No description provided for this evaluation timeframe."}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/10">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Status:</span>
                        <Badge variant="secondary" className={cn("text-[9px] uppercase font-bold px-2 py-0.5",
                          isActive ? "bg-emerald-500/10 text-emerald-600 border-none" :
                          isClosed ? "bg-muted text-muted-foreground border-none" :
                          "bg-amber-500/10 text-amber-600 border-none"
                        )}>
                          {c.status}
                        </Badge>
                      </div>

                      {(hasPerformanceUpdate || hasPerformanceViewAll) && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleToggleCycleStatus(c.id, c.status)}
                          className="text-[10px] font-semibold h-7 border-border/30 hover:bg-muted"
                        >
                          {c.status === "draft" ? "Activate Cycle" : c.status === "active" ? "Complete Cycle" : "Re-open Cycle"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* --- DIALOG 1: CREATE APPRAISAL CYCLE --- */}
      <Dialog open={isAddCycleOpen} onOpenChange={setIsAddCycleOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-1.5"><Calendar className="h-5 w-5 text-primary" /> Create appraisal cycle</DialogTitle>
            <DialogDescription className="text-xs">Establish the timeline and objective context for a new company appraisal window.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Cycle Name</Label>
              <Input
                placeholder="e.g. 2026 Mid-Year Appraisal Cycle"
                value={newCycleName}
                onChange={e => setNewCycleName(e.target.value)}
                className="text-xs"
              />
              {cycleErrors.name && <p className="text-[10px] text-red-500">{cycleErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={newCycleStart}
                  onChange={e => setNewCycleStart(e.target.value)}
                  className="text-xs"
                />
                {cycleErrors.startDate && <p className="text-[10px] text-red-500">{cycleErrors.startDate}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={newCycleEnd}
                  onChange={e => setNewCycleEnd(e.target.value)}
                  className="text-xs"
                />
                {cycleErrors.endDate && <p className="text-[10px] text-red-500">{cycleErrors.endDate}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                placeholder="Summarize guidelines, review stages, and scope specifications for this assessment cycle..."
                value={newCycleDesc}
                onChange={e => setNewCycleDesc(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddCycleOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleCreateCycle} disabled={createCycleMutation.isPending} className="text-xs">
              {createCycleMutation.isPending ? "Creating..." : "Establish Cycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG 2: ADD KPI TARGET FOR SELECTED EMPLOYEE --- */}
      <Dialog open={isAddKpiOpen} onOpenChange={setIsAddKpiOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-1.5"><Target className="h-5 w-5 text-primary" /> Add performance target</DialogTitle>
            <DialogDescription className="text-xs">Add a key performance target specific to this cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">KPI Title</Label>
              <Input
                placeholder="e.g. Pull Request Turnaround Speed"
                value={newKpiTitle}
                onChange={e => setNewKpiTitle(e.target.value)}
                className="text-xs"
              />
              {kpiErrors.title && <p className="text-[10px] text-red-500">{kpiErrors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Objective Description</Label>
              <Textarea
                placeholder="Outline exact expectations, key deliverables, and context..."
                value={newKpiDesc}
                onChange={e => setNewKpiDesc(e.target.value)}
                className="text-xs min-h-[60px]"
              />
              {kpiErrors.description && <p className="text-[10px] text-red-500">{kpiErrors.description}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Success metric description</Label>
                <Input
                  placeholder="e.g. Average audit delay < 4h"
                  value={newKpiMetric}
                  onChange={e => setNewKpiMetric(e.target.value)}
                  className="text-xs"
                />
                {kpiErrors.targetMetric && <p className="text-[10px] text-red-500">{kpiErrors.targetMetric}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Weight (%)</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={newKpiWeight}
                  onChange={e => setNewKpiWeight(Number(e.target.value))}
                  className="text-xs"
                />
                {kpiErrors.weight && <p className="text-[10px] text-red-500">{kpiErrors.weight}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddKpiOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleAddKpi} disabled={createKpiMutation.isPending} className="text-xs">
              {createKpiMutation.isPending ? "Creating..." : "Save Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
