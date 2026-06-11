import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, CheckSquare, Circle, Clock } from "lucide-react"

const tasks = [
  { title: "Review Q2 performance data", assignee: "Sarah M.", priority: "High", status: "In Progress", due: "Jun 12", progress: 65 },
  { title: "Update employee handbook", assignee: "Emily Z.", priority: "Medium", status: "In Progress", due: "Jun 15", progress: 40 },
  { title: "Onboard new engineering hires", assignee: "James C.", priority: "High", status: "To Do", due: "Jun 11", progress: 0 },
  { title: "Prepare payroll reconciliation", assignee: "David K.", priority: "Low", status: "Done", due: "Jun 10", progress: 100 },
  { title: "Schedule exit interviews", assignee: "Lisa J.", priority: "Medium", status: "In Progress", due: "Jun 14", progress: 80 },
  { title: "Audit benefits enrollment", assignee: "Marcus B.", priority: "High", status: "To Do", due: "Jun 18", progress: 0 },
]

const priorityColors: Record<string, string> = {
  High: "bg-red-500/10 text-red-600 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

const statusIcons: Record<string, typeof CheckSquare> = {
  "In Progress": Clock,
  "To Do": Circle,
  Done: CheckSquare,
}

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Task Management</h2>
          <p className="text-muted-foreground">Track and manage HR tasks and assignments</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Circle className="h-4 w-4 text-muted-foreground" /> To Do
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">4</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> In Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">6</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-500" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">12</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
          <CardDescription>Tasks assigned to your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task, i) => {
              const StatusIcon = statusIcons[task.status] || Circle
              return (
                <div key={i} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${task.status === "Done" ? "text-emerald-500" : task.status === "In Progress" ? "text-blue-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">Assigned to {task.assignee} · Due {task.due}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.progress > 0 && task.progress < 100 && (
                    <div className="flex items-center gap-2 pl-8">
                      <Progress value={task.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
