import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History } from "lucide-react"
import type { EmployeeSalary, ProvidentFundSettings, Employee } from "@/types"

interface DisbursementRecord {
  monthKey: string
  disbursementDate: string
  paymentMethod: string
  referenceId: string
  totalDisbursed: number
  employeeCount: number
}

interface ProvidentFundTabProps {
  disbursements: DisbursementRecord[]
  pfSettings: ProvidentFundSettings | null | undefined
  formatCurrency: (val: number) => string
  employees: Employee[]
  employeeSalaries: EmployeeSalary[]
}

export default function ProvidentFundTab({
  disbursements,
  pfSettings,
  formatCurrency,
  employees,
  employeeSalaries,
}: ProvidentFundTabProps) {
  const empPfRate = pfSettings
    ? Number(pfSettings.employeeContributionRate)
    : 10
  const employerPfRate = pfSettings
    ? Number(pfSettings.employerContributionRate)
    : 10

  // Map employee salaries by employee ID
  const salariesMap = useMemo(() => {
    return new Map<string, EmployeeSalary>(employeeSalaries.map(s => [s.employeeId, s]))
  }, [employeeSalaries])

  const getEmployeePfStats = (emp: { joinDate: string; basicSalary: number }) => {
    const joinDateObj = new Date(emp.joinDate || "2023-01-01")
    const today = new Date()
    const diffMonths =
      (today.getFullYear() - joinDateObj.getFullYear()) * 12 +
      today.getMonth() -
      joinDateObj.getMonth()
    const months = Math.max(1, diffMonths)
    const empContribution = Math.round(emp.basicSalary * (empPfRate / 100))
    const employerMatch = Math.round(emp.basicSalary * (employerPfRate / 100))
    return {
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: (empContribution + employerMatch) * months,
      monthsActive: months,
    }
  }

  return (
    <div className="space-y-6">
      {/* PF Ledger */}
      <Card className="shadow-none border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold">
            Provident Fund Ledger &amp; Reserves
          </CardTitle>
          <CardDescription className="text-xs">
            Tracking of statutory retirement reserves. Employee{" "}
            {empPfRate}% + Employer {employerPfRate}% matching.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Employee
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Basic Salary
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Employee Share ({empPfRate}%)
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Employer Match ({employerPfRate}%)
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Tenure
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Accrued PF Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => {
                const salary = salariesMap.get(emp.id)
                const basicSalary = salary?.basicSalary || 0
                const pfApplicable = salary?.pfApplicable ?? false

                const stats = getEmployeePfStats({
                  joinDate: emp.joinDate || "2023-01-01",
                  basicSalary: pfApplicable ? basicSalary : 0,
                })

                return (
                  <TableRow
                    key={emp.id}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {emp.fullNameEnglish}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {emp.departmentName || "—"} · Joined {emp.joinDate || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground font-semibold">
                      {basicSalary > 0 ? formatCurrency(basicSalary) : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-foreground font-medium">
                      {pfApplicable ? `${formatCurrency(stats.monthlyEmp)}/mo` : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-foreground font-medium">
                      {pfApplicable ? `${formatCurrency(stats.monthlyEmployer)}/mo` : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {stats.monthsActive} months
                    </TableCell>
                    <TableCell className="py-3 text-xs font-bold text-emerald-600">
                      {pfApplicable ? formatCurrency(stats.cumulative) : "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Disbursement Logs */}
      <Card className="shadow-none border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Salary Disbursement Transactions
          </CardTitle>
          <CardDescription className="text-xs">
            Audit history of completed monthly payouts.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {disbursements.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Month
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Method
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Employees
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                    Total Disbursed
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disbursements.map((rec) => (
                  <TableRow
                    key={`${rec.monthKey}-${rec.referenceId}`}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-3 text-xs font-semibold">
                      {rec.monthKey}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {rec.disbursementDate}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {rec.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                      {rec.referenceId}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {rec.employeeCount} officers
                    </TableCell>
                    <TableCell className="py-3 text-xs font-bold text-emerald-600">
                      {formatCurrency(rec.totalDisbursed)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold">
                No disbursement records yet
              </p>
              <p className="text-xs">
                Process and execute payouts to log them here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
