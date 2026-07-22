import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, CreditCard, AlertCircle, Loader2 } from "lucide-react"
import type { Payslip, PayrollCycle } from "@/types/salary"
import { usePermissions } from "@/hooks/usePermissions"
import { useDisburseMutation } from "@/hooks/usePayroll"
import Swal from "sweetalert2"

interface DisbursementTabProps {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  cycle: PayrollCycle | undefined
  formatCurrency: (amount: number) => string
  setViewPayslip: (payslip: Payslip | null) => void
  monthsOptions: Array<{ key: string; label: string }>
  isLoading?: boolean
  employees?: any[]
}

export function DisbursementTab({
  selectedMonth,
  setSelectedMonth,
  cycle,
  formatCurrency,
  setViewPayslip,
  monthsOptions,
  isLoading,
  employees = [],
}: DisbursementTabProps) {
  const { hasPermission } = usePermissions()
  const disburseMutation = useDisburseMutation()

  const payslipsList = cycle?.payslips || []
  const cycleStatus = cycle?.status || "Draft"

  // Filter payslips that are in Awaiting_Disbursement or Disbursed status
  const eligiblePayslips = useMemo(() => {
    return payslipsList.filter((p) => p.status === "Awaiting_Disbursement" || p.status === "Disbursed")
  }, [payslipsList])

  // Disbursement Form local states
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  
  const getLastDayOfMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number)
    if (!year || !month) return ""
    const d = new Date(year, month, 0)
    const lastDay = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${lastDay}`
  }

  const [payoutDate, setPayoutDate] = useState(() => getLastDayOfMonth(selectedMonth))
  const [payoutRef, setPayoutRef] = useState("")

  useEffect(() => {
    setPayoutDate(getLastDayOfMonth(selectedMonth))
  }, [selectedMonth])

  const handleExecuteDisbursement = () => {
    if (!payoutRef.trim()) {
      Swal.fire("Error", "Please provide a transaction reference ID", "error")
      return
    }

    disburseMutation.mutate(
      {
        monthKey: selectedMonth,
        paymentMethod: payoutMethod,
        referenceId: payoutRef.trim(),
        disbursementDate: payoutDate,
      },
      {
        onSuccess: () => {
          setPayoutRef("")
          Swal.fire({
            title: "Salaries Disbursed!",
            text: `Salaries for ${selectedMonth} have been successfully marked as PAID via ${payoutMethod}.`,
            icon: "success",
            confirmButtonText: "Close",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
            },
          })
        },
      }
    )
  }

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

  return (
    <div className="space-y-6">
      {cycleStatus === "Awaiting_Disbursement" && hasPermission("payroll:disburse") && (
        <Card className="shadow-none border-border/40 bg-muted/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Disbursement Details
            </CardTitle>
            <CardDescription className="text-xs">
              Provide disbursement transaction values to record salary settlement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
              <div className="space-y-1.5 text-xs">
                <Label htmlFor="disburse-method">Payment Method</Label>
                <select
                  id="disburse-method"
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="disburse-date">Disbursement Date</Label>
                <Input
                  id="disburse-date"
                  type="date"
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="disburse-ref">Transaction Reference / ID</Label>
                <Input
                  id="disburse-ref"
                  placeholder="e.g. TXN-1004928"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                />
              </div>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full h-10 text-xs"
                onClick={handleExecuteDisbursement}
                disabled={disburseMutation.isPending}
              >
                {disburseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Execute Disbursement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold">Accounts Disbursement Portal</CardTitle>
            <CardDescription className="text-xs">
              Settle final payments for approved payroll batches.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading disbursement portal...</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Basic Salary</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Allowances</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Deductions</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Net Payable</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right w-36">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligiblePayslips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      No approved payslips are awaiting disbursement for this month.
                    </TableCell>
                  </TableRow>
                ) : (
                  eligiblePayslips.map((payslip) => {
                    const empInfo = employees.find((e) => e.id === payslip.employeeId)
                    const managerName = empInfo?.lineManagerId ? employees.find(e => e.id === empInfo.lineManagerId)?.fullNameEnglish : null

                    return (
                      <TableRow key={payslip.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{payslip.name}</p>
                            <p className="text-[10px] text-muted-foreground">{payslip.designationName}</p>
                            {managerName && (
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                Manager: <span className="font-medium">{managerName}</span>
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                          {formatCurrency(payslip.basicSalary)}
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
                          {payslip.status === "Disbursed" ? (
                            <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              Disbursed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-blue-500/10 text-blue-600 border-blue-500/20">
                              Awaiting Disbursement
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-md"
                            onClick={() => setViewPayslip(payslip)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Payslip
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
