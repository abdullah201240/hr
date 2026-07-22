import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, Loader2 } from "lucide-react"
import { exportToCsv } from "@/lib/export"

interface ProvidentFundTabProps {
  empPfRate: number
  employerPfRate: number
  activeEmployees: any[]
  getEmployeePfStats: (id: string, joinDate: string | undefined) => { basic: number; monthlyEmp: number; monthlyEmployer: number; monthsActive: number; cumulative: number }
  formatCurrency: (amount: number) => string
  isLoading?: boolean
}

export function ProvidentFundTab({
  empPfRate,
  employerPfRate,
  activeEmployees,
  getEmployeePfStats,
  formatCurrency,
  isLoading,
}: ProvidentFundTabProps) {

  const handleExport = () => {
    const headers = [
      "Employee Name",
      "Basic Salary",
      "Employee Contribution Share",
      "Employer Matching Share",
      "Months Contributed",
      "Accrued PF Balance"
    ]
    const rows = activeEmployees.map((emp) => {
      const stats = getEmployeePfStats(emp.id, emp.joinDate)
      return [
        emp.fullNameEnglish,
        stats.basic,
        stats.monthlyEmp,
        stats.monthlyEmployer,
        stats.monthsActive,
        stats.cumulative
      ]
    })
    exportToCsv("ProvidentFundReserves", headers, rows)
  }

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold">Provident Fund Ledger & Reserves</CardTitle>
          <CardDescription className="text-xs">
            Real-time tracking of statutory retirement reserves and accumulated balances.
          </CardDescription>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={activeEmployees.length === 0}
            className="gap-1 text-xs h-9"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading PF records...</span>
          </div>
        ) : (
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
                  Months Contributed
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Accrued PF Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                    No active employees registered for Provident Fund.
                  </TableCell>
                </TableRow>
              ) : (
                activeEmployees.map((emp) => {
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
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
