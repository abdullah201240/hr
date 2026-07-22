import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Coins,
  FileSpreadsheet,
  Settings,
  CheckCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import {
  usePayrollCycleQuery,
  useUnlockPayrollMutation,
  useDisburseMutation,
  useSyncPayrollMutation,
  usePfBalancesQuery,
  useSubmitPayrollMutation,
  useBulkApprovePayrollMutation,
  type Payslip,
} from "@/hooks/usePayroll"
import { useProvidentFundSettingsQuery, useUpdateProvidentFundSettingsMutation } from "@/hooks/useProvidentFund"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { usePermissions } from "@/hooks/usePermissions"
import {
  useEmployeeSalariesQuery,
} from "@/hooks/useSalary"
import { PayrollProcessingTab } from "@/components/payroll/PayrollProcessingTab"
import { DetailedPayslipDialog } from "@/components/payroll/DetailedPayslipDialog"
import {
  SalaryDisbursementDialog,
  GlobalPfSetupDialog,
} from "@/components/payroll/PayrollActionDialogs"

export default function PayrollProcessingPage() {
  // Dynamic months list options based on current date, going 12 months backwards
  const monthsOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const key = `${year}-${month}`
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' })
      return { key, label }
    })
  }, [])

  // Selected payroll cycle month (default to current month)
  const [selectedMonth, setSelectedMonth] = useState(() => monthsOptions[0]?.key || "2026-06")

  // API Queries & Mutations
  const { data: cycle, isLoading: isCycleLoading } = usePayrollCycleQuery(selectedMonth)
  const { data: pfSettings } = useProvidentFundSettingsQuery()
  const { data: employeesData } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: pfBalances } = usePfBalancesQuery()

  // Full lookup for Provident Fund calculation details
  const { data: allSalariesData } = useEmployeeSalariesQuery({ limit: 1000, status: "active" })

  const unlockPayrollMutation = useUnlockPayrollMutation()
  const disburseMutation = useDisburseMutation()
  const syncPayrollMutation = useSyncPayrollMutation()
  const updatePfSettingsMutation = useUpdateProvidentFundSettingsMutation()
  const submitPayrollMutation = useSubmitPayrollMutation()
  const bulkApproveMutation = useBulkApprovePayrollMutation()
  const { hasPermission } = usePermissions()

  const employees = employeesData?.data || []

  // PF settings rates
  const empPfRate = pfSettings?.employeeContributionRate ?? 10
  const employerPfRate = pfSettings?.employerContributionRate ?? 10

  // Modal states
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [isPfConfigOpen, setIsPfConfigOpen] = useState(false)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)

  // Payout states
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  
  // Dynamic default payout date based on the last day of the selected month
  const getLastDayOfMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number)
    const d = new Date(year, month, 0)
    const lastDay = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    return `${d.getFullYear()}-${mm}-${lastDay}`
  }

  const [payoutDate, setPayoutDate] = useState(() => getLastDayOfMonth(selectedMonth))
  const [payoutRef, setPayoutRef] = useState("")

  // Edit PF rates local states
  const [localEmpPfRate, setLocalEmpPfRate] = useState(empPfRate)
  const [localEmployerPfRate, setLocalEmployerPfRate] = useState(employerPfRate)

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    setPayoutDate(getLastDayOfMonth(month))
  }

  const handleUnlockPayroll = () => {
    Swal.fire({
      title: "Unlock Payroll?",
      text: `Are you sure you want to unlock the payroll ledger for ${selectedMonth} and revert it back to Draft status?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Unlock",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        unlockPayrollMutation.mutate(selectedMonth, {
          onSuccess: () => {
            Swal.fire({
              title: "Payroll Unlocked!",
              text: `The payroll registers for ${selectedMonth} have been successfully reverted to Draft status.`,
              icon: "success",
              confirmButtonText: "Done",
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

  const handleSubmitForApproval = () => {
    Swal.fire({
      title: "Submit Payroll for Approval?",
      text: `Submit the monthly payroll calculations for ${selectedMonth} to Line Managers for verification?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        submitPayrollMutation.mutate(selectedMonth, {
          onSuccess: () => {
            Swal.fire({
              title: "Payroll Submitted!",
              text: `The payroll registers for ${selectedMonth} have been successfully submitted for Line Manager approval.`,
              icon: "success",
              confirmButtonText: "Done",
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

  const handleBulkApprove = () => {
    Swal.fire({
      title: "Bulk Approve Cycle?",
      text: `Are you sure you want to bulk approve all pending payslips under your stage for ${selectedMonth}?`,
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
              text: res.message || "All eligible payslips have been approved successfully.",
              icon: "success",
              confirmButtonText: "Done",
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
          setIsDisburseOpen(false)
          setPayoutRef("")
          Swal.fire({
            title: "Salaries Disbursed!",
            text: `Salaries for ${selectedMonth} have been successfully marked as PAID via ${payoutMethod}.`,
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
            },
          })
        },
      }
    )
  }

  const handleSyncLedger = () => {
    Swal.fire({
      title: "Recalculate and Sync Ledger?",
      text: "This will reset all payslips for this draft cycle to their base templates, discarding any manual adjustments. Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Sync",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        syncPayrollMutation.mutate(selectedMonth, {
          onSuccess: () => {
            Swal.fire({
              title: "Ledger Synchronized!",
              text: "Recalculated active employee metrics and pulled any new profile records.",
              icon: "success",
              confirmButtonText: "Done",
              buttonsStyling: false,
              customClass: {
                confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
              },
            })
          },
        })
      }
    })
  }

  const savePfSettings = () => {
    updatePfSettingsMutation.mutate(
      {
        employeeContributionRate: localEmpPfRate,
        employerContributionRate: localEmployerPfRate,
      },
      {
        onSuccess: () => {
          setIsPfConfigOpen(false)
          Swal.fire({
            title: "PF Setup Updated!",
            text: "Provident Fund matching and deduction percentages updated globally.",
            icon: "success",
            confirmButtonText: "Close",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground px-4 py-2 font-semibold rounded-md",
            },
          })
        },
      }
    )
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  // Calculate total monthly analytics
  const payslipsList = cycle?.payslips || []

  const totalNetPay = payslipsList.reduce((sum, p) => sum + p.netPay, 0)
  const totalAllowancesSum = payslipsList.reduce(
    (sum, p) => {
      const allowancesSum = p.allowances && Object.keys(p.allowances).length > 0
        ? Object.values(p.allowances).reduce((s, val) => s + (Number(val) || 0), 0)
        : p.allowanceHra + p.allowanceTransport + p.allowanceMedical;
      return sum + allowancesSum;
    },
    0
  )
  const totalDeductionsSum = payslipsList.reduce((sum, p) => {
    const deductionsSum = p.deductions && Object.keys(p.deductions).length > 0
      ? Object.values(p.deductions).reduce((s, val) => s + (Number(val) || 0), 0)
      : p.deductionTax + p.deductionPf;
    return sum + deductionsSum;
  }, 0)

  // Accrued PF calculation
  const getEmployeePfStats = (empId: string) => {
    const salRecord = allSalariesData?.data?.find((s) => s.employeeId === empId)
    const basic = salRecord?.basicSalary ?? 50000

    const balanceRecord = pfBalances?.find((b) => b.employeeId === empId)
    const totalPfEmployeeAccrued = balanceRecord ? Number(balanceRecord.totalPf) : 0
    const monthsContributed = balanceRecord ? Number(balanceRecord.monthsContributed) : 0

    const empContribution = Math.round(basic * (empPfRate / 100))
    const employerMatch = Math.round(basic * (employerPfRate / 100))
    
    const employerAccrued = totalPfEmployeeAccrued * (employerPfRate / (empPfRate || 10))
    const cumulativeTotal = Math.round(totalPfEmployeeAccrued + employerAccrued)

    return {
      basic,
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: cumulativeTotal,
      monthsActive: monthsContributed,
    }
  }

  const cycleStatus = cycle?.status || "Draft"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Payroll Processing Dashboard
          </h2>
          <p className="text-muted-foreground text-sm">Process monthly compensation, review active ledger cycles, and trigger approval requests.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => {
              setLocalEmpPfRate(empPfRate)
              setLocalEmployerPfRate(employerPfRate)
              setIsPfConfigOpen(true)
            }}
          >
            <Settings className="h-4 w-4" />
            PF Configuration
          </Button>
          {cycleStatus === "Draft" ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleSyncLedger} disabled={syncPayrollMutation.isPending}>
                <RefreshCw className={cn("h-3.5 w-3.5", syncPayrollMutation.isPending && "animate-spin")} />
                Sync Ledger
              </Button>
              <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSubmitForApproval} disabled={submitPayrollMutation.isPending}>
                <CheckCircle className="h-4 w-4" />
                Submit for Approval
              </Button>
            </div>
          ) : cycleStatus === "Awaiting_LM_Approval" ? (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded font-medium animate-pulse">
                Awaiting Line Manager Approval
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5 hover:text-amber-700"
                onClick={handleUnlockPayroll}
                disabled={unlockPayrollMutation.isPending}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", unlockPayrollMutation.isPending && "animate-spin")} />
                Unlock to Draft
              </Button>
              {hasPermission("payroll:approve_lm") && (
                <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
                  <CheckCircle className="h-4 w-4" />
                  Bulk Approve Subordinates
                </Button>
              )}
            </div>
          ) : cycleStatus === "Awaiting_MD_Approval" ? (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded font-medium animate-pulse">
                Awaiting MD Approval
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5 hover:text-amber-700"
                onClick={handleUnlockPayroll}
                disabled={unlockPayrollMutation.isPending}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", unlockPayrollMutation.isPending && "animate-spin")} />
                Unlock to Draft
              </Button>
              {hasPermission("payroll:approve_md") && (
                <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleBulkApprove} disabled={bulkApproveMutation.isPending}>
                  <CheckCircle className="h-4 w-4" />
                  Bulk Approve All (MD)
                </Button>
              )}
            </div>
          ) : cycleStatus === "Awaiting_Disbursement" ? (
            <div className="flex gap-2 items-center">
              <span className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded font-medium">
                Awaiting Disbursement
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-amber-500/30 text-amber-600 hover:bg-amber-500/5 hover:text-amber-700"
                onClick={handleUnlockPayroll}
                disabled={unlockPayrollMutation.isPending}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", unlockPayrollMutation.isPending && "animate-spin")} />
                Unlock to Draft
              </Button>
              {hasPermission("payroll:disburse") && (
                <Button size="sm" className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsDisburseOpen(true)}>
                  <CreditCard className="h-4 w-4" />
                  Disburse Salaries
                </Button>
              )}
            </div>
          ) : cycleStatus === "Disbursed" ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Salaries Disbursed
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              {cycleStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Stepper Pipeline Flow */}
      <div className="border border-border/40 bg-muted/10 p-4 rounded-xl flex flex-wrap items-center justify-around gap-4 text-xs">
        {/* Stage 1: Draft Ledger */}
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", 
            cycleStatus === "Draft" ? "bg-primary text-primary-foreground animate-pulse" : "bg-emerald-500 text-white"
          )}>
            {cycleStatus !== "Draft" ? "✓" : "1"}
          </Badge>
          <div>
            <p className="font-semibold">Draft Ledger</p>
            <p className="text-[10px] text-muted-foreground">Sync & adjust adjustments</p>
          </div>
        </div>
        <div className="hidden md:block h-[1px] w-8 bg-border" />

        {/* Stage 2: Line Manager Approval */}
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", 
            cycleStatus === "Awaiting_LM_Approval" 
              ? "bg-primary text-primary-foreground animate-pulse" 
              : ["Awaiting_MD_Approval", "Awaiting_Disbursement", "Disbursed"].includes(cycleStatus)
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
          )}>
            {["Awaiting_MD_Approval", "Awaiting_Disbursement", "Disbursed"].includes(cycleStatus) ? "✓" : "2"}
          </Badge>
          <div>
            <p className="font-semibold">Line Manager Approval</p>
            <p className="text-[10px] text-muted-foreground">Team attendance & KPI verify</p>
          </div>
        </div>
        <div className="hidden md:block h-[1px] w-8 bg-border" />

        {/* Stage 3: MD Approval */}
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", 
            cycleStatus === "Awaiting_MD_Approval" 
              ? "bg-primary text-primary-foreground animate-pulse" 
              : ["Awaiting_Disbursement", "Disbursed"].includes(cycleStatus)
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
          )}>
            {["Awaiting_Disbursement", "Disbursed"].includes(cycleStatus) ? "✓" : "3"}
          </Badge>
          <div>
            <p className="font-semibold">MD Approval</p>
            <p className="text-[10px] text-muted-foreground">High-level salary sign-off</p>
          </div>
        </div>
        <div className="hidden md:block h-[1px] w-8 bg-border" />

        {/* Stage 4: Disbursement */}
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", 
            cycleStatus === "Awaiting_Disbursement" 
              ? "bg-primary text-primary-foreground animate-pulse" 
              : cycleStatus === "Disbursed"
                ? "bg-emerald-500 text-white"
                : "bg-muted text-muted-foreground"
          )}>
            {cycleStatus === "Disbursed" ? "✓" : "4"}
          </Badge>
          <div>
            <p className="font-semibold">Disbursement</p>
            <p className="text-[10px] text-muted-foreground">Payout via Bank / Wallet</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Month Net Payable</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalNetPay)}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">{payslipsList.length} employees compensated</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cumulative PF Reserve</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency((employeesData?.data || []).reduce((acc, curr) => acc + getEmployeePfStats(curr.id).cumulative, 0))}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">{empPfRate}% Employee + {employerPfRate}% Match</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Allowances / Deductions</p>
              <div className="text-sm font-semibold mt-1">
                <span className="text-emerald-600">+{formatCurrency(totalAllowancesSum)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-rose-500">-{formatCurrency(totalDeductionsSum)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Taxes, PF, medical, HRA</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <PayrollProcessingTab
          selectedMonth={selectedMonth}
          setSelectedMonth={handleMonthChange}
          cycleStatus={cycleStatus}
          payslipsList={payslipsList}
          formatCurrency={formatCurrency}
          setViewPayslip={setViewPayslip}
          monthsOptions={monthsOptions}
          isLoading={isCycleLoading}
          employees={employees}
        />
      </div>

      <SalaryDisbursementDialog
        isOpen={isDisburseOpen}
        onClose={() => setIsDisburseOpen(false)}
        payoutMethod={payoutMethod}
        setPayoutMethod={setPayoutMethod}
        payoutDate={payoutDate}
        setPayoutDate={setPayoutDate}
        payoutRef={payoutRef}
        setPayoutRef={setPayoutRef}
        onExecute={handleExecuteDisbursement}
        isPending={disburseMutation.isPending}
      />

      <GlobalPfSetupDialog
        isOpen={isPfConfigOpen}
        onClose={() => setIsPfConfigOpen(false)}
        empPfRate={localEmpPfRate}
        setEmpPfRate={setLocalEmpPfRate}
        employerPfRate={localEmployerPfRate}
        setEmployerPfRate={setLocalEmployerPfRate}
        onSave={savePfSettings}
        isPending={updatePfSettingsMutation.isPending}
      />

      <DetailedPayslipDialog
        isOpen={viewPayslip !== null}
        onClose={() => setViewPayslip(null)}
        viewPayslip={viewPayslip}
        empPfRate={empPfRate}
        selectedMonth={selectedMonth}
        formatCurrency={formatCurrency}
      />
    </div>
  )
}
