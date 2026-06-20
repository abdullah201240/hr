import { useState } from "react"
import { useSearchParams } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Coins,
  FileSpreadsheet,
  Settings,
  Eye,
  CheckCircle,
  Printer,
  Gift,
  CreditCard,
  History,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import {
  usePayrollCycleQuery,
  useUpdatePayslipBonusMutation,
  useProcessPayrollMutation,
  useDistributePayrollMutation,
  useDisburseMutation,
  useDisbursementsQuery,
  useSyncPayrollMutation,
  type Payslip,
} from "@/hooks/usePayroll"
import { useProvidentFundSettingsQuery, useUpdateProvidentFundSettingsMutation } from "@/hooks/useProvidentFund"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import {
  useEmployeeSalariesQuery,
  useSalaryTemplatesQuery,
  useAssignEmployeeSalaryMutation,
} from "@/hooks/useSalary"
import { useFestivalBonusRulesQuery } from "@/hooks/useFestivalBonus"
import EmployeeSalaryTab from "@/components/payroll/EmployeeSalaryTab"
import BonusTab from "@/components/payroll/BonusTab"

export default function PayrollPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "processing"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  // Selected payroll cycle month
  const [selectedMonth, setSelectedMonth] = useState("2026-06")

  // API Queries & Mutations
  const { data: cycle, isLoading: isCycleLoading } = usePayrollCycleQuery(selectedMonth)
  const { data: pfSettings, isLoading: isPfLoading } = useProvidentFundSettingsQuery()
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: salariesData, isLoading: salariesLoading } = useEmployeeSalariesQuery()
  const { data: disbursements = [], isLoading: isDisbursementsLoading } = useDisbursementsQuery()
  const { data: templates = [] } = useSalaryTemplatesQuery()
  const { data: festivalBonusRules = [] } = useFestivalBonusRulesQuery()

  const updateBonusMutation = useUpdatePayslipBonusMutation()
  const processPayrollMutation = useProcessPayrollMutation()
  const distributePayrollMutation = useDistributePayrollMutation()
  const disburseMutation = useDisburseMutation()
  const syncPayrollMutation = useSyncPayrollMutation()
  const updatePfSettingsMutation = useUpdateProvidentFundSettingsMutation()
  const assignSalaryMutation = useAssignEmployeeSalaryMutation()

  const employees = employeesData?.data || []

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "EM"

  // PF settings
  const empPfRate = pfSettings?.employeeContributionRate ?? 10
  const employerPfRate = pfSettings?.employerContributionRate ?? 10

  // Modal states
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [isPfConfigOpen, setIsPfConfigOpen] = useState(false)
  const [editingPayslipId, setEditingPayslipId] = useState("")
  const [isBonusOpen, setIsBonusOpen] = useState(false)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)

  // Edit bonus states
  const [bonusVal, setBonusVal] = useState(0)
  const [bonusReason, setBonusReason] = useState("")

  // Payout states
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  const [payoutDate, setPayoutDate] = useState("2026-06-30")
  const [payoutRef, setPayoutRef] = useState("")

  // Edit PF rates local states
  const [localEmpPfRate, setLocalEmpPfRate] = useState(empPfRate)
  const [localEmployerPfRate, setLocalEmployerPfRate] = useState(employerPfRate)

  const handleOpenBonus = (payslip: Payslip) => {
    setBonusVal(payslip.bonusAmount || 0)
    setBonusReason(payslip.bonusDescription || "")
    setEditingPayslipId(payslip.id)
    setIsBonusOpen(true)
  }

  const handleSaveBonus = () => {
    updateBonusMutation.mutate(
      {
        monthKey: selectedMonth,
        payslipId: editingPayslipId,
        bonusAmount: bonusVal,
        bonusDescription: bonusReason,
      },
      {
        onSuccess: () => {
          setIsBonusOpen(false)
          Swal.fire({
            title: "Bonus Saved!",
            text: "Bonus allocations and net payable amounts updated.",
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

  const handleRunPayroll = () => {
    Swal.fire({
      title: "Lock and Process Payroll?",
      text: `Are you sure you want to finalize and lock the monthly payroll calculation ledger for ${selectedMonth}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Process",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        processPayrollMutation.mutate(selectedMonth, {
          onSuccess: () => {
            Swal.fire({
              title: "Payroll Processed!",
              text: `The payroll registers for ${selectedMonth} have been successfully calculated. You can now distribute salaries.`,
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

  const handleDistributePayslips = () => {
    distributePayrollMutation.mutate(selectedMonth, {
      onSuccess: () => {
        Swal.fire({
          title: "Payslips Distributed!",
          text: `Payslips for ${selectedMonth} have been distributed to employee portals.`,
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

  const handleSyncLedger = () => {
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
    (sum, p) =>
      sum + p.allowanceHra + p.allowanceTransport + p.allowanceMedical + p.bonusAmount + p.festivalBonusAmount,
    0
  )
  const totalDeductionsSum = payslipsList.reduce((sum, p) => sum + p.deductionTax + p.deductionPf, 0)

  // Calculate PF balances based on historic payrolls & join duration seed
  const activeEmployees = employeesData?.data || []
  const getEmployeePfStats = (empId: string, joinDate?: string) => {
    const salRecord = salariesData?.find((s) => s.employeeId === empId)
    const basic = salRecord?.basicSalary ?? 50000

    const joinDateObj = joinDate ? new Date(joinDate) : new Date("2023-01-01")
    const today = new Date()
    const diffMonths = (today.getFullYear() - joinDateObj.getFullYear()) * 12 + today.getMonth() - joinDateObj.getMonth()
    const months = Math.max(1, diffMonths)

    const empContribution = Math.round(basic * (empPfRate / 100))
    const employerMatch = Math.round(basic * (employerPfRate / 100))
    const monthlyTotal = empContribution + employerMatch
    const cumulativeTotal = monthlyTotal * months

    return {
      basic,
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: cumulativeTotal,
      monthsActive: months,
    }
  }

  if (isCycleLoading || isPfLoading || isDisbursementsLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading enterprise payroll ledger...</p>
      </div>
    )
  }

  const cycleStatus = cycle?.status || "Draft"

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Payroll & Benefits
          </h2>
          <p className="text-muted-foreground">Process monthly employee compensation, allocate bonuses, and disburse payments</p>
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
              <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRunPayroll}>
                <CheckCircle className="h-4 w-4" />
                Finalize Payroll
              </Button>
            </div>
          ) : cycleStatus === "Processed" ? (
            <div className="flex gap-2">
              <Button size="sm" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleDistributePayslips}>
                Distribute Payslips
              </Button>
              <Button size="sm" className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsDisburseOpen(true)}>
                <CreditCard className="h-4 w-4" />
                Disburse Salaries
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Salaries Disbursed
            </Badge>
          )}
        </div>
      </div>

      {/* Stepper Pipeline Flow */}
      <div className="border border-border/40 bg-muted/10 p-4 rounded-xl flex items-center justify-around text-xs">
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", cycleStatus === "Draft" ? "bg-primary text-primary-foreground" : "bg-emerald-500 text-white")}>
            {cycleStatus !== "Draft" ? "✓" : "1"}
          </Badge>
          <div>
            <p className="font-semibold">Draft Register</p>
            <p className="text-[10px] text-muted-foreground">Adjust bonuses & sync</p>
          </div>
        </div>
        <div className="h-[1px] w-12 bg-border" />
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", cycleStatus === "Processed" ? "bg-primary text-primary-foreground" : cycleStatus === "Distributed" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>
            {cycleStatus === "Distributed" ? "✓" : "2"}
          </Badge>
          <div>
            <p className="font-semibold">Locked & Processed</p>
            <p className="text-[10px] text-muted-foreground">Verify exact math</p>
          </div>
        </div>
        <div className="h-[1px] w-12 bg-border" />
        <div className="flex items-center gap-2">
          <Badge className={cn("h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-xs", cycleStatus === "Distributed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            3
          </Badge>
          <div>
            <p className="font-semibold">Disbursed Payout</p>
            <p className="text-[10px] text-muted-foreground">Released to bank/wallet</p>
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
                {formatCurrency(activeEmployees.reduce((acc, curr) => acc + getEmployeePfStats(curr.id, curr.joinDate).cumulative, 0))}
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
              <p className="text-xs text-muted-foreground">Allowances + Bonuses</p>
              <div className="text-sm font-semibold mt-1">
                <span className="text-emerald-600">+{formatCurrency(totalAllowancesSum)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-rose-500">-{formatCurrency(totalDeductionsSum)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Taxes, medical, bonuses, HRA</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-[800px] grid-cols-5 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="overview" className="text-xs">Employee Salary</TabsTrigger>
          <TabsTrigger value="processing" className="text-xs">Payroll Processing</TabsTrigger>
          <TabsTrigger value="bonus" className="text-xs">Bonus Setup</TabsTrigger>
          <TabsTrigger value="pf" className="text-xs">Provident Fund (PF)</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Disbursement Logs</TabsTrigger>
        </TabsList>

        {/* TAB 1: PAYROLL PROCESSING */}
        <TabsContent value="processing" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Monthly Compensation Ledger</CardTitle>
                <CardDescription className="text-xs">Configure bonuses during draft status and view disbursement statuses.</CardDescription>
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
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Basic Salary</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Tenure Bonus</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Bonus</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Allowances</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Deductions</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Net Payable</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Payout Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-36">Action</TableHead>
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
                            <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{payslip.bonusDescription}</p>
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
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold py-0.5 px-2",
                          payslip.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}>
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
        </TabsContent>

        {/* TAB 2: PF MANAGEMENT */}
        <TabsContent value="pf" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Provident Fund Ledger & Reserves</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of statutory retirement reserves and accumulated balances.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Name</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Basic Salary</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Share ({empPfRate}%)</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employer Match ({employerPfRate}%)</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Tenure Seed</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Accrued PF Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEmployees.map((emp) => {
                    const stats = getEmployeePfStats(emp.id, emp.joinDate)
                    return (
                      <TableRow key={emp.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{emp.fullNameEnglish}</p>
                            <p className="text-[10px] text-muted-foreground">Joined {emp.joinDate || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-semibold">
                          {formatCurrency(stats.basic)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-foreground font-medium">
                          {formatCurrency(stats.monthlyEmp)}/mo
                        </TableCell>
                        <TableCell className="py-3 text-xs text-foreground font-medium">
                          {formatCurrency(stats.monthlyEmployer)}/mo
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {stats.monthsActive} months
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">
                          {formatCurrency(stats.cumulative)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DISBURSEMENT LOGS */}
        <TabsContent value="logs" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" />
                Salary Disbursement Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                Audit history of completed monthly payouts and distribution networks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {disbursements.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Payout Month</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Disbursement Date</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Method</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Transaction Reference</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employees</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Total Disbursed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.map((rec) => (
                      <TableRow key={rec.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3 text-xs font-semibold">{rec.monthKey}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{rec.disbursementDate}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-[10px] font-bold">{rec.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">{rec.referenceId}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{rec.employeeCount} officers</TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">{formatCurrency(rec.totalDisbursed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No disbursement records logged yet</p>
                  <p className="text-xs">Once you process and execute payouts on a month cycle, they will be logged here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: EMPLOYEE SALARY OVERVIEW */}
        <TabsContent value="overview" className="outline-none">
          <EmployeeSalaryTab
            templates={templates}
            employeeSalaries={salariesData || []}
            employees={employees}
            salariesLoading={salariesLoading}
            employeesDataLoading={employeesLoading}
            assignSalaryMutation={assignSalaryMutation}
            pfSettings={pfSettings}
            formatCurrency={formatCurrency}
            getInitials={getInitials}
          />
        </TabsContent>

        {/* TAB 5: BONUS SETUP */}
        <TabsContent value="bonus" className="outline-none">
          <BonusTab
            festivalBonusRules={festivalBonusRules}
            employees={employees}
            employeeSalaries={salariesData || []}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* Configure Employee Bonus Dialog */}
      <Dialog open={isBonusOpen} onOpenChange={setIsBonusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Configure Special Bonus</DialogTitle>
            <DialogDescription className="text-xs">Allocate performance or festival incentives for this employee's draft payslip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bonus Amount (৳)</Label>
              <Input
                type="number"
                value={bonusVal}
                onChange={(e) => setBonusVal(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason / Description</Label>
              <Input
                placeholder="e.g. Q2 Performance Bonus, Festival Incentive"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBonusOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSaveBonus} className="text-xs" disabled={updateBonusMutation.isPending}>
              {updateBonusMutation.isPending ? "Saving..." : "Save Allocation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Disbursement Dialog */}
      <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Distribute & Disburse Salaries</DialogTitle>
            <DialogDescription className="text-xs">Configure payout distribution parameters to mark ledger as PAID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Distribution Method</Label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full bg-background border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                <option value="Bank Transfer">Bank Transfer (EFT/Wire)</option>
                <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
                <option value="Cash Payment">Cash Payment</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Disbursement Date</Label>
              <Input
                type="date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Transaction Reference / Voucher ID</Label>
              <Input
                placeholder="e.g. TXN98724128"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDisburseOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleExecuteDisbursement} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none" disabled={disburseMutation.isPending}>
              {disburseMutation.isPending ? "Executing..." : "Execute Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global PF Configuration Dialog */}
      <Dialog open={isPfConfigOpen} onOpenChange={setIsPfConfigOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Global PF Setup</DialogTitle>
            <DialogDescription className="text-xs">Adjust percentage values for retirement Provident Fund allocations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employee Contribution (%)</Label>
              <Input
                type="number"
                value={localEmpPfRate}
                onChange={(e) => setLocalEmpPfRate(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employer Match Rate (%)</Label>
              <Input
                type="number"
                value={localEmployerPfRate}
                onChange={(e) => setLocalEmployerPfRate(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsPfConfigOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={savePfSettings} className="text-xs" disabled={updatePfSettingsMutation.isPending}>
              {updatePfSettingsMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Payslip View Dialog */}
      <Dialog open={viewPayslip !== null} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {viewPayslip && (
            <>
              <DialogHeader className="print:hidden">
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Pay Slip Ledger</span>
                  <span className="text-[10px] text-muted-foreground mr-4">Period: {selectedMonth}</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold tracking-wider text-primary">Sadoshima Global Corp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 border-t border-b border-border/40 py-4 text-xs print:border-none print:py-0">
                {/* Print layout branding */}
                <div className="hidden print:block text-center space-y-1 pb-4 border-b border-border">
                  <h1 className="text-lg font-extrabold uppercase tracking-widest text-foreground">Sadoshima Global Corp</h1>
                  <p className="text-[10px] text-muted-foreground">CONFIDENTIAL OFFICER SALARY PAYSLIP STATEMENT</p>
                  <p className="text-[11px] font-bold">Salary Period: {selectedMonth}</p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 print:bg-transparent print:border print:border-border p-3 rounded-lg print:rounded-none">
                  <div>
                    <p className="text-[10px] text-muted-foreground print:text-foreground">Employee Name</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground print:text-foreground">Designation</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.role}</p>
                  </div>
                </div>

                {/* Earnings and deductions lists */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Earnings */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">Earnings</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Basic Salary:</span><span className="font-semibold">{formatCurrency(viewPayslip.basicSalary)}</span></div>
                      <div className="flex justify-between"><span>HRA Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceHra)}</span></div>
                      <div className="flex justify-between"><span>Transport Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceTransport)}</span></div>
                      <div className="flex justify-between"><span>Medical Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceMedical)}</span></div>
                      {viewPayslip.festivalBonusAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Tenure Bonus:</span>
                          <span>{formatCurrency(viewPayslip.festivalBonusAmount)}</span>
                        </div>
                      )}
                      {viewPayslip.bonusAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Bonus ({viewPayslip.bonusDescription}):</span>
                          <span>{formatCurrency(viewPayslip.bonusAmount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">Deductions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Income Tax:</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionTax)}</span></div>
                      <div className="flex justify-between"><span>PF Contribution ({empPfRate}%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionPf)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Calculation Proof Details Section */}
                <div className="p-3 bg-muted/10 border border-border/40 rounded-lg space-y-1.5 print:hidden">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <span>CALCULATION PROOF (AUDIT TRAIL)</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-1">
                    <p>• Basic Salary calculated dynamically from assigned employee profile template component policies.</p>
                    <p>• Festival Bonus computed against Tenure rules based on Join Date ({viewPayslip.joinDate || "N/A"}).</p>
                    <p>• PF matching rate calculated at standard matching ({empPfRate}% employee share).</p>
                  </div>
                </div>

                {/* Disbursement info if paid */}
                {viewPayslip.paymentStatus === "Paid" && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1 print:border-none print:bg-transparent">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wide">Payout Disbursement Info</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div><span className="font-medium text-foreground">Date:</span> {viewPayslip.paymentDate}</div>
                      <div><span className="font-medium text-foreground">Method:</span> {viewPayslip.paymentMethod}</div>
                      <div className="col-span-2"><span className="font-medium text-foreground">Reference:</span> <span className="font-mono">{viewPayslip.paymentReference}</span></div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border/40 flex justify-between items-center text-sm">
                  <span className="font-bold text-foreground">Net Pay Distribution:</span>
                  <span className="text-xl font-extrabold text-primary">{formatCurrency(viewPayslip.netPay)}</span>
                </div>

                {/* Print layout signature footer */}
                <div className="hidden print:flex justify-between pt-16 text-[10px]">
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p className="font-semibold">Officer Signature</p>
                  </div>
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p className="font-semibold">HR Director / Auditor</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="print:hidden">
                <Button variant="outline" size="sm" onClick={() => setViewPayslip(null)} className="text-xs">Close</Button>
                <Button size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Payslip
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
