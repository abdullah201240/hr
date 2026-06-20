import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProjectsQuery } from "@/hooks/useTasks"
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TaskCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    projectId?: string
    title: string
    description: string
    priority: "Low" | "Medium" | "High" | "Urgent"
    dueDate?: string
    assigneeId?: string
    estimatedHours: number
    status?: string
  }) => void
  isPending: boolean
  editingTask?: any
  defaultProjectId?: string
}

export function TaskCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingTask,
  defaultProjectId,
}: TaskCreateDialogProps) {
  const [projectId, setProjectId] = useState<string>("none")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium")
  const [dueDate, setDueDate] = useState("")
  const [assigneeId, setAssigneeId] = useState("all")
  const [estimatedHours, setEstimatedHours] = useState<number>(0)
  const [status, setStatus] = useState("Todo")

  const { data: projects = [] } = useProjectsQuery()
  const { data: emps = [] } = useEmployeeOptionsQuery()

  useEffect(() => {
    if (editingTask) {
      setProjectId(editingTask.projectId || "none")
      setTitle(editingTask.title || "")
      setDescription(editingTask.description || "")
      setPriority(editingTask.priority || "Medium")
      setDueDate(editingTask.dueDate ? editingTask.dueDate.split("T")[0] : "")
      setAssigneeId(editingTask.assigneeId || "all")
      setEstimatedHours(editingTask.estimatedHours || 0)
      setStatus(editingTask.status || "Todo")
    } else {
      setProjectId(defaultProjectId || "none")
      setTitle("")
      setDescription("")
      setPriority("Medium")
      setDueDate("")
      setAssigneeId("all")
      setEstimatedHours(0)
      setStatus("Todo")
    }
  }, [editingTask, defaultProjectId, isOpen])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Task title is required")
      return
    }

    onSubmit({
      projectId: projectId === "none" ? undefined : projectId,
      title,
      description,
      priority,
      dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : undefined,
      assigneeId: assigneeId === "all" ? undefined : assigneeId,
      estimatedHours: Number(estimatedHours) || 0,
      status: editingTask ? status : undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border/50 shadow-lg">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingTask ? "Edit Task Details" : "Log New Task"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign execution parameters, timelines, and estimation budgets to tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Project / Board Group</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Unassigned / Independent Task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Independent Task (No project)
                  </SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="task-title" className="text-xs font-semibold">
                Task Title *
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Audit Q1 ledger balances"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="task-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed logs, expectations, or completion check criteria..."
                className="min-h-[80px] text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Priority Level</Label>
                <Select
                  value={priority}
                  onValueChange={(val: any) => setPriority(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low" className="text-xs">
                      <span className="text-blue-500 font-semibold">Low</span>
                    </SelectItem>
                    <SelectItem value="Medium" className="text-xs">
                      <span className="text-slate-500 font-semibold">Medium</span>
                    </SelectItem>
                    <SelectItem value="High" className="text-xs">
                      <span className="text-amber-600 font-semibold">High</span>
                    </SelectItem>
                    <SelectItem value="Urgent" className="text-xs">
                      <span className="text-rose-600 font-bold">Urgent</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="task-duedate" className="text-xs font-semibold">
                  Due Date
                </Label>
                <Input
                  id="task-duedate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Unassigned
                    </SelectItem>
                    {emps.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">
                        {e.fullNameEnglish}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="task-estimate" className="text-xs font-semibold">
                  Estimated Hours
                </Label>
                <Input
                  id="task-estimate"
                  type="number"
                  min="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  placeholder="e.g. 8"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {editingTask && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Task Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog" className="text-xs">Backlog</SelectItem>
                    <SelectItem value="Todo" className="text-xs">Todo</SelectItem>
                    <SelectItem value="In Progress" className="text-xs">In Progress</SelectItem>
                    <SelectItem value="In Review" className="text-xs">In Review</SelectItem>
                    <SelectItem value="Done" className="text-xs">Done</SelectItem>
                    <SelectItem value="Cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : editingTask ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
