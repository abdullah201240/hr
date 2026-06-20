import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ProvidentFundTabProps {
  empPfRate: number
  employerPfRate: number
  activeEmployees: any[]
  getEmployeePfStats: (id: string, joinDate: string | undefined) => { basic: number; monthlyEmp: number; monthlyEmployer: number; monthsActive: number; cumulative: number }
  formatCurrency: (amount: number) => string
}

export function ProvidentFundTab({
  empPfRate,
  employerPfRate,
  activeEmployees,
  getEmployeePfStats,
  formatCurrency,
}: ProvidentFundTabProps) {
  return (
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
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Employee Name
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Basic Salary
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Employee Share ({empPfRate}%)
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Employer Match ({employerPfRate}%)
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Tenure Seed
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                Accrued PF Balance
              </TableHead>
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
  )
}
