import { useState } from "react";
import type { Task, TaskProject } from "@/hooks/useTasks";
import { format, isBefore, parseISO } from "date-fns";
import {
  Clock,
  MessageSquare,
  CheckSquare,
  AlertCircle,
  Plus,
  X,
  User,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: Task[];
  projects: TaskProject[];
  employees: any[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task["status"]) => void;
  onQuickAdd: (title: string, status: Task["status"]) => void;
  groupBy: "none" | "assignee" | "priority";
  sortBy: "created" | "due" | "priority" | "title";
}

const STATUS_COLUMNS: Task["status"][] = [
  "Backlog",
  "Todo",
  "In Progress",
  "In Review",
  "Done",
  "Cancelled",
];

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export default function TaskBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  onQuickAdd,
  groupBy,
  sortBy,
}: TaskBoardProps) {
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [quickAddCol, setQuickAddCol] = useState<Task["status"] | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  // Sort helper
  const sortTasks = (taskList: Task[]) => {
    return [...taskList].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "priority") {
        return (PRIORITY_ORDER[a.priority] || 99) - (PRIORITY_ORDER[b.priority] || 99);
      }
      if (sortBy === "due") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Toggle Collapse
  const toggleCollapse = (status: string) => {
    const updated = new Set(collapsedCols);
    if (updated.has(status)) {
      updated.delete(status);
    } else {
      updated.add(status);
    }
    setCollapsedCols(updated);
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onStatusChange(taskId, status);
    }
  };

  // Render a Single Kanban Card
  const renderCard = (task: Task) => {
    const isOverdue =
      task.dueDate &&
      task.status !== "Done" &&
      task.status !== "Cancelled" &&
      isBefore(parseISO(task.dueDate), new Date());

    return (
      <div
        key={task.id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onClick={() => onTaskClick(task)}
        className={cn(
          "group relative flex flex-col p-4 rounded-xl border bg-white/40 dark:bg-slate-900/40 backdrop-blur-md cursor-grab active:cursor-grabbing",
          "hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
          isOverdue ? "border-rose-500/50 shadow-rose-500/5 bg-rose-500/5" : "border-slate-200/60 dark:border-slate-800/60"
        )}
      >
        {/* Card Body */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm line-clamp-2">
            {task.title}
          </h4>
          {task.priority === "Urgent" && (
            <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-500 uppercase tracking-wider animate-pulse">
              Urgent
            </span>
          )}
        </div>

        {task.description && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Progress Bar */}
        {task.progress > 0 && (
          <div className="mt-2.5 space-y-1">
            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
              <span>Work Progress</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.split(",").map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
              >
                <Tags className="w-2.5 h-2.5 mr-1" />
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Card Footer Info */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  isOverdue ? "text-rose-500 font-bold" : "text-slate-500"
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                {format(parseISO(task.dueDate), "MMM d")}
              </span>
            )}

            {task.subtasksTotal > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                {task.subtasksCompleted}/{task.subtasksTotal}
              </span>
            )}

            {task.commentsCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {task.commentsCount}
              </span>
            )}
          </div>

          {/* Assignee Avatar */}
          {task.assigneeId ? (
            <div className="flex items-center gap-1.5">
              {task.assigneePhotoUrl ? (
                <img
                  src={task.assigneePhotoUrl}
                  alt={task.assigneeName || ""}
                  className="w-5.5 h-5.5 rounded-full border border-slate-300/40 object-cover"
                />
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                  {task.assigneeName?.charAt(0) || "U"}
                </div>
              )}
            </div>
          ) : (
            <div className="w-5.5 h-5.5 rounded-full border border-dashed border-slate-300/60 dark:border-slate-700 flex items-center justify-center">
              <User className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render columns inside a swimlane (or standard view)
  const renderColumns = (columnTasks: Task[], swimlaneKey = "") => {
    return STATUS_COLUMNS.map((status) => {
      const isCollapsed = collapsedCols.has(status);
      const filteredTasks = sortTasks(columnTasks.filter((t) => t.status === status));
      const isOver = hoveredCol === `${swimlaneKey}-${status}`;

      if (isCollapsed) {
        return (
          <div
            key={status}
            onClick={() => toggleCollapse(status)}
            className="flex flex-col items-center py-4 w-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 cursor-pointer hover:bg-slate-100/30 transition-colors"
          >
            <span className="text-[11px] font-bold text-slate-500 [writing-mode:vertical-lr] tracking-widest uppercase">
              {status}
            </span>
            <span className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredTasks.length}
            </span>
          </div>
        );
      }

      return (
        <div
          key={status}
          onDragOver={(e) => {
            e.preventDefault();
            setHoveredCol(`${swimlaneKey}-${status}`);
          }}
          onDragLeave={() => setHoveredCol(null)}
          onDrop={(e) => handleDrop(e, status)}
          className={cn(
            "flex flex-col flex-1 min-w-[250px] p-3 rounded-xl border transition-all duration-200 bg-slate-50/10 dark:bg-slate-900/5",
            isOver
              ? "border-primary/80 ring-2 ring-primary/10 shadow-lg bg-primary/5"
              : "border-slate-200/50 dark:border-slate-800/50"
          )}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-2.5 h-2.5 rounded-full bg-gradient-to-r",
                  status === "Backlog" && "from-slate-400 to-slate-600",
                  status === "Todo" && "from-blue-400 to-blue-600",
                  status === "In Progress" && "from-amber-400 to-amber-600",
                  status === "In Review" && "from-purple-400 to-purple-600",
                  status === "Done" && "from-emerald-400 to-emerald-600",
                  status === "Cancelled" && "from-rose-400 to-rose-600"
                )}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {status}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                {filteredTasks.length}
              </span>
            </div>
            <button
              onClick={() => toggleCollapse(status)}
              className="text-slate-400 hover:text-slate-600 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/40"
            >
              Hide
            </button>
          </div>

          {/* Cards Area */}
          <div className="flex-1 flex flex-col gap-3 min-h-[300px] overflow-y-auto max-h-[600px] pr-1">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(renderCard)
            ) : (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-white/20 dark:bg-slate-900/10">
                <AlertCircle className="w-6 h-6 text-slate-400 mb-2" />
                <span className="text-xs text-slate-400 italic">No tasks</span>
              </div>
            )}

            {/* Quick Add Inline */}
            {quickAddCol === status ? (
              <div className="p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
                <input
                  type="text"
                  placeholder="Task title..."
                  className="w-full text-xs p-2 rounded border dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && quickTitle.trim()) {
                      onQuickAdd(quickTitle.trim(), status);
                      setQuickTitle("");
                      setQuickAddCol(null);
                    }
                  }}
                  autoFocus
                />
                <div className="flex justify-end gap-1.5 mt-2">
                  <button
                    onClick={() => setQuickAddCol(null)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (quickTitle.trim()) {
                        onQuickAdd(quickTitle.trim(), status);
                        setQuickTitle("");
                        setQuickAddCol(null);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setQuickAddCol(status)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Quick Add Task
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  // Render Swimlanes Grouping
  if (groupBy === "priority") {
    const priorities: Task["priority"][] = ["Urgent", "High", "Medium", "Low"];
    return (
      <div className="flex flex-col gap-6 w-full">
        {priorities.map((priority) => {
          const priorityTasks = tasks.filter((t) => t.priority === priority);
          return (
            <div
              key={priority}
              className="border border-slate-200/50 dark:border-slate-800/50 rounded-2xl bg-white/10 dark:bg-slate-900/5 overflow-hidden"
            >
              <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    priority === "Urgent" && "bg-rose-500/20 text-rose-500",
                    priority === "High" && "bg-orange-500/20 text-orange-500",
                    priority === "Medium" && "bg-blue-500/20 text-blue-500",
                    priority === "Low" && "bg-slate-500/20 text-slate-400"
                  )}
                >
                  {priority} Priority
                </span>
                <span className="text-xs text-slate-400">({priorityTasks.length} tasks)</span>
              </div>
              <div className="flex gap-4 p-4 overflow-x-auto">
                {renderColumns(priorityTasks, priority)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (groupBy === "assignee") {
    // Collect assignees
    const assignees = Array.from(new Set(tasks.map((t) => t.assigneeId))).filter(Boolean);
    const unassignedTasks = tasks.filter((t) => !t.assigneeId);

    return (
      <div className="flex flex-col gap-6 w-full">
        {assignees.map((assigneeId) => {
          const assigneeTasks = tasks.filter((t) => t.assigneeId === assigneeId);
          const assigneeName = assigneeTasks[0]?.assigneeName || "Contributor";
          const assigneePhoto = assigneeTasks[0]?.assigneePhotoUrl;

          return (
            <div
              key={assigneeId}
              className="border border-slate-200/50 dark:border-slate-800/50 rounded-2xl bg-white/10 dark:bg-slate-900/5 overflow-hidden"
            >
              <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-2.5">
                {assigneePhoto ? (
                  <img
                    src={assigneePhoto}
                    alt={assigneeName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold">
                    {assigneeName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {assigneeName}
                </span>
                <span className="text-xs text-slate-400">({assigneeTasks.length} tasks)</span>
              </div>
              <div className="flex gap-4 p-4 overflow-x-auto">
                {renderColumns(assigneeTasks, assigneeId || "")}
              </div>
            </div>
          );
        })}

        {unassignedTasks.length > 0 && (
          <div className="border border-slate-200/50 dark:border-slate-800/50 rounded-2xl bg-white/10 dark:bg-slate-900/5 overflow-hidden">
            <div className="p-3 bg-slate-100/40 dark:bg-slate-800/20 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Unassigned Tasks
              </span>
              <span className="text-xs text-slate-400">({unassignedTasks.length} tasks)</span>
            </div>
            <div className="flex gap-4 p-4 overflow-x-auto">
              {renderColumns(unassignedTasks, "unassigned")}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard Kanban View (No Grouping)
  return <div className="flex gap-4 overflow-x-auto pb-4 w-full">{renderColumns(tasks, "standard")}</div>;
}
