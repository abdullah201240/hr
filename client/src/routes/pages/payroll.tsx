import { useState, useMemo } from "react"
import { useSearchParams } from "react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  useUpdatePayslipBonusMutation,
  useProcessPayrollMutation,
  useDistributePayrollMutation,
  useDisburseMutation,
  useDisbursementsQuery,
  useSyncPayrollMutation,
  usePfBalancesQuery,
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
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import EmployeeSalaryTab from "@/components/payroll/EmployeeSalaryTab"
import BonusTab from "@/components/payroll/BonusTab"
import { ProvidentFundTab } from "@/components/payroll/ProvidentFundTab"
import { DisbursementLogsTab } from "@/components/payroll/DisbursementLogsTab"
import { PayrollProcessingTab } from "@/components/payroll/PayrollProcessingTab"
import { DetailedPayslipDialog } from "@/components/payroll/DetailedPayslipDialog"
import {
  ConfigureSpecialBonusDialog,
  SalaryDisbursementDialog,
  GlobalPfSetupDialog,
} from "@/components/payroll/PayrollActionDialogs"

export default function PayrollPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "processing"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

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
  const { data: pfSettings, isLoading: isPfLoading } = useProvidentFundSettingsQuery()
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: disbursements = [], isLoading: isDisbursementsLoading } = useDisbursementsQuery()
  const { data: templates = [] } = useSalaryTemplatesQuery()
  const { data: festivalBonusRules = [] } = useFestivalBonusRulesQuery()
  const { data: departmentOptions = [] } = useDepartmentOptionsQuery()
  const { data: pfBalances = [], isLoading: isPfBalancesLoading } = usePfBalancesQuery()

  // Salary Directory Query Parameters (State)
  const [salaryPage, setSalaryPage] = useState(1)
  const [salaryLimit, setSalaryLimit] = useState(10)
  const [salarySearch, setSalarySearch] = useState("")
  const [salaryDeptId, setSalaryDeptId] = useState("")
  const [salaryTemplateId, setSalaryTemplateId] = useState("")

  // Paginated directory lookup
  const { data: salariesPaginated, isLoading: salariesLoading } = useEmployeeSalariesQuery({
    page: salaryPage,
    limit: salaryLimit,
    search: salarySearch,
    departmentId: salaryDeptId || undefined,
    templateId: salaryTemplateId || undefined,
    status: "active",
  })

  // Full lookup for Provident Fund calculation details
  const { data: allSalariesData } = useEmployeeSalariesQuery({ limit: 1000, status: "active" })

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

  // PF settings rates
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
    Swal.fire({
      title: "Recalculate and Sync Ledger?",
      text: "This will reset all payslips for this draft cycle to their base templates, discarding any custom manual bonuses. Are you sure?",
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
    (sum, p) =>
      sum + p.allowanceHra + p.allowanceTransport + p.allowanceMedical + p.bonusAmount + p.festivalBonusAmount,
    0
  )
  const totalDeductionsSum = payslipsList.reduce((sum, p) => sum + p.deductionTax + p.deductionPf, 0)

  // Accrued PF calculation from actual paid payslips via API
  const activeEmployees = employeesData?.data || []
  const getEmployeePfStats = (empId: string, _joinDate?: string) => {
    const salRecord = allSalariesData?.data?.find((s) => s.employeeId === empId)
    const basic = salRecord?.basicSalary ?? 50000

    const balanceRecord = pfBalances?.find((b) => b.employeeId === empId)
    const totalPfEmployeeAccrued = balanceRecord ? Number(balanceRecord.totalPf) : 0
    const monthsContributed = balanceRecord ? Number(balanceRecord.monthsContributed) : 0

    const empContribution = Math.round(basic * (empPfRate / 100))
    const employerMatch = Math.round(basic * (employerPfRate / 100))
    
    // Accrued cumulative matching share
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
          <PayrollProcessingTab
            selectedMonth={selectedMonth}
            setSelectedMonth={handleMonthChange}
            cycleStatus={cycleStatus}
            payslipsList={payslipsList}
            formatCurrency={formatCurrency}
            handleOpenBonus={handleOpenBonus}
            setViewPayslip={setViewPayslip}
            monthsOptions={monthsOptions}
            isLoading={isCycleLoading}
          />
        </TabsContent>

        {/* TAB 2: PF MANAGEMENT */}
        <TabsContent value="pf" className="space-y-4 outline-none">
          <ProvidentFundTab
            empPfRate={empPfRate}
            employerPfRate={employerPfRate}
            activeEmployees={activeEmployees}
            getEmployeePfStats={getEmployeePfStats}
            formatCurrency={formatCurrency}
            isLoading={isPfLoading || isPfBalancesLoading || salariesLoading || employeesLoading}
          />
        </TabsContent>

        {/* TAB 3: DISBURSEMENT LOGS */}
        <TabsContent value="logs" className="space-y-4 outline-none">
          <DisbursementLogsTab
            disbursements={disbursements}
            formatCurrency={formatCurrency}
            isLoading={isDisbursementsLoading}
          />
        </TabsContent>

        {/* TAB 4: EMPLOYEE SALARY OVERVIEW */}
        <TabsContent value="overview" className="outline-none">
          <EmployeeSalaryTab
            templates={templates}
            employeeSalaries={salariesPaginated?.data || []}
            employees={employees}
            salariesLoading={salariesLoading}
            employeesDataLoading={employeesLoading}
            assignSalaryMutation={assignSalaryMutation}
            pfSettings={pfSettings}
            formatCurrency={formatCurrency}
            getInitials={getInitials}

            salaryPage={salaryPage}
            setSalaryPage={setSalaryPage}
            salaryLimit={salaryLimit}
            setSalaryLimit={setSalaryLimit}
            salarySearch={salarySearch}
            setSalarySearch={setSalarySearch}
            salaryDeptId={salaryDeptId}
            setSalaryDeptId={setSalaryDeptId}
            salaryTemplateId={salaryTemplateId}
            setSalaryTemplateId={setSalaryTemplateId}
            salariesMeta={salariesPaginated?.meta}
            departmentOptions={departmentOptions}
          />
        </TabsContent>

        {/* TAB 5: BONUS SETUP */}
        <TabsContent value="bonus" className="outline-none">
          <BonusTab
            festivalBonusRules={festivalBonusRules}
            employees={employees}
            employeeSalaries={allSalariesData?.data || []}
            formatCurrency={formatCurrency}
            monthsOptions={monthsOptions}
          />
        </TabsContent>
      </Tabs>

      <ConfigureSpecialBonusDialog
        isOpen={isBonusOpen}
        onClose={() => setIsBonusOpen(false)}
        bonusVal={bonusVal}
        setBonusVal={setBonusVal}
        bonusReason={bonusReason}
        setBonusReason={setBonusReason}
        onSave={handleSaveBonus}
        isPending={updateBonusMutation.isPending}
      />

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
