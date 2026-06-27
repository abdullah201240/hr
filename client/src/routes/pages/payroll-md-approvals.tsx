import { useState, useMemo } from "react"
import { usePayrollCycleQuery, type Payslip } from "@/hooks/usePayroll"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useProvidentFundSettingsQuery } from "@/hooks/useProvidentFund"
import { MdApprovalsTab } from "@/components/payroll/MdApprovalsTab"
import { MdFestivalBonusApprovalsTab } from "@/components/payroll/MdFestivalBonusApprovalsTab"
import { DetailedPayslipDialog } from "@/components/payroll/DetailedPayslipDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PayrollMdApprovalsPage() {
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

  const [selectedMonth, setSelectedMonth] = useState(() => monthsOptions[0]?.key || "2026-06")
  const { data: cycle, isLoading: isCycleLoading } = usePayrollCycleQuery(selectedMonth)
  const { data: employeesData } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: pfSettings } = useProvidentFundSettingsQuery()
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  const employees = employeesData?.data || []
  const empPfRate = pfSettings?.employeeContributionRate ?? 10

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">MD Payroll Approvals</h2>
        <p className="text-muted-foreground text-sm">Final high-level monthly compensation approval and sign-off.</p>
      </div>

      <Tabs defaultValue="salary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="salary">Monthly Salaries</TabsTrigger>
          <TabsTrigger value="bonus">Festival Bonuses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="salary" className="mt-0">
          <MdApprovalsTab
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            cycle={cycle}
            formatCurrency={formatCurrency}
            setViewPayslip={setViewPayslip}
            monthsOptions={monthsOptions}
            isLoading={isCycleLoading}
            employees={employees}
          />
        </TabsContent>

        <TabsContent value="bonus" className="mt-0">
          <MdFestivalBonusApprovalsTab
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

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
