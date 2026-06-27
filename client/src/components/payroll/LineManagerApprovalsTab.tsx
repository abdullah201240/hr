import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { Payslip, PayrollCycle } from "@/types/salary"
import { useAuthStore } from "@/store/useAuthStore"
import { useApprovePayslipMutation, useRejectPayslipMutation, useBulkApprovePayrollMutation } from "@/hooks/usePayroll"
import Swal from "sweetalert2"

interface LineManagerApprovalsTabProps {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  cycle: PayrollCycle | undefined
  formatCurrency: (amount: number) => string
  setViewPayslip: (payslip: Payslip | null) => void
  monthsOptions: Array<{ key: string; label: string }>
  isLoading?: boolean
  employees?: any[]
}

export function LineManagerApprovalsTab({
  selectedMonth,
  setSelectedMonth,
  cycle,
  formatCurrency,
  setViewPayslip,
  monthsOptions,
  isLoading,
  employees = [],
}: LineManagerApprovalsTabProps) {
  const { user } = useAuthStore()
  const approvePayslipMutation = useApprovePayslipMutation()
  const rejectPayslipMutation = useRejectPayslipMutation()
  const bulkApproveMutation = useBulkApprovePayrollMutation()

  const payslipsList = cycle?.payslips || []

  // Filter payslips that are in Awaiting_LM_Approval status
  // and the logged-in user is the line manager of the employee.
  const eligiblePayslips = useMemo(() => {
    return payslipsList.filter((p) => {
      if (p.status !== "Awaiting_LM_Approval") return false
      const empInfo = employees.find((e) => e.id === p.employeeId)
      return empInfo?.lineManagerId === user?.id
    })
  }, [payslipsList, employees, user])

  const handleApprovePayslip = (payslip: Payslip) => {
    Swal.fire({
      title: "Approve Payslip?",
      text: `Are you sure you want to approve the payslip for ${payslip.name}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        approvePayslipMutation.mutate(
          { payslipId: payslip.id, monthKey: selectedMonth },
          {
            onSuccess: () => {
              Swal.fire({
                title: "Approved!",
                text: `Successfully approved payslip for ${payslip.name}.`,
                icon: "success",
                confirmButtonText: "Close",
                buttonsStyling: false,
                customClass: {
                  confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2",
                },
              })
            },
          }
        )
      }
    })
  }

  const handleRejectPayslip = (payslip: Payslip) => {
    Swal.fire({
      title: "Reject Payslip?",
      text: `Please enter a mandatory rejection comment/reason for ${payslip.name}'s payslip:`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
      confirmButtonText: "Reject Payslip",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "You must enter a reason for rejection!"
        }
        return null
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        rejectPayslipMutation.mutate(
          { payslipId: payslip.id, comment: result.value.trim(), monthKey: selectedMonth },
          {
            onSuccess: () => {
              Swal.fire({
                title: "Rejected",
                text: `Successfully rejected and sent payslip for ${payslip.name} back to Draft.`,
                icon: "success",
                confirmButtonText: "Close",
                buttonsStyling: false,
                customClass: {
                  confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2",
                },
              })
            },
          }
        )
      }
    })
  }

  const handleBulkApprove = () => {
    Swal.fire({
      title: "Bulk Approve Subordinates?",
      text: `Are you sure you want to approve all pending subordinate payslips for ${selectedMonth}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve All",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        bulkApproveMutation.mutate(selectedMonth, {
          onSuccess: (res) => {
            Swal.fire({
              title: "Bulk Approved!",
              text: res.message || "All subordinate payslips approved successfully.",
              icon: "success",
              confirmButtonText: "Close",
              buttonsStyling: false,
              customClass: {
                confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2",
              },
            })
          },
        })
      }
    })
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
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            Line Manager Approval Queue
          </CardTitle>
          <CardDescription className="text-xs">
            Review and approve payroll logs for subordinates before MD sign-off.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {eligiblePayslips.length > 0 && (
            <Button
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Bulk Approve All Subordinates
            </Button>
          )}

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
            <span className="text-xs text-muted-foreground">Loading approvals...</span>
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
                    No pending payslips require your Line Manager approval for this month.
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
                        <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                          Awaiting LM Approval
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 mr-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 rounded-md px-2"
                            onClick={() => handleApprovePayslip(payslip)}
                            disabled={approvePayslipMutation.isPending || rejectPayslipMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-semibold bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 rounded-md px-2"
                            onClick={() => handleRejectPayslip(payslip)}
                            disabled={approvePayslipMutation.isPending || rejectPayslipMutation.isPending}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-md"
                            onClick={() => setViewPayslip(payslip)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
  )
}
