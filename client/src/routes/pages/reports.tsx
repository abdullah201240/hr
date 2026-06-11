import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Download, TrendingUp, Users, CalendarClock, DollarSign } from "lucide-react"

const reports = [
  { title: "Headcount Report", desc: "Monthly employee headcount analysis", date: "Jun 2026", type: "Workforce" },
  { title: "Attrition Analysis", desc: "Employee turnover trends and insights", date: "Q2 2026", type: "Workforce" },
  { title: "Attendance Summary", desc: "Monthly attendance and absence patterns", date: "May 2026", type: "Attendance" },
  { title: "Payroll Report", desc: "Detailed payroll processing summary", date: "May 2026", type: "Finance" },
  { title: "Diversity Report", desc: "DEI metrics and progress tracking", date: "Q2 2026", type: "DEI" },
  { title: "Engagement Survey", desc: "Employee satisfaction and engagement results", date: "Q1 2026", type: "Culture" },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-muted-foreground">Generate and download HR analytics reports</p>
        </div>
        <Button className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-emerald-500 font-medium">+4.8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-emerald-500 font-medium">+1.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cost per Employee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5,012</div>
            <p className="text-xs text-amber-500 font-medium">-0.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Pre-configured reports ready for download</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{report.title}</p>
                    <p className="text-xs text-muted-foreground">{report.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <Badge variant="secondary" className="text-[10px]">{report.type}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{report.date}</p>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
