import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { History } from "lucide-react"

interface DisbursementLogsTabProps {
  disbursements: any[]
  formatCurrency: (amount: number) => string
}

export function DisbursementLogsTab({ disbursements, formatCurrency }: DisbursementLogsTabProps) {
  return (
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
