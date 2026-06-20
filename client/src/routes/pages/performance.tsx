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
  Target,
  Plus,
  Percent,
  Calculator,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { z } from "zod"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import {
  useAllKpisQuery,
  useEmployeeKpisQuery,
  useCreateKpiMutation,
  useDeleteKpiMutation,
  useSaveKpiScoresMutation,
  type KPI,
} from "@/hooks/usePerformance"

const kpiSchema = z.object({
  title: z.string().min(1, "KPI Title is required"),
  description: z.string().min(1, "Objective Description is required"),
  targetMetric: z.string().min(1, "Target Success Metric is required"),
  weight: z.number({ message: "Weight must be a number" })
    .min(5, "Weight must be at least 5%")
    .max(100, "Weight cannot exceed 100%"),
})

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("setup")
  const [selectedEmpId, setSelectedEmpId] = useState("")

  // Modals state
  const [isAddKpiOpen, setIsAddKpiOpen] = useState(false)
  const [isScoreOpen, setIsScoreOpen] = useState(false)
  const [scoringEmpId, setScoringEmpId] = useState("")
  
  // Temporary score editor states
  const [tempScores, setTempScores] = useState<{ [kpiId: string]: number }>({})

  // Form states for new KPI
  const [newKpiTitle, setNewKpiTitle] = useState("")
  const [newKpiDesc, setNewKpiDesc] = useState("")
  const [newKpiMetric, setNewKpiMetric] = useState("")
  const [newKpiWeight, setNewKpiWeight] = useState(25)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch active employees
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery({ limit: 100, status: "Active" })
  const employees = employeesResponse?.data || []

  // Fetch KPIs for all employees (for rating matrix ledger)
  const { data: allKPIs = {}, isLoading: isAllKpisLoading } = useAllKpisQuery()

  // Fetch KPIs for the selected employee (for setup tab)
  const { data: currentKPIs = [], isLoading: isCurrentKpisLoading } = useEmployeeKpisQuery(selectedEmpId)

  // Mutations
  const createKpiMutation = useCreateKpiMutation()
  const deleteKpiMutation = useDeleteKpiMutation(selectedEmpId)
  const saveScoresMutation = useSaveKpiScoresMutation()

  // Auto-select first employee
  useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id)
    }
  }, [employees, selectedEmpId])

  const currentEmp = employees.find(e => e.id === selectedEmpId)
  const totalKpiWeight = currentKPIs.reduce((sum, k) => sum + k.weight, 0)

  // Handle Add KPI
  const handleAddKpi = () => {
    setErrors({})
    const result = kpiSchema.safeParse({
      title: newKpiTitle,
      description: newKpiDesc,
      targetMetric: newKpiMetric,
      weight: newKpiWeight,
    })

    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {}
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    createKpiMutation.mutate(
      {
        employeeId: selectedEmpId,
        title: newKpiTitle.trim(),
        description: newKpiDesc.trim(),
        targetMetric: newKpiMetric.trim(),
        weight: newKpiWeight,
      },
      {
        onSuccess: () => {
          setNewKpiTitle("")
          setNewKpiDesc("")
          setNewKpiMetric("")
          setNewKpiWeight(25)
          setErrors({})
          setIsAddKpiOpen(false)

          Swal.fire({
            title: "KPI Created!",
            text: "New performance indicator successfully added for this employee.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md"
            }
          })
        }
      }
    )
  }

  // Handle Delete KPI
  const handleDeleteKpi = (kpiId: string) => {
    Swal.fire({
      title: "Delete KPI?",
      text: "Are you sure you want to remove this Performance Indicator?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then(result => {
      if (result.isConfirmed) {
        deleteKpiMutation.mutate(kpiId)
      }
    })
  }

  // Calculations for scores & ratings
  const calculateTotalScore = (kpis: KPI[]) => {
    if (!kpis || kpis.length === 0) return 0
    const totalWeighted = kpis.reduce((sum, k) => {
      const scoreVal = k.score !== undefined && k.score !== null ? k.score : 80
      return sum + (scoreVal * (k.weight / 100))
    }, 0)
    return Math.round(totalWeighted)
  }

  const getPerformanceRating = (score: number) => {
    if (score >= 90) return { label: "Outstanding", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" }
    if (score >= 80) return { label: "Exceeds Expectations", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" }
    if (score >= 70) return { label: "Meets Expectations", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" }
    return { label: "Needs Improvement", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" }
  }

  // Initialize scoring modal
  const openScoringDialog = (empId: string) => {
    const kpis = allKPIs[empId] || []
    const scoresMap: { [kpiId: string]: number } = {}
    kpis.forEach(k => {
      scoresMap[k.id] = k.score !== undefined && k.score !== null ? k.score : 80
    })
    setTempScores(scoresMap)
    setScoringEmpId(empId)
    setIsScoreOpen(true)
  }

  // Save Scored actual metrics
  const handleSaveScores = () => {
    saveScoresMutation.mutate(
      {
        employeeId: scoringEmpId,
        scores: Object.entries(tempScores).map(([kpiId, score]) => ({ kpiId, score })),
      },
      {
        onSuccess: () => {
          setIsScoreOpen(false)
          Swal.fire({
            title: "Evaluation Processed!",
            text: "Dynamic score metrics recorded and rating grades updated successfully.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground px-4 py-2 font-semibold rounded-md"
            }
          })
        }
      }
    )
  }

  const targetEmpForScoring = employees.find(e => e.id === scoringEmpId)

  if (isEmployeesLoading || isAllKpisLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading performance structures...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            KPI & Performance Management
          </h2>
          <p className="text-muted-foreground">Setup annual target metrics, record reviews, and calculate performance rating matrices</p>
        </div>
      </div>

      {/* Stats explanation panel */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Outstanding Band</p>
          <p className="text-xl font-bold mt-1 text-emerald-600">90% - 100%</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Exceeds highest benchmark targets</span>
        </div>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Exceeds Expectations</p>
          <p className="text-xl font-bold mt-1 text-sky-600">80% - 89%</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Delivers above standard metrics</span>
        </div>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Meets Expectations</p>
          <p className="text-xl font-bold mt-1 text-amber-600">70% - 79%</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Fulfills standard corporate targets</span>
        </div>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Needs Improvement</p>
          <p className="text-xl font-bold mt-1 text-rose-600">&lt; 70%</p>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Target improvement program required</span>
        </div>
      </div>

      {/* Tab Selector */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="setup" className="text-xs">KPI Target Setup</TabsTrigger>
          <TabsTrigger value="ratings" className="text-xs">Automated Rating Matrix</TabsTrigger>
        </TabsList>

        {/* TAB 1: KPI TARGET SETUP */}
        <TabsContent value="setup" className="outline-none">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Employee roster selection */}
            <Card className="shadow-none border-border/40 md:col-span-1">
              <CardHeader className="pb-3 border-b border-border/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Employee</CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {employees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmpId(emp.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between group",
                      selectedEmpId === emp.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className="truncate">
                      <p className="truncate font-medium">{emp.fullNameEnglish}</p>
                      <p className={cn("text-[10px] truncate mt-0.5", selectedEmpId === emp.id ? "text-primary-foreground/75" : "text-muted-foreground")}>{emp.designationName || "Staff"}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* KPI list details */}
            <div className="md:col-span-3 space-y-4">
              {currentEmp && (
                <Card className="shadow-none border-border/40">
                  <CardHeader className="flex flex-row items-start justify-between pb-4 border-b border-border/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold">Annual Target KPIs — {currentEmp.fullNameEnglish}</CardTitle>
                        <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-primary/5 border-primary/20 text-primary">
                          {currentEmp.departmentName || "General"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">Configure SMART target descriptors. Ensure weights sum to 100%.</CardDescription>
                    </div>
                    <Button size="sm" className="gap-1.5 text-xs bg-primary hover:bg-primary/95" onClick={() => setIsAddKpiOpen(true)}>
                      <Plus className="h-4 w-4" />
                      Add KPI Target
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Weight warning alert */}
                    {totalKpiWeight !== 100 && !isCurrentKpisLoading && (
                      <div className="m-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-xs text-amber-600 font-semibold animate-pulse">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Weight Sum Allocation is at {totalKpiWeight}% (Must equal exactly 100% to calculate final rating scores).</span>
                      </div>
                    )}

                    {isCurrentKpisLoading ? (
                      <div className="p-12 text-center text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-xs">Loading KPI details...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/20">
                        {currentKPIs.length > 0 ? (
                          currentKPIs.map(kpi => (
                            <div key={kpi.id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4">
                              <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-xs text-foreground">{kpi.title}</h4>
                                  <Badge variant="secondary" className="text-[10px] font-bold px-2 flex items-center gap-0.5 bg-muted/50 border border-border/30">
                                    <Percent className="h-3 w-3 text-muted-foreground" />
                                    <span>{kpi.weight}% Weight</span>
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground max-w-2xl leading-relaxed">{kpi.description}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-md w-fit font-medium">
                                  <span className="font-bold text-foreground">Target Metric:</span>
                                  <span>{kpi.targetMetric}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground font-semibold rounded-md self-end sm:self-start"
                                onClick={() => handleDeleteKpi(kpi.id)}
                                disabled={deleteKpiMutation.isPending}
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center text-muted-foreground">
                            <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No KPIs configured for this employee</p>
                            <p className="text-xs">Click the Add Target button to establish new objectives.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: AUTOMATED RATING MATRIX */}
        <TabsContent value="ratings" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Automated Evaluation Ledger</CardTitle>
              <CardDescription className="text-xs">
                Score assigned targets to calculate real-time weighted score performance metrics.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Name</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Department / Role</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">KPI Setup Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Overall score</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Performance Grade</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-24">Evaluate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => {
                    const kpis = allKPIs[emp.id] || []
                    const weightTotal = kpis.reduce((sum, k) => sum + k.weight, 0)
                    const weightedScore = calculateTotalScore(kpis)
                    const rating = getPerformanceRating(weightedScore)

                    return (
                      <TableRow key={emp.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <p className="text-xs font-semibold text-foreground">{emp.fullNameEnglish}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                          {emp.departmentName || "—"} · {emp.designationName || "—"}
                        </TableCell>
                        <TableCell className="py-3">
                          {weightTotal === 100 ? (
                            <Badge variant="outline" className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Validated (100%)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">
                              Setup mismatch ({weightTotal}%)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-foreground">
                          {weightTotal > 0 ? `${weightedScore}%` : "—"}
                        </TableCell>
                        <TableCell className="py-3">
                          {weightTotal > 0 ? (
                            <Badge className={cn("text-[9px] font-bold border-none", rating.color)}>
                              {rating.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground font-medium">No active KPIs</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={weightTotal === 0}
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-md"
                            onClick={() => openScoringDialog(emp.id)}
                          >
                            <Calculator className="h-3.5 w-3.5" />
                            Score KPIs
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Add KPI Modal */}
      <Dialog open={isAddKpiOpen} onOpenChange={(val) => {
        setIsAddKpiOpen(val)
        if (!val) {
          setNewKpiTitle("")
          setNewKpiDesc("")
          setNewKpiMetric("")
          setNewKpiWeight(25)
          setErrors({})
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Performance Objective</DialogTitle>
            <DialogDescription className="text-xs">Create a new key performance indicator and map weight settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">KPI Title</Label>
              <Input
                placeholder="e.g. Code Review Predictability"
                value={newKpiTitle}
                onChange={e => setNewKpiTitle(e.target.value)}
                className="text-xs"
              />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Objective Description</Label>
              <Textarea
                placeholder="Detailed explanation of the target roadmap goals..."
                value={newKpiDesc}
                onChange={e => setNewKpiDesc(e.target.value)}
                className="text-xs min-h-[70px]"
              />
              {errors.description && <p className="text-[10px] text-red-500">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Target Success Metric</Label>
                <Input
                  placeholder="e.g. Maintain SLA > 90%"
                  value={newKpiMetric}
                  onChange={e => setNewKpiMetric(e.target.value)}
                  className="text-xs"
                />
                  {errors.targetMetric && <p className="text-[10px] text-red-500">{errors.targetMetric}</p>}
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
                {errors.weight && <p className="text-[10px] text-red-500">{errors.weight}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddKpiOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleAddKpi} disabled={createKpiMutation.isPending} className="text-xs">
              {createKpiMutation.isPending ? "Creating..." : "Create Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Score KPIs Dialog */}
      <Dialog open={isScoreOpen} onOpenChange={setIsScoreOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {targetEmpForScoring && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Perform Assessment — {targetEmpForScoring.fullNameEnglish}</DialogTitle>
                <DialogDescription className="text-xs">Record actual target achievement scores on a scale of 0 to 100.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2 text-xs divide-y divide-border/20 max-h-[350px] overflow-y-auto pr-1">
                {(allKPIs[scoringEmpId] || []).map(kpi => (
                  <div key={kpi.id} className="pt-3 space-y-2 first:pt-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{kpi.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Target: {kpi.targetMetric} ({kpi.weight}% weight)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Label className="text-[10px] text-muted-foreground">Achievement Score:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={tempScores[kpi.id] !== undefined ? tempScores[kpi.id] : 80}
                          onChange={e => setTempScores({ ...tempScores, [kpi.id]: Number(e.target.value) })}
                          className="w-16 h-8 text-xs text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsScoreOpen(false)} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleSaveScores} disabled={saveScoresMutation.isPending} className="text-xs">
                  {saveScoresMutation.isPending ? "Saving..." : "Save Scores"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

