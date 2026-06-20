import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
  UserMinus,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Laptop,
  CreditCard,
  Key,
  ShieldAlert,
  Loader2,
  DollarSign,
  Receipt,
  TrendingUp,
  Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSeparationRecordsQuery,
  useCreateSeparationMutation,
  useUpdateSeparationMutation,
} from "@/hooks/useSeparation"
import {
  useSettlementQuery,
  useSaveSettlementMutation,
  useUpdateSettlementStatusMutation,
} from "@/hooks/useSettlement"

export interface SeparationRecord {
  id: string
  employeeName: string
  employeeEmail: string
  department: string
  lastWorkingDay: string
  reason: string
  status: "Notice Period" | "Clearance" | "Cleared"
  clearances: {
    it: boolean
    finance: boolean
    hr: boolean
    manager: boolean
  }
  assetsReturned: {
    laptop: boolean
    accessCard: boolean
    keys: boolean
    other: boolean
  }
  handoverCompleted: boolean
}

const clearanceFieldName = {
  it: "clearanceIt" as const,
  finance: "clearanceFinance" as const,
  hr: "clearanceHr" as const,
  manager: "clearanceManager" as const,
}

const assetFieldName = {
  laptop: "assetLaptop" as const,
  accessCard: "assetAccessCard" as const,
  keys: "assetKeys" as const,
  other: "assetOther" as const,
}

export default function SeparationPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // API Queries & Mutations
  const { data: dbRecords = [], isLoading } = useSeparationRecordsQuery({
    search,
    status: statusFilter,
  })

  const createMutation = useCreateSeparationMutation()
  const updateMutation = useUpdateSeparationMutation()

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentSep, setCurrentSep] = useState<SeparationRecord | null>(null)

  // F&F Modal States
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const [selectedSepId, setSelectedSepId] = useState<string | null>(null)
  const [selectedSepName, setSelectedSepName] = useState<string>("")

  // Form States
  const [newEmpName, setNewEmpName] = useState("")
  const [newEmpEmail, setNewEmpEmail] = useState("")
  const [newDept, setNewDept] = useState("Engineering")
  const [newLWD, setNewLWD] = useState("")
  const [newReason, setNewReason] = useState("")

  const mapBackendRecord = (rec: any): SeparationRecord => ({
    id: rec.id,
    employeeName: rec.employeeName,
    employeeEmail: rec.employeeEmail,
    department: rec.department,
    lastWorkingDay: rec.lastWorkingDay,
    reason: rec.reason,
    status: rec.status,
    clearances: {
      it: rec.clearanceIt,
      finance: rec.clearanceFinance,
      hr: rec.clearanceHr,
      manager: rec.clearanceManager,
    },
    assetsReturned: {
      laptop: rec.assetLaptop,
      accessCard: rec.assetAccessCard,
      keys: rec.assetKeys,
      other: rec.assetOther,
    },
    handoverCompleted: rec.handoverCompleted,
  })

  const separations = dbRecords.map(mapBackendRecord)

  const handleCreate = () => {
    if (!newEmpName.trim() || !newEmpEmail.trim() || !newLWD) return
    createMutation.mutate(
      {
        employeeName: newEmpName.trim(),
        employeeEmail: newEmpEmail.trim(),
        department: newDept,
        lastWorkingDay: newLWD,
        reason: newReason.trim(),
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false)
          setNewEmpName("")
          setNewEmpEmail("")
          setNewLWD("")
          setNewReason("")
        },
      }
    )
  }

  const handleUpdateClearance = (sepId: string, department: keyof SeparationRecord["clearances"], val: boolean) => {
    const dbField = clearanceFieldName[department]
    updateMutation.mutate(
      { id: sepId, [dbField]: val },
      {
        onSuccess: (updated) => {
          if (currentSep && currentSep.id === sepId) {
            setCurrentSep(mapBackendRecord(updated))
          }
        },
      }
    )
  }

  const handleUpdateAsset = (sepId: string, asset: keyof SeparationRecord["assetsReturned"], val: boolean) => {
    const dbField = assetFieldName[asset]
    updateMutation.mutate(
      { id: sepId, [dbField]: val },
      {
        onSuccess: (updated) => {
          if (currentSep && currentSep.id === sepId) {
            setCurrentSep(mapBackendRecord(updated))
          }
        },
      }
    )
  }

  const handleUpdateHandover = (sepId: string, val: boolean) => {
    updateMutation.mutate(
      { id: sepId, handoverCompleted: val },
      {
        onSuccess: (updated) => {
          if (currentSep && currentSep.id === sepId) {
            setCurrentSep(mapBackendRecord(updated))
          }
        },
      }
    )
  }

  const filtered = separations // Handled by backend filters

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading offboarding records...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserMinus className="h-6 w-6 text-primary" />
            Separation & Offboarding
          </h2>
          <p className="text-muted-foreground">Manage exit clearances, handover tasks, and asset returns</p>
        </div>
        <Button className="gap-2 text-xs font-semibold" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Initiate Exit
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Serving Notice</p>
              <p className="text-2xl font-bold mt-1">
                {separations.filter(s => s.status === "Notice Period").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-sky-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Clearance Stage</p>
              <p className="text-2xl font-bold mt-1">
                {separations.filter(s => s.status === "Clearance").length}
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Successfully Cleared</p>
              <p className="text-2xl font-bold mt-1">
                {separations.filter(s => s.status === "Cleared").length}
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
              placeholder="Search by employee name or email..."
              className="pl-9 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {[
              { id: "all", label: "All Cases" },
              { id: "Notice Period", label: "Notice Period" },
              { id: "Clearance", label: "Clearance" },
              { id: "Cleared", label: "Cleared" },
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
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Department</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Last Working Day</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Clearance Checklist</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(sep => {
                    const totalClearances = Object.values(sep.clearances).filter(Boolean).length
                    return (
                      <TableRow key={sep.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{sep.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground">{sep.employeeEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                          {sep.department}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                          {sep.lastWorkingDay}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-muted-foreground">{totalClearances}/4 cleared</span>
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${(totalClearances / 4) * 100}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={cn("text-[9px] font-bold border-none",
                            sep.status === "Cleared" && "bg-emerald-500/10 text-emerald-600",
                            sep.status === "Clearance" && "bg-amber-500/10 text-amber-600",
                            sep.status === "Notice Period" && "bg-sky-500/10 text-sky-600"
                          )}>
                            {sep.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs font-medium"
                              onClick={() => {
                                setCurrentSep(sep)
                                setIsDetailOpen(true)
                              }}
                            >
                              Manage Exit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                              onClick={() => {
                                setSelectedSepId(sep.id)
                                setSelectedSepName(sep.employeeName)
                                setIsSettlementOpen(true)
                              }}
                            >
                              F&F Settlement
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <UserMinus className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No separation records found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Initiate Exit Process</DialogTitle>
            <DialogDescription className="text-xs">Log exit requests and begin offboarding clearance workflows.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name" className="text-xs font-semibold">Employee Name</Label>
              <Input id="emp-name" placeholder="e.g. John Doe" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-email" className="text-xs font-semibold">Employee Email</Label>
              <Input id="emp-email" type="email" placeholder="e.g. john.doe@sadoshima.com" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sep-dept" className="text-xs font-semibold">Department</Label>
                <Select value={newDept} onValueChange={setNewDept}>
                  <SelectTrigger id="sep-dept" className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering" className="text-xs">Engineering</SelectItem>
                    <SelectItem value="Human Resources" className="text-xs">Human Resources</SelectItem>
                    <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
                    <SelectItem value="Sales" className="text-xs">Sales</SelectItem>
                    <SelectItem value="Finance" className="text-xs">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lwd" className="text-xs font-semibold">Last Working Day</Label>
                <Input id="lwd" type="date" value={newLWD} onChange={e => setNewLWD(e.target.value)} className="text-xs h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exit-reason" className="text-xs font-semibold">Reason for Departure</Label>
              <Input id="exit-reason" placeholder="e.g. New Offer, Relocating" value={newReason} onChange={e => setNewReason(e.target.value)} className="text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={!newEmpName.trim() || !newEmpEmail.trim() || !newLWD} className="text-xs">Initiate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit details & checklists */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {currentSep && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold">Manage Exit Clearance — {currentSep.employeeName}</DialogTitle>
                <DialogDescription className="text-xs">Complete exit checklist, confirm asset return, and verify handovers.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Section 1: Exit details */}
                <div className="p-3 bg-muted/20 border border-border/30 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Department:</span><span className="font-semibold">{currentSep.department}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Working Day:</span><span className="font-semibold">{currentSep.lastWorkingDay}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Reason:</span><span className="font-semibold">{currentSep.reason}</span></div>
                </div>

                {/* Section 2: Clearance Checklist */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Department Clearances
                  </h4>
                  <div className="grid grid-cols-2 gap-3 p-3 border border-border/40 rounded-xl bg-background">
                    {[
                      { key: "it" as const, label: "IT Infrastructure & Security" },
                      { key: "finance" as const, label: "Finance & Final Settlements" },
                      { key: "hr" as const, label: "Human Resources & Exit Interview" },
                      { key: "manager" as const, label: "Reporting Line & Knowledge Handover" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`clearance-${item.key}`}
                          checked={currentSep.clearances[item.key]}
                          onCheckedChange={checked => handleUpdateClearance(currentSep.id, item.key, !!checked)}
                        />
                        <Label htmlFor={`clearance-${item.key}`} className="text-xs font-medium cursor-pointer">
                          {item.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Asset return tracker */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 text-foreground uppercase tracking-wide">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                    Asset Return Tracker
                  </h4>
                  <div className="grid grid-cols-2 gap-3 p-3 border border-border/40 rounded-xl bg-background">
                    {[
                      { key: "laptop" as const, label: "Laptop & Accessories", icon: Laptop },
                      { key: "accessCard" as const, label: "Access Token / Security Card", icon: CreditCard },
                      { key: "keys" as const, label: "Office Cabinet & Drawer Keys", icon: Key },
                      { key: "other" as const, label: "Other Company Property", icon: ShieldAlert },
                    ].map(asset => {
                      const Icon = asset.icon
                      return (
                        <div key={asset.key} className="flex items-center gap-2">
                          <Checkbox
                            id={`asset-${asset.key}`}
                            checked={currentSep.assetsReturned[asset.key]}
                            onCheckedChange={checked => handleUpdateAsset(currentSep.id, asset.key, !!checked)}
                          />
                          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Label htmlFor={`asset-${asset.key}`} className="text-xs font-medium cursor-pointer">
                            {asset.label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section 4: Handover Completion */}
                <div className="flex items-center gap-3 p-3 border border-border/40 rounded-xl bg-background">
                  <Checkbox
                    id="handover-check"
                    checked={currentSep.handoverCompleted}
                    onCheckedChange={checked => handleUpdateHandover(currentSep.id, !!checked)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="handover-check" className="text-xs font-bold cursor-pointer">Knowledge Handover Complete</Label>
                    <p className="text-[10px] text-muted-foreground">Confirm that all task documentation has been uploaded and team transitions completed.</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)} className="text-xs">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* F&F Settlement Modal */}
      {selectedSepId && (
        <SettlementCalculatorModal
          isOpen={isSettlementOpen}
          onClose={() => {
            setIsSettlementOpen(false)
            setSelectedSepId(null)
          }}
          separationId={selectedSepId}
          employeeName={selectedSepName}
        />
      )}
    </div>
  )
}

function SettlementCalculatorModal({
  isOpen,
  onClose,
  separationId,
  employeeName,
}: {
  isOpen: boolean
  onClose: () => void
  separationId: string
  employeeName: string
}) {
  const { data: settlement, isLoading, refetch } = useSettlementQuery(separationId, isOpen)
  const saveMutation = useSaveSettlementMutation()
  const statusMutation = useUpdateSettlementStatusMutation()

  // Form states
  const [separationType, setSeparationType] = useState("Resignation")
  const [payableDays, setPayableDays] = useState(0)
  const [encashableAlDays, setEncashableAlDays] = useState(0)
  const [pfInterest, setPfInterest] = useState(0)
  const [medicalReimbursement, setMedicalReimbursement] = useState(0)
  const [wellnessAllowance, setWellnessAllowance] = useState(0)
  const [otherReimbursements, setOtherReimbursements] = useState(0)
  const [salaryAdvanceRecovery, setSalaryAdvanceRecovery] = useState(0)
  const [loanRecovery, setLoanRecovery] = useState(0)
  const [noticePayRecovery, setNoticePayRecovery] = useState(0)
  const [assetRecovery, setAssetRecovery] = useState(0)
  const [taxAdjustment, setTaxAdjustment] = useState(0)
  const [otherCompanyDues, setOtherCompanyDues] = useState(0)
  const [paymentDetails, setPaymentDetails] = useState("")

  // Initialize form state from loaded settlement data
  useEffect(() => {
    if (settlement) {
      setSeparationType(settlement.separationType)
      setPayableDays(settlement.payableDays)
      setEncashableAlDays(settlement.encashableAlDays)
      setPfInterest(settlement.pfInterest)
      setMedicalReimbursement(settlement.medicalReimbursement)
      setWellnessAllowance(settlement.wellnessAllowance)
      setOtherReimbursements(settlement.otherReimbursements)
      setSalaryAdvanceRecovery(settlement.salaryAdvanceRecovery)
      setLoanRecovery(settlement.loanRecovery)
      setNoticePayRecovery(settlement.noticePayRecovery)
      setAssetRecovery(settlement.assetRecovery)
      setTaxAdjustment(settlement.taxAdjustment)
      setOtherCompanyDues(settlement.otherCompanyDues)
      setPaymentDetails(settlement.paymentDetails || "")
    }
  }, [settlement])

  if (!isOpen) return null

  if (isLoading || !settlement) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading settlement matrix...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Live Calculations (to update instantly on user input!)
  const basicSalary = settlement.basicSalary || 50000
  const grossSalary = settlement.grossSalary || 67500
  const serviceYears = settlement.serviceYears || 0
  const employeePfBalance = settlement.employeePfBalance || 0
  const employerPfBalance = settlement.employerPfBalance || 0
  const festivalBonusAdjustment = settlement.festivalBonusAdjustment || 0

  // 1. Salary Payable
  const salaryPayable = Number(((grossSalary / 30) * payableDays).toFixed(2))

  // 2. Separation Benefit
  let separationBenefit = 0
  if (separationType === "Retirement") {
    separationBenefit = (serviceYears <= 10 ? 1 : 1.5) * basicSalary * serviceYears
  } else if (separationType === "Resignation") {
    if (serviceYears >= 5 && serviceYears <= 10) {
      separationBenefit = (14 / 30) * basicSalary * serviceYears
    } else if (serviceYears > 10) {
      separationBenefit = 1 * basicSalary * serviceYears
    }
  } else if (separationType === "Termination") {
    separationBenefit = (serviceYears <= 10 ? 1 : 1.5) * basicSalary * serviceYears
  }
  separationBenefit = Number(separationBenefit.toFixed(2))

  // 3. Leave Encashment
  const leaveEncashment = Number(((basicSalary / 30) * encashableAlDays).toFixed(2))

  // Totals
  const totalEarnings = 
    salaryPayable +
    separationBenefit +
    leaveEncashment +
    festivalBonusAdjustment +
    employeePfBalance +
    employerPfBalance +
    pfInterest +
    medicalReimbursement +
    wellnessAllowance +
    otherReimbursements

  const totalRecoveries =
    salaryAdvanceRecovery +
    loanRecovery +
    noticePayRecovery +
    assetRecovery +
    taxAdjustment +
    otherCompanyDues

  const netSettlementAmount = Number((totalEarnings - totalRecoveries).toFixed(2))

  const handleSave = () => {
    saveMutation.mutate({
      separationId,
      payload: {
        separationType,
        payableDays,
        encashableAlDays,
        pfInterest,
        medicalReimbursement,
        wellnessAllowance,
        otherReimbursements,
        salaryAdvanceRecovery,
        loanRecovery,
        noticePayRecovery,
        assetRecovery,
        taxAdjustment,
        otherCompanyDues,
      }
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleUpdateStatus = (newStatus: "Approved" | "Paid") => {
    statusMutation.mutate({
      separationId,
      status: newStatus,
      paymentDetails: newStatus === "Paid" ? paymentDetails : undefined
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const isReadOnly = settlement.status === "Paid" || settlement.status === "Approved"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        {/* Style block to cleanly isolate print layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
            .print\\:bg-transparent {
              background: transparent !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
          }
        `}} />

        <div className="print-area">
          {/* Print Letterhead Branding Header */}
          <div className="hidden print:block text-center space-y-1 pb-4 border-b border-border mb-4">
            <h1 className="text-lg font-extrabold uppercase tracking-widest text-foreground">Sadoshima Global Corp</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CONFIDENTIAL FULL & FINAL (F&F) SETTLEMENT STATEMENT</p>
            <p className="text-[11px] font-bold mt-1">Exiting Employee: {employeeName} ({settlement.employeeEmail})</p>
          </div>

          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  F&F Settlement Matrix — {employeeName}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Computes 16-step separation payouts, provident funds, and recoveries based on service terms.
                </DialogDescription>
              </div>
              <Badge className={cn("text-xs font-bold border-none px-3 py-1",
                settlement.status === "Paid" && "bg-emerald-500/10 text-emerald-600",
                settlement.status === "Approved" && "bg-amber-500/10 text-amber-600",
                settlement.status === "Draft" && "bg-sky-500/10 text-sky-600"
              )}>
                Status: {settlement.status}
              </Badge>
            </div>
          </DialogHeader>

          {/* Matrix Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-xs print:py-2">
            {/* Left Column: parameters and earnings */}
            <div className="space-y-4">
              <div className="p-4 border border-border/40 bg-muted/10 rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border/10 pb-1.5">
                  <FileText className="h-4 w-4 text-primary print:hidden" />
                  1. Service Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Separation Type</Label>
                    <div className="print:hidden">
                      <Select 
                        disabled={isReadOnly}
                        value={separationType} 
                        onValueChange={setSeparationType}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Resignation" className="text-xs">Resignation</SelectItem>
                          <SelectItem value="Retirement" className="text-xs">Retirement</SelectItem>
                          <SelectItem value="Termination" className="text-xs">Termination</SelectItem>
                          <SelectItem value="Dismissal" className="text-xs">Dismissal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{separationType}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Completed Years</Label>
                    <Input disabled value={serviceYears} className="h-8 text-xs bg-muted/50 print:hidden" />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{serviceYears} Years</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Payable Days (Month)</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={payableDays} 
                      onChange={e => setPayableDays(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{payableDays} Days</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Encashable AL Days</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={encashableAlDays} 
                      onChange={e => setEncashableAlDays(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{encashableAlDays} Days</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/20 grid grid-cols-2 gap-4 text-[11px] text-muted-foreground print:text-foreground">
                  <div>Basic Salary: <span className="font-semibold text-foreground">৳{basicSalary.toLocaleString()}</span></div>
                  <div>Gross Salary: <span className="font-semibold text-foreground">৳{grossSalary.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="p-4 border border-border/40 bg-emerald-500/[0.02] rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b border-border/10 pb-1.5 print:text-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500 print:hidden" />
                  2. Payouts & Earnings (৳)
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Salary Payable</span>
                    <span className="font-semibold text-foreground">৳{salaryPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Separation Benefit (Gratuity/Tenure)</span>
                    <span className="font-semibold text-foreground">৳{separationBenefit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Leave Encashment</span>
                    <span className="font-semibold text-foreground">৳{leaveEncashment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Festival Bonus Adj.</span>
                    <span className="font-semibold text-foreground">৳{festivalBonusAdjustment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Provident Fund Balance (Emp+Empr)</span>
                    <span className="font-semibold text-foreground">৳{(employeePfBalance + employerPfBalance).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">PF Interest</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={pfInterest} 
                        onChange={e => setPfInterest(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{pfInterest.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Medical Reimbursement</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={medicalReimbursement} 
                        onChange={e => setMedicalReimbursement(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{medicalReimbursement.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Wellness Allowance</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={wellnessAllowance} 
                        onChange={e => setWellnessAllowance(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{wellnessAllowance.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Other Reimbursements</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={otherReimbursements} 
                        onChange={e => setOtherReimbursements(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{otherReimbursements.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20 text-emerald-700 font-bold text-sm print:text-foreground">
                    <span>Total Earnings</span>
                    <span>৳{totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recoveries & Deductions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="p-4 border border-border/40 bg-rose-500/[0.02] rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-rose-600 flex items-center gap-2 border-b border-border/10 pb-1.5 print:text-foreground">
                  <ShieldAlert className="h-4 w-4 text-rose-500 print:hidden" />
                  3. Recoveries & Deductions (৳)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Salary Advance Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={salaryAdvanceRecovery} 
                      onChange={e => setSalaryAdvanceRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{salaryAdvanceRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Loan Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={loanRecovery} 
                      onChange={e => setLoanRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{loanRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Notice Pay Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={noticePayRecovery} 
                      onChange={e => setNoticePayRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{noticePayRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Asset Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={assetRecovery} 
                      onChange={e => setAssetRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{assetRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Tax Adjustment</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={taxAdjustment} 
                      onChange={e => setTaxAdjustment(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{taxAdjustment.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Other Company Dues</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={otherCompanyDues} 
                      onChange={e => setOtherCompanyDues(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{otherCompanyDues.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-rose-500/20 text-rose-700 font-bold text-sm print:text-foreground">
                  <span>Total Recoveries</span>
                  <span>৳{totalRecoveries.toLocaleString()}</span>
                </div>
              </div>

              {/* Net payout summary */}
              <div className="p-4 border border-border bg-muted/30 rounded-2xl space-y-4 print:bg-transparent print:p-0 print:border-none">
                <div className="flex justify-between items-center text-sm font-extrabold text-foreground border-b border-border/10 pb-2">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4.5 w-4.5 text-primary print:hidden" />
                    Net Settlement Payable
                  </span>
                  <span className="text-lg text-primary print:text-foreground font-black">৳{netSettlementAmount.toLocaleString()}</span>
                </div>

                {settlement.status === "Approved" && (
                  <div className="space-y-2 pt-2 border-t border-border/40 print:hidden">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Payment Details (Reference/Method)</Label>
                    <Input 
                      placeholder="e.g. Bank Transfer Ref TXN-12345" 
                      value={paymentDetails} 
                      onChange={e => setPaymentDetails(e.target.value)} 
                      className="h-8 text-xs" 
                    />
                  </div>
                )}

                {settlement.status === "Paid" && settlement.paymentDetails && (
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-800 print:bg-transparent print:border-none print:p-0">
                    <strong>Payment Reference:</strong> {settlement.paymentDetails}
                  </div>
                )}

                {/* Print layout signature footer */}
                <div className="hidden print:flex justify-between pt-14 text-[9px] font-bold">
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>Exiting Employee</p>
                  </div>
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>HR Specialist</p>
                  </div>
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>Managing Director</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 print:hidden">
                  {settlement.status === "Draft" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSave} 
                        disabled={saveMutation.isPending}
                        className="text-xs h-8"
                      >
                        {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Save Draft
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          saveMutation.mutate({
                            separationId,
                            payload: {
                              separationType,
                              payableDays,
                              encashableAlDays,
                              pfInterest,
                              medicalReimbursement,
                              wellnessAllowance,
                              otherReimbursements,
                              salaryAdvanceRecovery,
                              loanRecovery,
                              noticePayRecovery,
                              assetRecovery,
                              taxAdjustment,
                              otherCompanyDues,
                            }
                          }, {
                            onSuccess: () => {
                              handleUpdateStatus("Approved")
                            }
                          })
                        }} 
                        disabled={statusMutation.isPending || saveMutation.isPending}
                        className="text-xs h-8 bg-amber-600 hover:bg-amber-700"
                      >
                        {statusMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Approve & Lock
                      </Button>
                    </>
                  )}

                  {settlement.status === "Approved" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus("Paid")}
                      disabled={statusMutation.isPending || !paymentDetails.trim()}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {statusMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      Mark as Paid
                    </Button>
                  )}

                  {/* Print Button */}
                  <Button 
                    size="sm" 
                    className="gap-2 text-xs h-8 bg-sky-600 hover:bg-sky-700" 
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Print F&F
                  </Button>

                  <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">Close</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
