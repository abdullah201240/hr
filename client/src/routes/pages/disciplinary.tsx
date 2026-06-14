import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Scale,
  Plus,
  Search,
  Send,
  CheckCircle2,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { z } from "zod"

export interface DisciplinaryCase {
  id: string
  employeeName: string
  employeeEmail: string
  offenseType: string
  dateReported: string
  status: "Under Investigation" | "Show Cause Issued" | "Explanation Received" | "Inquiry Hearing" | "Action Taken"
  showCauseNotice: string
  employeeExplanation: string
  finalAction: string
}

const defaultCases: DisciplinaryCase[] = [
  {
    id: "DSC-001",
    employeeName: "Marcus Brown",
    employeeEmail: "marcus.brown@sadoshima.com",
    offenseType: "Attendance policy violation",
    dateReported: "2026-06-05",
    status: "Action Taken",
    showCauseNotice: "Please explain the repeated unexcused absences in May 2026.",
    employeeExplanation: "I experienced emergency medical concerns in my family.",
    finalAction: "Issued First Written Warning.",
  },
  {
    id: "DSC-002",
    employeeName: "Sara Chen",
    employeeEmail: "sara.chen@sadoshima.com",
    offenseType: "Information Security Breach",
    dateReported: "2026-06-12",
    status: "Show Cause Issued",
    showCauseNotice: "Accessing sensitive customer records outside working shifts without authorization.",
    employeeExplanation: "",
    finalAction: "",
  },
  {
    id: "DSC-003",
    employeeName: "David Kim",
    employeeEmail: "david.kim@sadoshima.com",
    offenseType: "Insubordination",
    dateReported: "2026-06-14",
    status: "Explanation Received",
    showCauseNotice: "Repeated refusal to carry out assigned tasks by reporting manager.",
    employeeExplanation: "I felt that the timeline was unfeasible and requested adjustments which were ignored.",
    finalAction: "",
  },
]

const disciplinaryCaseSchema = z.object({
  employeeName: z.string().min(1, "Employee name is required"),
  employeeEmail: z.string().email("Invalid email address"),
  offenseType: z.string().min(1, "Offense type is required"),
  showCauseNotice: z.string().optional(),
})

export default function DisciplinaryPage() {
  const [cases, setCases] = useState<DisciplinaryCase[]>(() => {
    const saved = localStorage.getItem("hr_disciplinary")
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return defaultCases
  })

  useEffect(() => {
    localStorage.setItem("hr_disciplinary", JSON.stringify(cases))
  }, [cases])

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentCase, setCurrentCase] = useState<DisciplinaryCase | null>(null)

  // Form States
  const [newEmpName, setNewEmpName] = useState("")
  const [newEmpEmail, setNewEmpEmail] = useState("")
  const [newOffense, setNewOffense] = useState("Attendance Violation")
  const [newShowCause, setNewShowCause] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Case resolution states
  const [tempExplanation, setTempExplanation] = useState("")
  const [tempFinalAction, setTempFinalAction] = useState("")
  const [tempStatus, setTempStatus] = useState<DisciplinaryCase["status"]>("Under Investigation")

  const handleCreate = () => {
    setErrors({})
    const result = disciplinaryCaseSchema.safeParse({
      employeeName: newEmpName,
      employeeEmail: newEmpEmail,
      offenseType: newOffense,
      showCauseNotice: newShowCause,
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

    const newRecord: DisciplinaryCase = {
      id: "DSC-" + Math.floor(100 + Math.random() * 900),
      employeeName: newEmpName.trim(),
      employeeEmail: newEmpEmail.trim(),
      offenseType: newOffense,
      dateReported: new Date().toISOString().split("T")[0],
      status: newShowCause.trim() ? "Show Cause Issued" : "Under Investigation",
      showCauseNotice: newShowCause.trim(),
      employeeExplanation: "",
      finalAction: "",
    }
    setCases([newRecord, ...cases])
    setIsCreateOpen(false)
    setNewEmpName("")
    setNewEmpEmail("")
    setNewShowCause("")
  }

  const handleOpenDetail = (c: DisciplinaryCase) => {
    setCurrentCase(c)
    setTempExplanation(c.employeeExplanation)
    setTempFinalAction(c.finalAction)
    setTempStatus(c.status)
    setIsDetailOpen(true)
  }

  const handleSaveResolution = () => {
    if (!currentCase) return
    setCases(prev =>
      prev.map(c =>
        c.id === currentCase.id
          ? {
              ...c,
              employeeExplanation: tempExplanation,
              finalAction: tempFinalAction,
              status: tempStatus,
            }
          : c
      )
    )
    setIsDetailOpen(false)
  }

  const filtered = cases.filter(c => {
    const matchesSearch =
      c.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      c.employeeEmail.toLowerCase().includes(search.toLowerCase()) ||
      c.offenseType.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Disciplinary Management
          </h2>
          <p className="text-muted-foreground">Manage show cause notices, employee explanations, and disciplinary hearings</p>
        </div>
        <Button className="gap-2 text-xs font-semibold" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Disciplinary Case
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Investigation</p>
              <p className="text-2xl font-bold mt-1">
                {cases.filter(c => c.status === "Under Investigation").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Search className="h-4 w-4 text-sky-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Show Cause Issued</p>
              <p className="text-2xl font-bold mt-1">
                {cases.filter(c => c.status === "Show Cause Issued").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Explanation Received</p>
              <p className="text-2xl font-bold mt-1">
                {cases.filter(c => c.status === "Explanation Received").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-violet-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Action Decided</p>
              <p className="text-2xl font-bold mt-1">
                {cases.filter(c => c.status === "Action Taken").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases by employee or offense..."
              className="pl-9 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Cases" },
              { id: "Under Investigation", label: "Investigation" },
              { id: "Show Cause Issued", label: "Show Cause" },
              { id: "Explanation Received", label: "Explanations" },
              { id: "Action Taken", label: "Resolved" },
            ].map(f => (
              <Button
                key={f.id}
                variant={statusFilter === f.id ? "default" : "outline"}
                size="sm"
                className="text-xs h-9 shrink-0 font-medium"
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table view */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Offense Type</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Date Reported</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(c => (
                    <TableRow key={c.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{c.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground">{c.employeeEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {c.offenseType}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {c.dateReported}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn("text-[9px] font-bold border-none",
                          c.status === "Action Taken" && "bg-emerald-500/10 text-emerald-600",
                          c.status === "Explanation Received" && "bg-violet-500/10 text-violet-600",
                          c.status === "Show Cause Issued" && "bg-amber-500/10 text-amber-600",
                          c.status === "Under Investigation" && "bg-sky-500/10 text-sky-600"
                        )}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-medium"
                          onClick={() => handleOpenDetail(c)}
                        >
                          Manage Case
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Scale className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No disciplinary cases logged</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Case Creation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(val) => {
        setIsCreateOpen(val)
        if (!val) {
          setNewEmpName("")
          setNewEmpEmail("")
          setNewShowCause("")
          setErrors({})
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Log Disciplinary Case</DialogTitle>
            <DialogDescription className="text-xs">Create a case record and draft a show cause notice if required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-emp-name" className="text-xs font-semibold">Employee Name</Label>
              <Input id="c-emp-name" placeholder="e.g. Sara Chen" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="text-xs" />
              {errors.employeeName && <p className="text-[10px] text-red-500">{errors.employeeName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-emp-email" className="text-xs font-semibold">Employee Email</Label>
              <Input id="c-emp-email" type="email" placeholder="e.g. sara.chen@sadoshima.com" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} className="text-xs" />
              {errors.employeeEmail && <p className="text-[10px] text-red-500">{errors.employeeEmail}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offense-type" className="text-xs font-semibold">Offense Type</Label>
              <Select value={newOffense} onValueChange={setNewOffense}>
                <SelectTrigger id="offense-type" className="text-xs h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Attendance Violation" className="text-xs">Attendance & Punctuality Policy Violation</SelectItem>
                  <SelectItem value="Security Policy Violation" className="text-xs">Information Security Breach</SelectItem>
                  <SelectItem value="Insubordination" className="text-xs">Insubordination / Conduct Violation</SelectItem>
                  <SelectItem value="Performance Issue" className="text-xs">Unsatisfactory Performance Standards</SelectItem>
                </SelectContent>
              </Select>
              {errors.offenseType && <p className="text-[10px] text-red-500">{errors.offenseType}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="show-cause-draft" className="text-xs font-semibold">Show Cause Notice (Draft)</Label>
              <Textarea id="show-cause-draft" placeholder="Draft show cause statement or leave blank to investigate first..." value={newShowCause} onChange={e => setNewShowCause(e.target.value)} className="text-xs min-h-[90px] resize-none" />
              {errors.showCauseNotice && <p className="text-[10px] text-red-500">{errors.showCauseNotice}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleCreate} className="text-xs">Log Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case Details & Workflow Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {currentCase && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Manage Disciplinary Workflow — {currentCase.id}</DialogTitle>
                <DialogDescription className="text-xs">Track Show Cause issuance, record responses, and apply final actions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Employee:</span><span className="font-semibold">{currentCase.employeeName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Offense Type:</span><span className="font-semibold">{currentCase.offenseType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date Logged:</span><span className="font-semibold">{currentCase.dateReported}</span></div>
                </div>

                {/* Show Cause Details */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Show Cause Statement</Label>
                  <div className="p-2.5 rounded-lg border border-border/40 bg-muted/10 text-xs text-muted-foreground min-h-[50px] whitespace-pre-wrap">
                    {currentCase.showCauseNotice || "No Show Cause notice issued yet."}
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="case-status" className="text-xs font-semibold">Current Case Status</Label>
                  <Select value={tempStatus} onValueChange={(v: any) => setTempStatus(v)}>
                    <SelectTrigger id="case-status" className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under Investigation" className="text-xs">Under Investigation</SelectItem>
                      <SelectItem value="Show Cause Issued" className="text-xs">Show Cause Notice Issued</SelectItem>
                      <SelectItem value="Explanation Received" className="text-xs">Explanation Received</SelectItem>
                      <SelectItem value="Inquiry Hearing" className="text-xs">Inquiry Hearing Scheduled</SelectItem>
                      <SelectItem value="Action Taken" className="text-xs">Case Resolved / Action Taken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Explanation Entry */}
                <div className="space-y-1.5">
                  <Label htmlFor="explanation" className="text-xs font-semibold">Employee Explanation / Response</Label>
                  <Textarea
                    id="explanation"
                    placeholder="Enter the employee's formal response statement..."
                    value={tempExplanation}
                    onChange={e => setTempExplanation(e.target.value)}
                    className="text-xs min-h-[80px] resize-none"
                  />
                </div>

                {/* Resolution / Final Action */}
                <div className="space-y-1.5">
                  <Label htmlFor="final-action" className="text-xs font-semibold">Resolution / Action Taken</Label>
                  <Textarea
                    id="final-action"
                    placeholder="e.g. Warning letter issued, Suspension, Case closed with no action..."
                    value={tempFinalAction}
                    onChange={e => setTempFinalAction(e.target.value)}
                    className="text-xs min-h-[60px] resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleSaveResolution} className="text-xs">Save Updates</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
