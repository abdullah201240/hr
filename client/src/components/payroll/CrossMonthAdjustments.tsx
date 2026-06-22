import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { cn } from "@/lib/utils"

interface CrossMonthAdjustmentProps {
  employees: any[]
  salaries?: any[]
  selectedMonth: string
  cycleStatus?: string
  formatCurrency: (amount: number) => string
  onCreateAdjustment: (data: any) => void
  onDeleteAdjustment: (id: string) => void
  onApplyAdjustments: (monthKey: string) => void
  pendingAdjustments: any[]
  isCreating?: boolean
  isDeleting?: boolean
  isApplying?: boolean
}

export function CrossMonthAdjustments({
  employees,
  salaries = [],
  selectedMonth,
  cycleStatus = "Draft",
  formatCurrency,
  onCreateAdjustment,
  onDeleteAdjustment,
  onApplyAdjustments,
  pendingAdjustments,
  isCreating = false,
  isDeleting = false,
  isApplying = false,
}: CrossMonthAdjustmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [targetMonthKey, setTargetMonthKey] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"addition" | "deduction" | "partial_salary">("deduction")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  
  // Partial salary fields
  const [prorationMode, setProrationMode] = useState<"dayRange" | "dateRange" | "paidDays">("dayRange")
  const [startDay, setStartDay] = useState("1")
  const [endDay, setEndDay] = useState("15")
  const [paidDays, setPaidDays] = useState("15")

  const selectedEmployee = employees.find((e) => e.id === employeeId)
  const salaryRecord = salaries.find((s) => s.employeeId === employeeId)
  const employeeBasicSalary = selectedEmployee?.salary?.basicSalary || salaryRecord?.basicSalary || 0

  const getDaysInMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number)
    if (!year || !month) return 30
    return new Date(year, month, 0).getDate()
  }

  const calculatePartialAmount = () => {
    if (!targetMonthKey || !employeeBasicSalary) return 0

    const daysInMonth = getDaysInMonth(targetMonthKey)
    let calculatedPaidDays = 0

    if (prorationMode === "dayRange") {
      calculatedPaidDays = parseInt(endDay) - parseInt(startDay) + 1
    } else if (prorationMode === "paidDays") {
      calculatedPaidDays = parseInt(paidDays)
    }

    const unpaidDays = daysInMonth - calculatedPaidDays
    const deductionAmount = Math.round((employeeBasicSalary / daysInMonth) * unpaidDays)
    return deductionAmount
  }

  const handleSubmit = () => {
    if (!employeeId || !targetMonthKey || !reason) {
      Swal.fire("Error", "Please fill in all required fields", "error")
      return
    }

    const finalAmount = adjustmentType === "partial_salary" ? calculatePartialAmount() : parseFloat(amount)

    if (!finalAmount || finalAmount <= 0) {
      Swal.fire("Error", "Invalid amount", "error")
      return
    }

    const metadata = adjustmentType === "partial_salary" ? {
      prorationMode,
      startDay: prorationMode === "dayRange" ? parseInt(startDay) : undefined,
      endDay: prorationMode === "dayRange" ? parseInt(endDay) : undefined,
      paidDays: prorationMode === "paidDays" ? parseInt(paidDays) : undefined,
      totalDaysInMonth: getDaysInMonth(targetMonthKey),
      originalNetPay: employeeBasicSalary,
    } : undefined

    onCreateAdjustment({
      employeeId,
      targetMonthKey,
      appliedMonthKey: selectedMonth,
      adjustmentType,
      amount: finalAmount,
      reason,
      metadata,
    })

    // Reset form
    setEmployeeId("")
    setTargetMonthKey("")
    setAmount("")
    setReason("")
    setStartDay("1")
    setEndDay("15")
    setPaidDays("15")
    setIsOpen(false)
  }

  const handleDelete = (adjustmentId: string, reason: string) => {
    Swal.fire({
      title: "Delete Adjustment?",
      text: `Are you sure you want to delete: "${reason}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onDeleteAdjustment(adjustmentId)
      }
    })
  }

  const handleApplyAll = () => {
    if (pendingAdjustments.length === 0) {
      Swal.fire("Info", "No pending adjustments to apply", "info")
      return
    }

    Swal.fire({
      title: "Apply All Adjustments?",
      html: `This will apply <strong>${pendingAdjustments.length}</strong> pending adjustment(s) to <strong>${selectedMonth}</strong> payroll cycle.<br/><br/>This action cannot be undone.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Apply",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onApplyAdjustments(selectedMonth)
      }
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-amber-500" />
      case "Applied":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-rose-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>
      case "Applied":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Applied</Badge>
      case "Cancelled":
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Cancelled</Badge>
      default:
        return null
    }
  }

  return (
    <>
      {/* Summary Card */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Cross-Month Salary Adjustments
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {cycleStatus !== "Draft" ? (
                  <span className="text-amber-600 font-medium">
                    Adjustments can only be created or applied when the current cycle is in Draft.
                  </span>
                ) : (
                  "Adjust previous months' salaries in current payroll cycle"
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApplyAll}
                disabled={pendingAdjustments.length === 0 || isApplying || cycleStatus !== "Draft"}
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isApplying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5" />
                )}
                Apply All ({pendingAdjustments.length})
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(true)}
                disabled={cycleStatus !== "Draft"}
                className="gap-2 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                New Adjustment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pendingAdjustments.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="text-xs">Employee</TableHead>
                  <TableHead className="text-xs">Target Month</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAdjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell className="text-xs font-medium">{adj.employeeName}</TableCell>
                    <TableCell className="text-xs">{adj.targetMonthKey}</TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          adj.adjustmentType === "addition"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : adj.adjustmentType === "deduction"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        )}
                      >
                        {adj.adjustmentType === "partial_salary" ? "Partial" : adj.adjustmentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{adj.reason}</TableCell>
                    <TableCell className={cn(
                      "text-xs text-right font-semibold",
                      adj.adjustmentType === "addition" || adj.adjustmentType === "partial_salary"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    )}>
                      {adj.adjustmentType === "deduction" ? "-" : "+"}{formatCurrency(adj.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(adj.status)}
                        {getStatusBadge(adj.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                        onClick={() => handleDelete(adj.id, adj.reason)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">No pending adjustments</p>
              <p className="text-xs">Create a new adjustment to adjust previous months' salaries</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Adjustment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-base">Create Cross-Month Adjustment</DialogTitle>
            <DialogDescription className="text-xs">
              Adjust a previous month's salary in the current payroll cycle ({selectedMonth})
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Employee Selection */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Employee *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} className="text-xs">
                      {emp.fullNameEnglish} ({emp.employeeId || "N/A"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Month */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Target Month (Being Adjusted) *</Label>
              <Input
                type="month"
                value={targetMonthKey}
                onChange={(e) => setTargetMonthKey(e.target.value)}
                className="text-xs"
                placeholder="e.g., 2026-05"
              />
            </div>

            {/* Adjustment Type */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Adjustment Type *</Label>
              <Select value={adjustmentType} onValueChange={(val) => setAdjustmentType(val as any)}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deduction" className="text-xs">Deduction (Reduce Salary)</SelectItem>
                  <SelectItem value="addition" className="text-xs">Addition (Increase Salary)</SelectItem>
                  <SelectItem value="partial_salary" className="text-xs">Partial Salary (Prorated)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Partial Salary Options */}
            {adjustmentType === "partial_salary" && targetMonthKey && (
              <div className="rounded-lg border border-border/40 bg-muted/10 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Proration Mode</Label>
                  <Badge variant="outline" className="text-[10px]">
                    {getDaysInMonth(targetMonthKey)} days in month
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setProrationMode("dayRange")}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-md transition-colors",
                      prorationMode === "dayRange"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    By Day Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setProrationMode("paidDays")}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-md transition-colors",
                      prorationMode === "paidDays"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    By Paid Days
                  </button>
                </div>

                {prorationMode === "dayRange" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1.5">
                      <Label className="text-[11px]">Start Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max={getDaysInMonth(targetMonthKey)}
                        value={startDay}
                        onChange={(e) => setStartDay(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[11px]">End Day</Label>
                      <Input
                        type="number"
                        min="1"
                        max={getDaysInMonth(targetMonthKey)}
                        value={endDay}
                        onChange={(e) => setEndDay(e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                )}

                {prorationMode === "paidDays" && (
                  <div className="grid gap-1.5">
                    <Label className="text-[11px]">Number of Paid Days</Label>
                    <Input
                      type="number"
                      min="1"
                      max={getDaysInMonth(targetMonthKey)}
                      value={paidDays}
                      onChange={(e) => setPaidDays(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                )}

                <div className="rounded-md bg-background p-2 text-[11px]">
                  <p className="text-muted-foreground">
                    Calculated Deduction: <span className="font-semibold text-rose-600">{formatCurrency(calculatePartialAmount())}</span>
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Based on basic salary: {formatCurrency(employeeBasicSalary)}
                  </p>
                </div>
              </div>
            )}

            {/* Amount (for non-partial types) */}
            {adjustmentType !== "partial_salary" && (
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-xs"
                  placeholder="e.g., 5000"
                />
              </div>
            )}

            {/* Reason */}
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Reason *</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
                placeholder="e.g., Partial salary for May (1-15), May overpayment recovery"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isCreating}
              className="text-xs bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
