import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "./types"
import { PRIORITY_STYLE } from "./types"

interface MyTasksCardProps {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onToggleAll: (checked: boolean) => void
  onAddTask?: () => void
}

export function MyTasksCard({ tasks, onToggleTask, onDeleteTask, onToggleAll, onAddTask }: MyTasksCardProps) {
  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <Card className="shadow-none border-border/40 flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">My Tasks</CardTitle>
              <p className="text-[10px] text-muted-foreground">{doneTasks}/{totalTasks} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-muted-foreground">{taskPct}%</span>
              <Progress value={taskPct} className="h-1.5 w-20 rounded-full" />
            </div>
            <Badge variant="secondary" className="text-[10px] font-bold">
              {tasks.filter(t => !t.done).length} Pending
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/10 border-b border-border/30">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-12 border-b-0 hover:bg-transparent">
                <Checkbox
                  checked={doneTasks === totalTasks && totalTasks > 0}
                  onCheckedChange={(checked) => onToggleAll(!!checked)}
                />
              </TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Task</TableHead>
              <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Priority</TableHead>
              <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Due</TableHead>
              <TableHead className="w-24 font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
              <TableHead className="w-12 border-b-0 hover:bg-transparent"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow
                key={task.id}
                className="border-b border-border/20 hover:bg-muted/10 transition-colors"
              >
                <TableCell className="py-3">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => onToggleTask(task.id)}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <span className={cn(
                    "text-xs font-medium",
                    task.done && "line-through text-muted-foreground"
                  )}>{task.text}</span>
                </TableCell>
                <TableCell className="py-3">
                  <Badge className={cn("text-[9px] border-none font-semibold", PRIORITY_STYLE[task.priority])}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-xs text-muted-foreground">{task.due}</span>
                </TableCell>
                <TableCell className="py-3">
                  <Badge className={cn("text-[9px] font-bold border-none",
                    task.done
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600"
                  )}>
                    {task.done ? "Done" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableCell colSpan={6} className="py-3">
                <button
                  onClick={onAddTask}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
