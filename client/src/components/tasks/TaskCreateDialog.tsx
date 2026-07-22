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
import { useProjectsQuery, useMilestonesQuery } from "@/hooks/useTasks"
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
    tags?: string
    milestoneId?: string
    recurrencePattern?: string
    recurrenceInterval?: number
    watchers?: string
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

  // Additional fields states
  const [tags, setTags] = useState("")
  const [milestoneId, setMilestoneId] = useState("none")
  const [recurrencePattern, setRecurrencePattern] = useState("none")
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(1)
  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([])

  const { data: projects = [] } = useProjectsQuery()
  const { data: emps = [] } = useEmployeeOptionsQuery()
  const { data: milestones = [] } = useMilestonesQuery(projectId !== "none" ? projectId : "")

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
      setTags(editingTask.tags || "")
      setMilestoneId(editingTask.milestoneId || "none")
      setRecurrencePattern(editingTask.recurrencePattern || "none")
      setRecurrenceInterval(editingTask.recurrenceInterval || 1)
      setSelectedWatchers(editingTask.watchers ? editingTask.watchers.split(",").filter(Boolean) : [])
    } else {
      setProjectId(defaultProjectId || "none")
      setTitle("")
      setDescription("")
      setPriority("Medium")
      setDueDate("")
      setAssigneeId("all")
      setEstimatedHours(0)
      setStatus("Todo")
      setTags("")
      setMilestoneId("none")
      setRecurrencePattern("none")
      setRecurrenceInterval(1)
      setSelectedWatchers([])
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
      tags: tags.trim() || undefined,
      milestoneId: milestoneId === "none" ? undefined : milestoneId,
      recurrencePattern: recurrencePattern !== "none" ? recurrencePattern : undefined,
      recurrenceInterval: recurrencePattern !== "none" ? Number(recurrenceInterval) : undefined,
      watchers: selectedWatchers.length > 0 ? selectedWatchers.join(",") : undefined,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-border/50 shadow-lg max-h-[90vh] overflow-y-auto">
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
              <Select value={projectId} onValueChange={(val) => {
                setProjectId(val);
                setMilestoneId("none");
              }}>
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

            {/* Milestone & Tags Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Milestone</Label>
                <Select 
                  value={milestoneId} 
                  onValueChange={setMilestoneId}
                  disabled={projectId === "none"}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="No Milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">
                      No Milestone
                    </SelectItem>
                    {milestones.map((m: any) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="task-tags" className="text-xs font-semibold">
                  Tags (Comma separated)
                </Label>
                <Input
                  id="task-tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. api, bug, design"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Recurrence Settings Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Recurrence Pattern</Label>
                <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="recurrence-interval" className="text-xs font-semibold">
                  Recurrence Interval
                </Label>
                <Input
                  id="recurrence-interval"
                  type="number"
                  min="1"
                  disabled={recurrencePattern === "none"}
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Watchers Multi-select Grid */}
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Watchers</Label>
              <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto border border-border/50 rounded-md p-2.5 bg-accent/10">
                {emps.map((e) => {
                  const isChecked = selectedWatchers.includes(e.id);
                  return (
                    <label key={e.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/20 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(evt) => {
                          if (evt.target.checked) {
                            setSelectedWatchers([...selectedWatchers, e.id]);
                          } else {
                            setSelectedWatchers(selectedWatchers.filter((id) => id !== e.id));
                          }
                        }}
                        className="rounded border-border/50 accent-primary"
                      />
                      <span className="text-[11px] truncate">{e.fullNameEnglish}</span>
                    </label>
                  );
                })}
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
