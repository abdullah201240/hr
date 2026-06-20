import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, FileSpreadsheet, Loader2 } from "lucide-react"
import { exportToCsv } from "@/lib/export"

interface DisbursementLogsTabProps {
  disbursements: any[]
  formatCurrency: (amount: number) => string
  isLoading?: boolean
}

export function DisbursementLogsTab({ disbursements, formatCurrency, isLoading }: DisbursementLogsTabProps) {

  const handleExport = () => {
    const headers = [
      "Payout Month",
      "Disbursement Date",
      "Payment Method",
      "Transaction Reference",
      "Employee Count",
      "Total Disbursed"
    ]
    const rows = disbursements.map((rec) => [
      rec.monthKey,
      rec.disbursementDate,
      rec.paymentMethod,
      rec.referenceId,
      rec.employeeCount,
      rec.totalDisbursed
    ])
    exportToCsv("SalaryDisbursements", headers, rows)
  }

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <History className="h-4 w-4 text-primary" />
            Salary Disbursement Transactions
          </CardTitle>
          <CardDescription className="text-xs">
            Audit history of completed monthly payouts and distribution networks.
          </CardDescription>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={disbursements.length === 0}
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
            <span className="text-xs text-muted-foreground">Loading disbursement logs...</span>
          </div>
        ) : disbursements.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Payout Month
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Disbursement Date
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Method
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Transaction Reference
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Employees
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">
                  Total Disbursed
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disbursements.map((rec) => (
                <TableRow key={rec.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-3 text-xs font-semibold">{rec.monthKey}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{rec.disbursementDate}</TableCell>
                  <TableCell className="py-3">
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {rec.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-xs font-mono text-muted-foreground">{rec.referenceId}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">{rec.employeeCount} officers</TableCell>
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
            <p className="text-sm font-semibold">No disbursement records logged yet</p>
            <p className="text-xs">Once you process and execute payouts on a month cycle, they will be logged here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
