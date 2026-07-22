import React from "react";
import {
  Clock,
  User,
  Tag,
  Calendar,
  Target,
  RefreshCw,
  Star,
  Eye,
  Settings,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  fullNameEnglish: string;
}

interface Milestone {
  id: string;
  name: string;
  dueDate?: string | null;
}

interface TaskPropertiesGridProps {
  task: {
    status: string;
    assigneeId: string | null;
    priority: string;
    dueDate: string | null;
    projectId: string | null;
    milestoneId: string | null;
    tags: string | null;
    workStatus: string | null;
    progress: number | null;
    timerStartedAt: string | null;
    estimatedHours: number;
    actualHours: number;
    recurrencePattern: string | null;
    recurrenceInterval: number | null;
    nextRecurrenceDate: string | null;
    approvalStatus: string | null;
    reviewRating: number | null;
    reviewFeedback: string | null;
    createdAt: string;
    updatedAt: string;
  };
  employees: Employee[];
  milestones: Milestone[];
  health: "Healthy" | "At Risk" | "Critical";
  timeVariance: number;
  timerVal: string;
  watchersList: string[];
  isAddingWatcher: boolean;
  setIsAddingWatcher: (val: boolean) => void;
  onAddWatcher: (empId: string) => void;
  onRemoveWatcher: (empId: string) => void;
  onMetaUpdate: (field: string, value: any) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

export const TaskPropertiesGrid: React.FC<TaskPropertiesGridProps> = ({
  task,
  employees,
  milestones,
  health,
  timeVariance,
  timerVal,
  watchersList,
  isAddingWatcher,
  setIsAddingWatcher,
  onAddWatcher,
  onRemoveWatcher,
  onMetaUpdate,
  onStartTimer,
  onStopTimer,
}) => {
  return (
    <ScrollArea className="flex-1 min-h-0 bg-slate-50/20 dark:bg-slate-900/5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 pb-8">
        {/* Card 1: Core Settings */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-105 dark:border-slate-800/50">
            <Settings className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-slate-700 dark:text-slate-350 text-xs">Core Settings</h3>
          </div>

          {/* Status Selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Status
            </Label>
            <Select value={task.status} onValueChange={(val) => onMetaUpdate("status", val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
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

          {/* Assignee Selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3" /> Assignee
            </Label>
            <Select value={task.assigneeId || "unassigned"} onValueChange={(val) => onMetaUpdate("assigneeId", val === "unassigned" ? null : val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">{e.fullNameEnglish}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selector */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Priority
            </Label>
            <Select value={task.priority} onValueChange={(val) => onMetaUpdate("priority", val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low" className="text-xs">Low</SelectItem>
                <SelectItem value="Medium" className="text-xs">Medium</SelectItem>
                <SelectItem value="High" className="text-xs">High</SelectItem>
                <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Due Date
            </Label>
            <Input
              type="date"
              value={task.dueDate ? task.dueDate.split("T")[0] : ""}
              onChange={(e) => onMetaUpdate("dueDate", e.target.value ? `${e.target.value}T00:00:00.000Z` : null)}
              className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
            />
          </div>

          {/* Milestone Selector */}
          {task.projectId && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Target className="h-3 w-3" /> Milestone
              </Label>
              <Select
                value={task.milestoneId || "none"}
                onValueChange={(val) => onMetaUpdate("milestoneId", val === "none" ? null : val)}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                  <SelectValue placeholder="No Milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No Milestone</SelectItem>
                  {milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} {m.dueDate ? `(Due: ${m.dueDate})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Input */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Tags (comma-separated)
            </Label>
            <Input
              defaultValue={task.tags || ""}
              onBlur={(e) => onMetaUpdate("tags", e.target.value)}
              placeholder="Design, Bug, Critical"
              className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
            />
          </div>
        </div>

        {/* Card 2: Execution & Time */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-105 dark:border-slate-800/50">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-slate-700 dark:text-slate-350 text-xs">Execution & Time</h3>
          </div>

          {/* Work Status */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Work Status
            </Label>
            <Select value={task.workStatus || "Idle"} onValueChange={(val) => onMetaUpdate("workStatus", val)}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Idle" className="text-xs">Idle</SelectItem>
                <SelectItem value="Active Working" className="text-xs">Active Working</SelectItem>
                <SelectItem value="Paused" className="text-xs">Paused</SelectItem>
                <SelectItem value="Blocked" className="text-xs">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
              <span>Progress</span>
              <span className="font-bold text-primary">{task.progress || 0}%</span>
            </div>
            <Select value={String(task.progress || 0)} onValueChange={(val) => onMetaUpdate("progress", Number(val))}>
              <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                  <SelectItem key={p} value={String(p)} className="text-xs">{p}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live Time Tracker (Timer) */}
          <div className="space-y-2 bg-slate-50/20 dark:bg-slate-900/10 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Live Timer
              </Label>
              <span className="font-mono text-xs font-bold text-foreground">{timerVal}</span>
            </div>
            {task.timerStartedAt ? (
              <Button size="xs" onClick={onStopTimer} className="w-full h-7 text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-1">
                <Square className="h-3 w-3 fill-white" /> Stop Timer
              </Button>
            ) : (
              <Button size="xs" onClick={onStartTimer} className="w-full h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1">
                <Play className="h-3 w-3 fill-white" /> Start Timer
              </Button>
            )}
          </div>

          {/* Estimated vs Actual Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Est. Hours</Label>
              <Input
                type="number"
                min="0"
                defaultValue={task.estimatedHours}
                onBlur={(e) => onMetaUpdate("estimatedHours", Number(e.target.value) || 0)}
                className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-[9px] font-bold text-slate-400 uppercase">Act. Hours</Label>
              <Input
                type="number"
                min="0"
                defaultValue={task.actualHours}
                onBlur={(e) => onMetaUpdate("actualHours", Number(e.target.value) || 0)}
                className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60"
              />
            </div>
          </div>

          {/* Health Index Card */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-semibold">Health Index:</span>
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5",
                health === "Healthy" ? "bg-emerald-500/10 text-emerald-500" :
                health === "At Risk" ? "bg-amber-500/10 text-amber-500" :
                "bg-rose-500/10 text-rose-500"
              )}>
                {health === "Healthy" && <CheckCircle2 className="h-2.5 w-2.5" />}
                {health === "At Risk" && <AlertTriangle className="h-2.5 w-2.5" />}
                {health === "Critical" && <AlertCircle className="h-2.5 w-2.5" />}
                {health}
              </span>
            </div>
          </div>

          {/* Time Variance Card */}
          {task.estimatedHours > 0 && (
            <div className="flex items-center justify-between pt-1.5 text-[10px]">
              <span className="text-slate-400 font-semibold">Time Variance:</span>
              <span className={cn(
                "font-bold",
                timeVariance >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {timeVariance >= 0 ? `+${timeVariance}h under` : `${timeVariance}h over`}
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Review & Recurrence */}
        <div className="bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-105 dark:border-slate-800/50">
            <RefreshCw className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-slate-700 dark:text-slate-350 text-xs">Review & Recurrence</h3>
          </div>

          {/* Recurrence Settings */}
          <div className="space-y-3 bg-slate-50/10 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Recurrence Settings
            </span>
            
            {/* Recurrence Pattern */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-slate-400">Pattern</label>
              <Select
                value={task.recurrencePattern || "none"}
                onValueChange={(val) => {
                  onMetaUpdate("recurrencePattern", val);
                  if (val !== "none" && !task.nextRecurrenceDate) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    onMetaUpdate("nextRecurrenceDate", tomorrow.toISOString().split("T")[0]);
                  }
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No Recurrence</SelectItem>
                  <SelectItem value="daily" className="text-xs">Daily</SelectItem>
                  <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
                  <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {task.recurrencePattern && task.recurrencePattern !== "none" && (
              <>
                {/* Recurrence Interval */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400">Repeat Every</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={task.recurrenceInterval || 1}
                      onChange={(e) => onMetaUpdate("recurrenceInterval", parseInt(e.target.value) || 1)}
                      className="h-7 text-xs w-20 bg-background"
                    />
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {task.recurrencePattern === "daily" ? "day(s)" :
                       task.recurrencePattern === "weekly" ? "week(s)" :
                       "month(s)"}
                    </span>
                  </div>
                </div>

                {/* Next Recurrence Date */}
                <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-400">Next Occurrence</label>
                  <Input
                    type="date"
                    value={task.nextRecurrenceDate ? task.nextRecurrenceDate.split("T")[0] : ""}
                    onChange={(e) => onMetaUpdate("nextRecurrenceDate", e.target.value || null)}
                    className="h-7 text-xs bg-background"
                  />
                </div>
              </>
            )}
          </div>

          {/* Supervisor Feedback / Reviews */}
          <div className="space-y-3 bg-slate-50/10 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Supervisor Reviews
            </span>

            {/* Approval Status */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-slate-400">Review Result</label>
              <Select value={task.approvalStatus || "Pending"} onValueChange={(val) => onMetaUpdate("approvalStatus", val)}>
                <SelectTrigger className="w-full h-8 text-xs bg-background border-slate-200/60 dark:border-slate-800/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending" className="text-xs">Pending Review</SelectItem>
                  <SelectItem value="Approved" className="text-xs">Approved</SelectItem>
                  <SelectItem value="Changes Requested" className="text-xs">Changes Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rating (1-5 clickable stars) */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-slate-400 block">Rating Score</label>
              <div className="flex gap-1 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    onClick={() => onMetaUpdate("reviewRating", star)}
                    className={cn(
                      "w-4 h-4 cursor-pointer transition-colors",
                      star <= (task.reviewRating || 0)
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300 dark:text-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Remarks/feedback text */}
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-slate-400">Remarks / Feedback</label>
              <Textarea
                placeholder="Provide supervisor feedback remarks..."
                defaultValue={task.reviewFeedback || ""}
                onBlur={(e) => onMetaUpdate("reviewFeedback", e.target.value)}
                className="text-[11px] min-h-[50px] resize-none bg-background p-1.5"
              />
            </div>
          </div>

          {/* Watchers / Followers Pane */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Eye className="h-3 w-3" /> Watchers ({watchersList.length})
              </Label>
              <button onClick={() => setIsAddingWatcher(!isAddingWatcher)} className="text-primary hover:underline text-[10px]">Add</button>
            </div>

            {isAddingWatcher && (
              <select
                onChange={(e) => { if (e.target.value) onAddWatcher(e.target.value); }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-1 py-0.5 text-xs"
                defaultValue=""
              >
                <option value="" disabled>Select User...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.fullNameEnglish}</option>
                ))}
              </select>
            )}

            <div className="flex flex-wrap gap-1 mt-1">
              {watchersList.map((watcherId) => {
                const empName = employees.find(e => e.id === watcherId)?.fullNameEnglish || "User";
                return (
                  <Badge key={watcherId} variant="outline" className="text-[10px] gap-1 px-1.5 py-0.5">
                    {empName.split(" ")[0]}
                    <button onClick={() => onRemoveWatcher(watcherId)} className="text-slate-400 hover:text-rose-500 font-bold">×</button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Audit Timestamps */}
          <div className="pt-2 text-[10px] text-slate-400 space-y-1 bg-slate-50/10 dark:bg-slate-900/10 p-2 rounded-lg border border-slate-200/40 dark:border-slate-800/40">
            <p>Created: <span className="font-semibold text-slate-700 dark:text-slate-350">{format(parseISO(task.createdAt), "MMM d, yyyy")}</span></p>
            <p>Modified: <span className="font-semibold text-slate-700 dark:text-slate-350">{format(parseISO(task.updatedAt), "MMM d, yyyy")}</span></p>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
