import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Gift, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Payslip } from "@/hooks/usePayroll"

interface PayrollProcessingTabProps {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  cycleStatus: string
  payslipsList: Payslip[]
  formatCurrency: (amount: number) => string
  handleOpenBonus: (payslip: Payslip) => void
  setViewPayslip: (payslip: Payslip | null) => void
}

export function PayrollProcessingTab({
  selectedMonth,
  setSelectedMonth,
  cycleStatus,
  payslipsList,
  formatCurrency,
  handleOpenBonus,
  setViewPayslip,
}: PayrollProcessingTabProps) {
  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold">Monthly Compensation Ledger</CardTitle>
          <CardDescription className="text-xs">
            Configure bonuses during draft status and view disbursement statuses.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
          >
            <option value="2026-06">June 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold py-1 px-2.5",
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
            {payslipsList.map((payslip) => (
              <TableRow key={payslip.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <TableCell className="py-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{payslip.name}</p>
                    <p className="text-[10px] text-muted-foreground">{payslip.role}</p>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
