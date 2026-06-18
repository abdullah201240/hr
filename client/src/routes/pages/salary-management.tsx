import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coins, Users, Shield, TrendingUp } from "lucide-react"

import {
  useSalaryTemplatesQuery,
  useEmployeeSalariesQuery,
  useAssignEmployeeSalaryMutation,
  useSalarySummaryQuery,
} from "@/hooks/useSalary"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useFestivalBonusRulesQuery } from "@/hooks/useFestivalBonus"
import { useProvidentFundSettingsQuery } from "@/hooks/useProvidentFund"

import EmployeeSalaryTab from "@/components/payroll/EmployeeSalaryTab"
import PayrollProcessingTab from "@/components/payroll/PayrollProcessingTab"
import ProvidentFundTab from "@/components/payroll/ProvidentFundTab"
import BonusTab from "@/components/payroll/BonusTab"
import type { PayrollCycle, DisbursementRecord, Payslip } from "@/types"

// Helpers
const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(val)

const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM"

export default function SalaryManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "overview"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  // API Hooks
  const { data: templates = [], isLoading: templatesLoading } = useSalaryTemplatesQuery()
  const { data: employeeSalaries = [], isLoading: salariesLoading } = useEmployeeSalariesQuery()
  const { data: summary } = useSalarySummaryQuery()
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({ page: 1, limit: 100, status: "active" })
  const { data: pfSettings } = useProvidentFundSettingsQuery()
  const { data: festivalBonusRules = [] } = useFestivalBonusRulesQuery()

  const assignSalaryMutation = useAssignEmployeeSalaryMutation()

  const employees = useMemo(() => employeesData?.data || [], [employeesData])

  // Payroll localStorage state managed at page level
  const [payrolls, setPayrolls] = useState<PayrollCycle[]>(() => {
    const stored = localStorage.getItem("hr_payrolls")
    return stored ? JSON.parse(stored) : []
  })

  // Sanitize local storage records containing legacy mock data
  useEffect(() => {
    if (employees.length > 0 && payrolls.length > 0) {
      const activeEmails = new Set(employees.map(e => e.email))
      const cleanedPayrolls = payrolls.filter(p => {
        return p.payslips && !p.payslips.some((slip: Payslip) => !activeEmails.has(slip.employeeEmail))
      })
      if (cleanedPayrolls.length !== payrolls.length) {
        Promise.resolve().then(() => {
          setPayrolls(cleanedPayrolls)
        })
        localStorage.setItem("hr_payrolls", JSON.stringify(cleanedPayrolls))
      }
    }
  }, [employees, payrolls])
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(() => {
    const stored = localStorage.getItem("hr_disbursements")
    return stored ? JSON.parse(stored) : []
  })

  const savePayrolls = (updatedPayrolls: PayrollCycle[]) => {
    setPayrolls(updatedPayrolls)
    localStorage.setItem("hr_payrolls", JSON.stringify(updatedPayrolls))
  }

  const saveDisbursements = (updatedRecords: DisbursementRecord[]) => {
    setDisbursements(updatedRecords)
    localStorage.setItem("hr_disbursements", JSON.stringify(updatedRecords))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Salary & Payroll Management
          </h2>
          <p className="text-muted-foreground">
            Configure salaries, manage templates, process payroll and disburse
            payments
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Total Salary Budget
              </p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.totalBudget || 0)}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Active monthly commitments
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Salary Assigned</p>
              <p className="text-2xl font-bold mt-1">
                {summary?.assignedCount || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {summary?.totalEmployees || 0}
                </span>
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">
                Employees with active salary
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Average Salary</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.avgSalary || 0)}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Across all active records
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">PF Contributors</p>
              <p className="text-2xl font-bold mt-1">
                {summary?.pfContributors || 0}
              </p>
              <span className="text-[10px] text-amber-500 font-semibold">
                Provident fund enrolled
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-[600px] grid-cols-4 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="overview" className="text-xs">
            Employee Salary
          </TabsTrigger>
          <TabsTrigger value="processing" className="text-xs">
            Payroll Processing
          </TabsTrigger>
          <TabsTrigger value="bonus" className="text-xs">
            Bonus
          </TabsTrigger>
          <TabsTrigger value="pf" className="text-xs">
            PF & Benefits
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EMPLOYEE SALARY OVERVIEW */}
        <TabsContent value="overview" className="outline-none">
          <EmployeeSalaryTab
            templates={templates}
            employeeSalaries={employeeSalaries}
            employees={employees}
            salariesLoading={salariesLoading}
            employeesDataLoading={employeesLoading}
            assignSalaryMutation={assignSalaryMutation}
            pfSettings={pfSettings}
            formatCurrency={formatCurrency}
            getInitials={getInitials}
          />
        </TabsContent>

        {/* TAB 2: PAYROLL PROCESSING */}
        <TabsContent value="processing" className="outline-none">
          <PayrollProcessingTab
            payrolls={payrolls}
            savePayrolls={savePayrolls}
            disbursements={disbursements}
            saveDisbursements={saveDisbursements}
            pfSettings={pfSettings}
            formatCurrency={formatCurrency}
            templates={templates}
            employeeSalaries={employeeSalaries}
            employees={employees}
            isLoading={salariesLoading || employeesLoading || templatesLoading}
            festivalBonusRules={festivalBonusRules}
          />
        </TabsContent>

        {/* TAB 3: BONUS */}
        <TabsContent value="bonus" className="outline-none">
          <BonusTab
            festivalBonusRules={festivalBonusRules}
            employees={employees}
            employeeSalaries={employeeSalaries}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* TAB 4: PF & BENEFITS */}
        <TabsContent value="pf" className="outline-none">
          <ProvidentFundTab
            disbursements={disbursements}
            pfSettings={pfSettings}
            formatCurrency={formatCurrency}
            employees={employees}
            employeeSalaries={employeeSalaries}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
