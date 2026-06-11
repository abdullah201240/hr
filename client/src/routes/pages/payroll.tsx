import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Wallet, Receipt } from "lucide-react"

const payrollSummary = [
  { label: "Total Payroll", value: "$1.24M", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Avg. Salary", value: "$5,012", icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Tax Deductions", value: "$186K", icon: Receipt, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Growth", value: "+8.2%", icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
]

const departments = [
  { name: "Engineering", total: "$412,800", avg: "$6,450", headcount: 64, percentage: 85 },
  { name: "Product", total: "$198,400", avg: "$6,200", headcount: 32, percentage: 65 },
  { name: "Marketing", total: "$156,800", avg: "$5,600", headcount: 28, percentage: 55 },
  { name: "Sales", total: "$247,500", avg: "$5,500", headcount: 45, percentage: 72 },
  { name: "HR", total: "$69,600", avg: "$5,800", headcount: 12, percentage: 40 },
  { name: "Finance", total: "$117,000", avg: "$6,500", headcount: 18, percentage: 48 },
]

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payroll</h2>
          <p className="text-muted-foreground">Manage compensation and payroll processing</p>
        </div>
        <Button className="gap-2">
          <DollarSign className="h-4 w-4" />
          Run Payroll
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {payrollSummary.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.bg}`}>
                  <Icon className={`h-4 w-4 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent className="text-2xl font-bold">{item.value}</CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Payroll</CardTitle>
          <CardDescription>Monthly payroll breakdown by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{dept.name}</p>
                    <p className="text-xs text-muted-foreground">{dept.headcount} employees · Avg. {dept.avg}</p>
                  </div>
                  <span className="text-sm font-semibold">{dept.total}</span>
                </div>
                <Progress value={dept.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
