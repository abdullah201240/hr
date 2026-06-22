import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/types/salary"
import { exportToCsv } from "@/lib/export"

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
      "Bonus",
      "Bonus Description",
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
      p.bonusAmount,
      p.bonusDescription,
      getPayslipAllowancesSum(p),
      getPayslipDeductionsSum(p),
      p.netPay,
      p.paymentStatus
    ])
    exportToCsv(`Payslips-${selectedMonth}`, headers, rows)
  }

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold">Monthly Compensation Ledger</CardTitle>
          <CardDescription className="text-xs">
            Configure bonuses during draft status and view disbursement statuses.
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
                        <div className="flex flex-wrap gap-1 items-center">
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                            {payslip.presentDays ?? 0} P
                          </Badge>
                          {(payslip.absentDays ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
                              {payslip.absentDays} A
                            </Badge>
                          )}
                          {(payslip.leaveDays ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
                              {payslip.leaveDays} Lv
                            </Badge>
                          )}
                          {(payslip.lateDays ?? 0) > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
                              {payslip.lateDays} Lt
                            </Badge>
                          )}
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
  )
}
