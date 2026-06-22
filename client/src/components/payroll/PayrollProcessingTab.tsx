import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, FileSpreadsheet, Loader2, AlertTriangle, Pencil, Save, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/types/salary"
import { exportToCsv } from "@/lib/export"
import { useUpdatePayslipAdjustmentsMutation } from "@/hooks/usePayroll"
import Swal from "sweetalert2"

interface PayrollProcessingTabProps {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  cycleStatus: string
  payslipsList: Payslip[]
  formatCurrency: (amount: number) => string
  setViewPayslip: (payslip: Payslip | null) => void
  monthsOptions: Array<{ key: string; label: string }>
  isLoading?: boolean
  employees?: any[]
}

type AdjustmentType = "addition" | "deduction"

interface AdjustmentItem {
  id: string
  title: string
  amount: number
  type: AdjustmentType
}

export function PayrollProcessingTab({
  selectedMonth,
  setSelectedMonth,
  cycleStatus,
  payslipsList,
  formatCurrency,
  setViewPayslip,
  monthsOptions,
  isLoading,
  employees = [],
}: PayrollProcessingTabProps) {
  const updateAdjustmentsMutation = useUpdatePayslipAdjustmentsMutation()
  const [adjustingPayslip, setAdjustingPayslip] = useState<Payslip | null>(null)
  const [adjustmentTitle, setAdjustmentTitle] = useState("")
  const [adjustmentAmount, setAdjustmentAmount] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("addition")
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([])
  const [partialStartDay, setPartialStartDay] = useState("1")
  const [partialEndDay, setPartialEndDay] = useState("15")
  const [prorationMode, setProrationMode] = useState<"dayRange" | "dateRange" | "paidDays">("dayRange")
  const [partialStartDate, setPartialStartDate] = useState("")
  const [partialEndDate, setPartialEndDate] = useState("")
  const [customPaidDays, setCustomPaidDays] = useState("10")

  const getPayslipAllowancesSum = (p: Payslip) => {
    if (p.allowances && Object.keys(p.allowances).length > 0) {
      return Object.values(p.allowances).reduce((sum, val) => sum + (Number(val) || 0), 0)
    }
    return p.allowanceHra + p.allowanceTransport + p.allowanceMedical
  }

  const getPayslipDeductionsSum = (p: Payslip) => {
    if (p.deductions && Object.keys(p.deductions).length > 0) {
      return Object.values(p.deductions).reduce((sum, val) => sum + (Number(val) || 0), 0)
    }
    return p.deductionTax + p.deductionPf
  }

  const getAdjustmentTitle = (label: string) => {
    if (label.startsWith("Adjustment:")) return label.replace("Adjustment:", "").trim()
    if (label.includes(":")) return label.split(":").slice(1).join(":").trim()
    return label
  }

  const getExistingAdjustmentItems = (payslip: Payslip) => {
    const items: AdjustmentItem[] = []
    Object.entries(payslip.allowances || {}).forEach(([label, amount], index) => {
      if (!label.startsWith("Adjustment:") && !label.startsWith("Manual Addition")) return
      const value = Number(amount) || 0
      if (value <= 0) return
      items.push({
        id: `allowance-${index}-${label}`,
        title: getAdjustmentTitle(label),
        amount: value,
        type: "addition",
      })
    })
    Object.entries(payslip.deductions || {}).forEach(([label, amount], index) => {
      const isManual = label.startsWith("Adjustment:") || label.startsWith("Deduction Reduction") || label.startsWith("Extra Deduction")
      if (!isManual) return
      const value = Number(amount) || 0
      if (value === 0) return
      items.push({
        id: `deduction-${index}-${label}`,
        title: getAdjustmentTitle(label),
        amount: Math.abs(value),
        type: value < 0 ? "addition" : "deduction",
      })
    })
    return items
  }

  const openAdjustmentDialog = (payslip: Payslip) => {
    setAdjustingPayslip(payslip)
    setAdjustmentTitle("")
    setAdjustmentAmount("")
    setAdjustmentType("addition")
    setAdjustmentItems(getExistingAdjustmentItems(payslip))
    setPartialStartDay("1")
    setPartialEndDay("15")
    setProrationMode("dayRange")
    setCustomPaidDays("10")
    if (selectedMonth) {
      setPartialStartDate(`${selectedMonth}-01`)
      setPartialEndDate(`${selectedMonth}-15`)
    }
  }

  const parseMoneyInput = (value: string) => {
    const parsed = Number(value || 0)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }

  const getDaysInSelectedMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number)
    if (!year || !month) return 30
    return new Date(year, month, 0).getDate()
  }

  const parseDayInput = (value: string) => {
    const daysInMonth = getDaysInSelectedMonth()
    const parsed = Math.trunc(Number(value || 0))
    if (!Number.isFinite(parsed)) return 1
    return Math.min(daysInMonth, Math.max(1, parsed))
  }

  const handleAddAdjustmentItem = () => {
    const title = adjustmentTitle.trim()
    const amount = parseMoneyInput(adjustmentAmount)
    if (!title || amount <= 0) return

    setAdjustmentItems((items) => [
      ...items,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title,
        amount,
        type: adjustmentType,
      },
    ])
    setAdjustmentTitle("")
    setAdjustmentAmount("")
    setAdjustmentType("addition")
  }

  const handleApplyPartialPayPeriod = () => {
    if (!adjustingPayslip) return

    const daysInMonth = getDaysInSelectedMonth()
    let paidDays = 0
    let title = ""

    if (prorationMode === "dayRange") {
      const startDay = parseDayInput(partialStartDay)
      const endDay = parseDayInput(partialEndDay)
      if (startDay > endDay) return
      paidDays = endDay - startDay + 1
      title = `Partial salary period (${startDay}-${endDay})`
    } else if (prorationMode === "dateRange") {
      if (!partialStartDate || !partialEndDate) return
      const start = new Date(partialStartDate)
      const end = new Date(partialEndDate)
      if (start > end) return
      const startDay = start.getDate()
      const endDay = end.getDate()
      paidDays = endDay - startDay + 1
      title = `Partial salary period (${startDay}-${endDay})`
    } else if (prorationMode === "paidDays") {
      const days = Math.trunc(Number(customPaidDays || 0))
      if (days <= 0 || days > daysInMonth) return
      paidDays = days
      title = `Partial salary period (${paidDays} days)`
    }

    const unpaidDays = daysInMonth - paidDays
    const baseNetPay = Math.max(0, adjustingPayslip.netPay - existingManualImpact)
    const deductionAmount = Math.round((baseNetPay / daysInMonth) * unpaidDays)

    setAdjustmentItems((items) => {
      const withoutPreviousPartial = items.filter((item) => !item.title.startsWith("Partial salary period"))
      if (deductionAmount <= 0) return withoutPreviousPartial
      return [
        ...withoutPreviousPartial,
        {
          id: `partial-${Date.now()}`,
          title,
          amount: deductionAmount,
          type: "deduction",
        },
      ]
    })
  }

  const handleRemoveAdjustmentItem = (id: string) => {
    setAdjustmentItems((items) => items.filter((item) => item.id !== id))
  }

  const existingManualImpact = useMemo(() => {
    if (!adjustingPayslip) return 0
    return getExistingAdjustmentItems(adjustingPayslip).reduce((sum, item) => {
      return sum + (item.type === "addition" ? item.amount : -item.amount)
    }, 0)
  }, [adjustingPayslip])

  const adjustmentSummary = useMemo(() => {
    const additions = adjustmentItems
      .filter((item) => item.type === "addition")
      .reduce((sum, item) => sum + item.amount, 0)
    const deductions = adjustmentItems
      .filter((item) => item.type === "deduction")
      .reduce((sum, item) => sum + item.amount, 0)
    const netChange = additions - deductions
    const projectedNet = adjustingPayslip ? adjustingPayslip.netPay - existingManualImpact + netChange : 0
    return { additions, deductions, netChange, projectedNet }
  }, [adjustingPayslip, adjustmentItems, existingManualImpact])

  const handleSaveAdjustments = () => {
    if (!adjustingPayslip) return

    updateAdjustmentsMutation.mutate(
      {
        monthKey: selectedMonth,
        payslipId: adjustingPayslip.id,
        adjustments: adjustmentItems.map(({ title, amount, type }) => ({ title, amount, type })),
      },
      {
        onSuccess: () => {
          setAdjustingPayslip(null)
          Swal.fire({
            title: "Payslip Adjusted",
            text: "Manual additions and deductions were applied to the draft ledger.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2",
            },
          })
        },
      },
    )
  }

  const missingSalaries = useMemo(() => {
    if (!employees || !payslipsList) return []
    return employees.filter(
      (emp) => !payslipsList.some((p) => p.employeeId === emp.id)
    )
  }, [employees, payslipsList])

  const handleExport = () => {
    const headers = [
      "Employee Name",
      "Role",
      "Basic Salary",
      "Total Working Days",
      "Present Days",
      "Absent Days",
      "Leave Days",
      "Late Days",
      "Allowances",
      "Deductions",
      "Net Payable",
      "Payout Status"
    ]
    const rows = payslipsList.map((p) => [
      p.name,
      p.designationName,
      p.basicSalary,
      p.totalWorkingDays ?? 0,
      p.presentDays ?? 0,
      p.absentDays ?? 0,
      p.leaveDays ?? 0,
      p.lateDays ?? 0,
      getPayslipAllowancesSum(p),
      getPayslipDeductionsSum(p),
      p.netPay,
      p.paymentStatus
    ])
    exportToCsv(`Payslips-${selectedMonth}`, headers, rows)
  }

  return (
    <>
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold">Monthly Compensation Ledger</CardTitle>
          <CardDescription className="text-xs">
            Adjust draft salary entries and view disbursement statuses.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={payslipsList.length === 0}
            className="gap-1 text-xs h-9"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </Button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
          >
            {monthsOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold py-1.5 px-2.5",
              cycleStatus === "Distributed" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
              cycleStatus === "Processed" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
              cycleStatus === "Draft" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
            )}
          >
            {cycleStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading payslips...</span>
          </div>
        ) : (
          <>
            {cycleStatus === "Draft" && missingSalaries.length > 0 && (
              <div className="mx-6 my-4 p-4 border border-amber-500/20 bg-amber-500/5 text-amber-600 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-amber-700">Missing Salary Configurations</p>
                  <p className="text-[11px] text-amber-600/90">
                    The following {missingSalaries.length} active employee(s) were skipped because they do not have an active salary configuration. Assign their salary in the Employee Salary tab to include them in the payroll cycle:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {missingSalaries.map((emp) => (
                      <Badge key={emp.id} variant="outline" className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border-amber-500/20 font-medium py-0.5 px-2">
                        {emp.fullNameEnglish} ({emp.employeeId})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Employee
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Basic Salary
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Attendance Metrics
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Allowances
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Deductions
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Net Payable
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Payout Status
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-36">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payslipsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                    No compensation logs generated for this month. Sync the ledger or create a cycle to get started.
                  </TableCell>
                </TableRow>
              ) : (
                payslipsList.map((payslip) => (
                  <TableRow key={payslip.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{payslip.name}</p>
                        <p className="text-[10px] text-muted-foreground">{payslip.designationName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                      {formatCurrency(payslip.basicSalary)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-muted-foreground font-medium">
                          Working Days: <span className="text-foreground font-semibold">{payslip.totalWorkingDays ?? 0}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                            {payslip.presentDays ?? 0} P
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
                            {payslip.absentDays ?? 0} A
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
                            {payslip.leaveDays ?? 0} Lv
                          </Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
                            {payslip.lateDays ?? 0} Lt
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-emerald-600 font-semibold">
                      +{formatCurrency(getPayslipAllowancesSum(payslip))}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-rose-500 font-semibold">
                      -{formatCurrency(getPayslipDeductionsSum(payslip))}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      {formatCurrency(payslip.netPay)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold py-0.5 px-2",
                          payslip.paymentStatus === "Paid"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}
                      >
                        {payslip.paymentStatus}
                      </Badge>
                    </TableCell>
	                    <TableCell className="py-3 text-right">
	                      <div className="flex items-center justify-end gap-1.5">
                          {cycleStatus === "Draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs rounded-md"
                              onClick={() => openAdjustmentDialog(payslip)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Adjust
                            </Button>
                          )}
	                        <Button
	                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-md"
                          onClick={() => setViewPayslip(payslip)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Payslip
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </>
        )}
	      </CardContent>
	    </Card>
      <Dialog open={!!adjustingPayslip} onOpenChange={(open) => !open && setAdjustingPayslip(null)}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="text-base">Adjust Draft Payslip</DialogTitle>
            <DialogDescription className="text-xs">
              {adjustingPayslip?.name} · {selectedMonth}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 text-xs">
            <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">Partial Pay Period</p>
                  <p className="text-[11px] text-muted-foreground">Use this for half-month or custom date-range salary payment.</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {getDaysInSelectedMonth()} days
                </Badge>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-2 mb-3 border-b border-border/40 pb-2">
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
                  onClick={() => setProrationMode("dateRange")}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md transition-colors",
                    prorationMode === "dateRange"
                      ? "bg-primary text-primary-foreground font-medium"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  By Calendar Dates
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
                  Exact Paid Days
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                {prorationMode === "dayRange" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="partial-start-day" className="text-xs">Start Day</Label>
                      <Input
                        id="partial-start-day"
                        type="number"
                        min="1"
                        max={getDaysInSelectedMonth()}
                        value={partialStartDay}
                        onChange={(event) => setPartialStartDay(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="partial-end-day" className="text-xs">End Day</Label>
                      <Input
                        id="partial-end-day"
                        type="number"
                        min="1"
                        max={getDaysInSelectedMonth()}
                        value={partialEndDay}
                        onChange={(event) => setPartialEndDay(event.target.value)}
                      />
                    </div>
                  </>
                )}

                {prorationMode === "dateRange" && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="partial-start-date" className="text-xs">Start Date</Label>
                      <Input
                        id="partial-start-date"
                        type="date"
                        min={`${selectedMonth}-01`}
                        max={`${selectedMonth}-${getDaysInSelectedMonth()}`}
                        value={partialStartDate}
                        onChange={(event) => setPartialStartDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="partial-end-date" className="text-xs">End Date</Label>
                      <Input
                        id="partial-end-date"
                        type="date"
                        min={`${selectedMonth}-01`}
                        max={`${selectedMonth}-${getDaysInSelectedMonth()}`}
                        value={partialEndDate}
                        onChange={(event) => setPartialEndDate(event.target.value)}
                      />
                    </div>
                  </>
                )}

                {prorationMode === "paidDays" && (
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="custom-paid-days" className="text-xs">Number of Paid Days</Label>
                    <Input
                      id="custom-paid-days"
                      type="number"
                      min="1"
                      max={getDaysInSelectedMonth()}
                      value={customPaidDays}
                      onChange={(event) => setCustomPaidDays(event.target.value)}
                      placeholder="e.g. 10"
                    />
                  </div>
                )}

                <div className="rounded-md bg-background px-3 py-2 text-[11px] text-muted-foreground col-span-full sm:col-span-1 flex items-center">
                  {(() => {
                    const daysInMonth = getDaysInSelectedMonth()
                    let paidDays = 0
                    let errorMsg = ""

                    if (prorationMode === "dayRange") {
                      const startDay = parseDayInput(partialStartDay)
                      const endDay = parseDayInput(partialEndDay)
                      if (startDay > endDay) errorMsg = "End day must be after start day."
                      else paidDays = endDay - startDay + 1
                    } else if (prorationMode === "dateRange") {
                      if (!partialStartDate || !partialEndDate) {
                        errorMsg = "Please select start and end dates."
                      } else {
                        const start = new Date(partialStartDate)
                        const end = new Date(partialEndDate)
                        if (start > end) {
                          errorMsg = "End date must be after start date."
                        } else {
                          paidDays = end.getDate() - start.getDate() + 1
                        }
                      }
                    } else if (prorationMode === "paidDays") {
                      const days = Math.trunc(Number(customPaidDays || 0))
                      if (isNaN(days) || days <= 0) {
                        errorMsg = "Please enter valid number of days."
                      } else if (days > daysInMonth) {
                        errorMsg = `Days cannot exceed ${daysInMonth}.`
                      } else {
                        paidDays = days
                      }
                    }

                    if (errorMsg) return <span className="text-rose-500">{errorMsg}</span>

                    const unpaidDays = daysInMonth - paidDays
                    const baseNetPay = adjustingPayslip ? Math.max(0, adjustingPayslip.netPay - existingManualImpact) : 0
                    const deductionAmount = Math.round((baseNetPay / daysInMonth) * unpaidDays)
                    return `${paidDays} paid day(s), ${unpaidDays} unpaid day(s), deduction ${formatCurrency(deductionAmount)}`
                  })()}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyPartialPayPeriod}
                  disabled={(() => {
                    const daysInMonth = getDaysInSelectedMonth()
                    if (prorationMode === "dayRange") {
                      return parseDayInput(partialStartDay) > parseDayInput(partialEndDay)
                    } else if (prorationMode === "dateRange") {
                      if (!partialStartDate || !partialEndDate) return true
                      return new Date(partialStartDate) > new Date(partialEndDate)
                    } else if (prorationMode === "paidDays") {
                      const days = Number(customPaidDays)
                      return isNaN(days) || days <= 0 || days > daysInMonth
                    }
                    return true
                  })()}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Apply
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/40 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="adjustment-title" className="text-xs">Title</Label>
                  <Input
                    id="adjustment-title"
                    value={adjustmentTitle}
                    onChange={(event) => setAdjustmentTitle(event.target.value)}
                    placeholder="Arrear, allowance correction, salary advance"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAddAdjustmentItem()
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adjustment-amount" className="text-xs">Amount</Label>
                  <Input
                    id="adjustment-amount"
                    type="number"
                    min="0"
                    value={adjustmentAmount}
                    onChange={(event) => setAdjustmentAmount(event.target.value)}
                    placeholder="0"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleAddAdjustmentItem()
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adjustment-type" className="text-xs">Type</Label>
                  <select
                    id="adjustment-type"
                    value={adjustmentType}
                    onChange={(event) => setAdjustmentType(event.target.value as AdjustmentType)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    <option value="addition">Add</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </div>
                <Button
                  type="button"
                  onClick={handleAddAdjustmentItem}
                  disabled={!adjustmentTitle.trim() || parseMoneyInput(adjustmentAmount) <= 0}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border/40">
              <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
                <p className="font-semibold text-foreground">Adjustment Summary</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    adjustmentSummary.netChange >= 0
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  )}
                >
                  {adjustmentSummary.netChange >= 0 ? "+" : "-"}{formatCurrency(Math.abs(adjustmentSummary.netChange))}
                </Badge>
              </div>

              {adjustmentItems.length === 0 ? (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  Add one or more adjustment rows before saving.
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {adjustmentItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.title}</p>
                        <p
                          className={cn(
                            "text-[10px] font-semibold uppercase",
                            item.type === "addition" ? "text-emerald-600" : "text-rose-600"
                          )}
                        >
                          {item.type === "addition" ? "Addition" : "Deduction"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "font-semibold",
                          item.type === "addition" ? "text-emerald-600" : "text-rose-600"
                        )}
                      >
                        {item.type === "addition" ? "+" : "-"}{formatCurrency(item.amount)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveAdjustmentItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2 rounded-md border border-border/40 bg-muted/20 p-3 text-[11px] text-muted-foreground sm:grid-cols-4">
              <div>
                <p className="font-medium">Current Net</p>
                <p className="font-semibold text-foreground">{adjustingPayslip ? formatCurrency(adjustingPayslip.netPay) : "—"}</p>
              </div>
              <div>
                <p className="font-medium">Total Add</p>
                <p className="font-semibold text-emerald-600">+{formatCurrency(adjustmentSummary.additions)}</p>
              </div>
              <div>
                <p className="font-medium">Total Deduction</p>
                <p className="font-semibold text-rose-600">-{formatCurrency(adjustmentSummary.deductions)}</p>
              </div>
              <div>
                <p className="font-medium">Adjusted Net</p>
                <p className="font-semibold text-foreground">{adjustingPayslip ? formatCurrency(adjustmentSummary.projectedNet) : "—"}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingPayslip(null)} disabled={updateAdjustmentsMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustments} disabled={updateAdjustmentsMutation.isPending} className="gap-1.5">
              {updateAdjustmentsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Adjustments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
