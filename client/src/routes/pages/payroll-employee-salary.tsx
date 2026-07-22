import { useState } from "react"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useProvidentFundSettingsQuery } from "@/hooks/useProvidentFund"
import {
  useEmployeeSalariesQuery,
  useSalaryTemplatesQuery,
  useAssignEmployeeSalaryMutation,
} from "@/hooks/useSalary"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import EmployeeSalaryTab from "@/components/payroll/EmployeeSalaryTab"

export default function PayrollEmployeeSalaryPage() {
  const { data: pfSettings } = useProvidentFundSettingsQuery()
  const { data: employeesData, isLoading: employeesLoading } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: templates = [] } = useSalaryTemplatesQuery()
  const { data: departmentOptions = [] } = useDepartmentOptionsQuery()

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

  const assignSalaryMutation = useAssignEmployeeSalaryMutation()

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "EM"

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  const employees = employeesData?.data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Employee Salary Directory</h2>
        <p className="text-muted-foreground text-sm">Assign, view, and adjust salary templates for active workforce members.</p>
      </div>

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
    </div>
  )
}
