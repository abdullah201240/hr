import {
  Users,
  CalendarClock,
  CalendarOff,
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

/* ── KPI Stats ── */
const kpiStats = [
  {
    title: "Total Employees",
    value: "248",
    change: "+12 this month",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Present Today",
    value: "221",
    change: "89% attendance",
    trend: "up" as const,
    icon: CalendarClock,
  },
  {
    title: "On Leave",
    value: "14",
    change: "3 pending",
    trend: "down" as const,
    icon: CalendarOff,
  },
  {
    title: "Open Tasks",
    value: "23",
    change: "5 due today",
    trend: "up" as const,
    icon: CheckSquare,
  },
]

/* ── Attendance Summary ── */
const attendanceData = [
  { day: "Mon", present: 230, absent: 18 },
  { day: "Tue", present: 225, absent: 23 },
  { day: "Wed", present: 221, absent: 27 },
  { day: "Thu", present: 228, absent: 20 },
  { day: "Fri", present: 215, absent: 33 },
]

/* ── Leave Requests ── */
const leaveRequests = [
  { name: "Sarah Mitchell", type: "Vacation", days: "3 days", status: "Pending", initials: "SM" },
  { name: "Marcus Brown", type: "Personal", days: "1 day", status: "Pending", initials: "MB" },
  { name: "Emily Zhang", type: "Vacation", days: "5 days", status: "Pending", initials: "EZ" },
  { name: "David Kim", type: "Sick Leave", days: "2 days", status: "Approved", initials: "DK" },
]

/* ── Task Overview ── */
const taskSummary = {
  todo: { count: 8, percentage: 26 },
  inProgress: { count: 12, percentage: 39 },
  done: { count: 11, percentage: 35 },
}

const recentTasks = [
  { title: "Review Q2 performance data", assignee: "Sarah M.", status: "In Progress" },
  { title: "Update employee handbook", assignee: "Emily Z.", status: "In Progress" },
  { title: "Onboard new engineering hires", assignee: "James C.", status: "To Do" },
  { title: "Prepare payroll reconciliation", assignee: "David K.", status: "Done" },
]

/* ── Payroll Summary ── */
const payrollData = {
  totalPayroll: "$1.24M",
  processed: "$980K",
  pending: "$260K",
  nextRun: "Jun 30, 2026",
  avgSalary: "$5,012",
}

/* ── Recent Activity ── */
const recentActivities = [
  { name: "Sarah Mitchell", action: "submitted a leave request", time: "2 min ago", initials: "SM" },
  { name: "James Cooper", action: "completed onboarding", time: "1 hour ago", initials: "JC" },
  { name: "Emily Zhang", action: "updated payroll info", time: "2 hours ago", initials: "EZ" },
  { name: "David Kim", action: "submitted expense report", time: "3 hours ago", initials: "DK" },
  { name: "Lisa Johnson", action: "approved team timesheets", time: "4 hours ago", initials: "LJ" },
  { name: "Marcus Brown", action: "joined the Sales department", time: "5 hours ago", initials: "MB" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 via-primary/8 to-transparent p-6">
        <h2 className="text-2xl font-bold text-foreground">Good morning, Alex</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your HR operations today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span className={`text-xs font-medium ${stat.trend === "up" ? "text-emerald-500" : "text-amber-500"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Attendance + Leave Requests */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Summary Widget */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>This week&apos;s attendance overview</CardDescription>
              </div>
              <Button variant="outline" size="sm">Details</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendanceData.map((day) => {
                const total = day.present + day.absent
                const percentage = Math.round((day.present / total) * 100)
                return (
                  <div key={day.day} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-8">{day.day}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-emerald-500 font-medium">{day.present} present</span>
                        <span>{day.absent} absent</span>
                        <span className="w-8 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leave Request Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Pending leave requests requiring action</CardDescription>
              </div>
              <Badge variant="secondary">3 pending</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaveRequests.map((req, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                        {req.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{req.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.type} &middot; {req.days}
                      </p>
                    </div>
                  </div>
                  {req.status === "Pending" ? (
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="default" className="h-7 px-2.5 text-xs">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 text-[10px]">
                      {req.status}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status + Payroll Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Task Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Overview</CardTitle>
                <CardDescription>Current task status breakdown</CardDescription>
              </div>
              <Button variant="outline" size="sm">View all</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary bars */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <Circle className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
                <p className="text-xl font-bold">{taskSummary.todo.count}</p>
                <p className="text-[11px] text-muted-foreground">To Do</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <Clock className="mx-auto mb-1.5 h-5 w-5 text-blue-500" />
                <p className="text-xl font-bold">{taskSummary.inProgress.count}</p>
                <p className="text-[11px] text-muted-foreground">In Progress</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <CheckCircle2 className="mx-auto mb-1.5 h-5 w-5 text-emerald-500" />
                <p className="text-xl font-bold">{taskSummary.done.count}</p>
                <p className="text-[11px] text-muted-foreground">Done</p>
              </div>
            </div>

            {/* Recent tasks */}
            <div className="space-y-2">
              {recentTasks.map((task, i) => {
                const StatusIcon = task.status === "Done" ? CheckCircle2 : task.status === "In Progress" ? Clock : Circle
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <StatusIcon className={`h-4 w-4 shrink-0 ${task.status === "Done" ? "text-emerald-500" : task.status === "In Progress" ? "text-blue-500" : "text-muted-foreground"}`} />
                    <span className="flex-1 truncate">{task.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{task.assignee}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payroll Summary</CardTitle>
                <CardDescription>Monthly payroll overview</CardDescription>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">Total Payroll</p>
              <p className="text-3xl font-bold mt-1">{payrollData.totalPayroll}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Processed</p>
                <p className="text-lg font-bold text-emerald-600">{payrollData.processed}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-amber-600">{payrollData.pending}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Next Payroll Run</p>
                <p className="text-xs text-muted-foreground">Avg. {payrollData.avgSalary} per employee</p>
              </div>
              <Badge variant="secondary">{payrollData.nextRun}</Badge>
            </div>
            <Progress value={79} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">79% of monthly payroll processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your organization</CardDescription>
            </div>
            <Button variant="outline" size="sm">View all</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {activity.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{activity.name}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
