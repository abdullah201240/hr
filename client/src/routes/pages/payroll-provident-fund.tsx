import { useProvidentFundSettingsQuery } from "@/hooks/useProvidentFund"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { usePfBalancesQuery } from "@/hooks/usePayroll"
import { useEmployeeSalariesQuery } from "@/hooks/useSalary"
import { ProvidentFundTab } from "@/components/payroll/ProvidentFundTab"

export default function PayrollProvidentFundPage() {
  const { data: pfSettings, isLoading: isPfLoading } = useProvidentFundSettingsQuery()
  const { data: pfBalances, isLoading: isPfBalancesLoading } = usePfBalancesQuery()
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: allSalariesData, isLoading: salariesLoading } = useEmployeeSalariesQuery({ limit: 1000, status: "active" })

  const empPfRate = pfSettings?.employeeContributionRate ?? 10
  const employerPfRate = pfSettings?.employerContributionRate ?? 10

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  const getEmployeePfStats = (empId: string) => {
    const salRecord = allSalariesData?.data?.find((s) => s.employeeId === empId)
    const basic = salRecord?.basicSalary ?? 50000

    const balanceRecord = pfBalances?.find((b: any) => b.employeeId === empId)
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

  const activeEmployees = employeesData?.data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Provident Fund (PF) Management</h2>
        <p className="text-muted-foreground text-sm">Monitor cumulative employee retirement assets and employer contribution pools.</p>
      </div>

      <ProvidentFundTab
        empPfRate={empPfRate}
        employerPfRate={employerPfRate}
        activeEmployees={activeEmployees}
        getEmployeePfStats={getEmployeePfStats}
        formatCurrency={formatCurrency}
        isLoading={isPfLoading || isPfBalancesLoading || salariesLoading || employeesLoading}
      />
    </div>
  )
}
