import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, Eye, FileSpreadsheet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/types/salary"
import { exportToCsv } from "@/lib/export"

interface PayrollProcessingTabProps {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  cycleStatus: string
  payslipsList: Payslip[]
  formatCurrency: (amount: number) => string
  handleOpenBonus: (payslip: Payslip) => void
  setViewPayslip: (payslip: Payslip | null) => void
  monthsOptions: Array<{ key: string; label: string }>
  isLoading?: boolean
}

export function PayrollProcessingTab({
  selectedMonth,
  setSelectedMonth,
  cycleStatus,
  payslipsList,
  formatCurrency,
  handleOpenBonus,
  setViewPayslip,
  monthsOptions,
  isLoading,
}: PayrollProcessingTabProps) {

  const handleExport = () => {
    const headers = [
      "Employee Name",
      "Role",
      "Basic Salary",
      "Tenure Bonus",
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
      p.festivalBonusAmount,
      p.bonusAmount,
      p.bonusDescription,
      p.allowanceHra + p.allowanceTransport + p.allowanceMedical,
      p.deductionTax + p.deductionPf,
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
                  Tenure Bonus
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Bonus
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
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
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
                    <TableCell className="py-3 text-xs text-emerald-600 font-semibold">
                      {payslip.festivalBonusAmount > 0 ? `+${formatCurrency(payslip.festivalBonusAmount)}` : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs">
                      {payslip.bonusAmount > 0 ? (
                        <div className="space-y-0.5">
                          <span className="text-emerald-600 font-bold">+{formatCurrency(payslip.bonusAmount)}</span>
                          <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                            {payslip.bonusDescription}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-emerald-600 font-semibold">
                      +{formatCurrency(payslip.allowanceHra + payslip.allowanceTransport + payslip.allowanceMedical)}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-rose-500 font-semibold">
                      -{formatCurrency(payslip.deductionTax + payslip.deductionPf)}
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
                            className="h-7 text-[10px] gap-1"
                            onClick={() => handleOpenBonus(payslip)}
                          >
                            <Gift className="h-3 w-3" />
                            Configure Bonus
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
        )}
      </CardContent>
    </Card>
  )
}
