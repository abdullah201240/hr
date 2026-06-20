import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  format,
  parseISO,
  differenceInDays,
  addDays,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { AlertTriangle, Clock, Milestone, User } from "lucide-react";

interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependencyType: string;
  dependsOnTaskTitle?: string;
  dependsOnTaskStatus?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assigneeName: string | null;
  assigneePhotoUrl: string | null;
  progress: number;
  dependencies?: TaskDependency[];
}

interface TaskGanttViewProps {
  tasks: Task[];
  employees: any[];
  onTaskClick: (task: { id: string }) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Backlog: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60",
  Todo: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/40",
  "In Progress": "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
  "In Review": "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
  Done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
  Cancelled: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/40",
};

const BAR_COLORS: Record<string, string> = {
  Backlog: "bg-slate-400 dark:bg-slate-600",
  Todo: "bg-blue-500 dark:bg-blue-600",
  "In Progress": "bg-indigo-500 dark:bg-indigo-600",
  "In Review": "bg-amber-500 dark:bg-amber-600",
  Done: "bg-emerald-500 dark:bg-emerald-600",
  Cancelled: "bg-rose-500 dark:bg-rose-600",
};

export default function TaskGanttView({ tasks, onTaskClick }: TaskGanttViewProps) {
  // 1. Calculate the start and end dates for the Gantt timeline
  const timelineRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date());
      return {
        start: today,
        end: addDays(today, 30),
        days: Array.from({ length: 31 }, (_, i) => addDays(today, i)),
      };
    }

    let minDate = new Date();
    let maxDate = addDays(new Date(), 30);

    const taskDates = tasks
      .map((t) => {
        const start = startOfDay(parseISO(t.createdAt));
        const end = t.dueDate ? startOfDay(parseISO(t.dueDate)) : addDays(start, 7);
        return { start, end };
      });

    if (taskDates.length > 0) {
      minDate = new Date(Math.min(...taskDates.map((d) => d.start.getTime())));
      maxDate = new Date(Math.max(...taskDates.map((d) => d.end.getTime())));
    }

    // Pad range by 5 days on both sides
    const timelineStart = addDays(minDate, -5);
    const timelineEnd = addDays(maxDate, 10);
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    
    // Cap timeline at max 90 days to prevent browser rendering crash
    const rangeDays = Math.min(totalDays, 90);
    const daysArray = Array.from({ length: rangeDays }, (_, i) => addDays(timelineStart, i));

    return {
      start: timelineStart,
      end: addDays(timelineStart, rangeDays - 1),
      days: daysArray,
    };
  }, [tasks]);

  // 2. Prep tasks with specific timeline offsets
  const renderedTasks = useMemo(() => {
    const totalTimelineDays = timelineRange.days.length;
    
    return tasks.map((t) => {
      const createdDate = startOfDay(parseISO(t.createdAt));
      const dueDate = t.dueDate ? startOfDay(parseISO(t.dueDate)) : addDays(createdDate, 7);

      // Bound dates within timeline
      const taskStart = createdDate < timelineRange.start ? timelineRange.start : createdDate;
      const taskEnd = dueDate > timelineRange.end ? timelineRange.end : dueDate;

      const offsetDays = differenceInDays(taskStart, timelineRange.start);
      const durationDays = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

      const leftPct = (offsetDays / totalTimelineDays) * 100;
      const widthPct = (durationDays / totalTimelineDays) * 100;

      return {
        ...t,
        leftPct,
        widthPct,
        startDate: format(createdDate, "MMM d"),
        endDate: format(dueDate, "MMM d"),
      };
    });
  }, [tasks, timelineRange]);

  if (tasks.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
        <Milestone className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No tasks in this workspace</h4>
        <p className="text-slate-400 text-xs mt-1">Create tasks with start and due dates to generate a Gantt timeline.</p>
      </div>
    );
  }

  const dayColWidth = 55; // width of each day column in pixels
  const timelineWidth = timelineRange.days.length * dayColWidth;

  return (
    <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden flex flex-col w-full min-w-0">
      {/* Scroll Wrapper */}
      <div className="overflow-x-auto flex flex-col w-full min-w-0 scrollbar-thin">
        {/* Gantt View Container */}
        <div style={{ width: `${timelineWidth + 300}px` }} className="flex flex-col">
          {/* Header row */}
          <div className="flex bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60">
            {/* Sidebar header spacer */}
            <div className="w-[300px] shrink-0 border-r border-slate-200/60 dark:border-slate-800/60 p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Task Details
            </div>
            
            {/* Days columns headers */}
            <div className="flex-1 flex items-center">
              {timelineRange.days.map((day, idx) => {
                const isFirstOfMonth = idx === 0 || day.getDate() === 1;
                return (
                  <div
                    key={idx}
                    style={{ width: `${dayColWidth}px` }}
                    className={cn(
                      "shrink-0 text-center flex flex-col justify-center py-2 select-none border-r border-slate-200/20 dark:border-slate-800/20 last:border-r-0",
                      isWithinInterval(new Date(), { start: day, end: day }) && "bg-primary/5 text-primary"
                    )}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[8px] font-black text-primary dark:text-primary uppercase tracking-wider block leading-none mb-0.5">
                        {format(day, "MMM")}
                      </span>
                    )}
                    <span className="text-[10px] font-black">{format(day, "d")}</span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase">{format(day, "eee")[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-200/30 dark:divide-slate-800/30">
            {renderedTasks.map((task) => (
              <div key={task.id} className="flex hover:bg-slate-50/30 dark:hover:bg-slate-900/20 items-stretch transition-colors">
                {/* Left side: Task Summary info */}
                <div
                  className="w-[300px] shrink-0 border-r border-slate-200/60 dark:border-slate-800/60 p-3 flex flex-col justify-between cursor-pointer group"
                  onClick={() => onTaskClick({ id: task.id })}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors line-clamp-1">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge className={cn("text-[8px] font-extrabold border px-1 py-0 shadow-none uppercase", STATUS_COLORS[task.status])}>
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-semibold text-slate-400">
                        {task.priority} Priority
                      </Badge>
                      {task.progress > 0 && (
                        <span className="text-[9px] font-bold text-emerald-500">
                          {task.progress}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold mt-2.5">
                    <span className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5" />
                      {task.assigneeName || "Unassigned"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {task.startDate} - {task.endDate}
                    </span>
                  </div>
                </div>

                {/* Right side: Gantt plot bars */}
                <div className="flex-1 relative flex items-center min-h-[56px] select-none">
                  {/* Grid Lines Spacer */}
                  <div className="absolute inset-0 flex">
                    {timelineRange.days.map((_, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${dayColWidth}px` }}
                        className="shrink-0 h-full border-r border-slate-200/10 dark:border-slate-800/10 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* Horizontal visual bar */}
                  <div
                    style={{
                      left: `${task.leftPct}%`,
                      width: `${task.widthPct}%`,
                      minWidth: "24px",
                    }}
                    className={cn(
                      "absolute h-7 rounded-xl flex flex-col justify-between overflow-hidden shadow-sm border border-slate-200/10 dark:border-slate-800/10 group cursor-pointer hover:shadow transition-shadow",
                      BAR_COLORS[task.status] || "bg-primary"
                    )}
                    onClick={() => onTaskClick({ id: task.id })}
                    title={`${task.title} (${task.progress}% Done)`}
                  >
                    {/* Darker Inner bar for progress */}
                    <div
                      className="absolute inset-y-0 left-0 bg-black/10 dark:bg-white/10"
                      style={{ width: `${task.progress}%` }}
                    />
                    
                    <div className="relative z-10 px-2.5 h-full flex items-center justify-between">
                      <span className="text-[10px] text-white font-bold truncate pr-2">
                        {task.title}
                      </span>
                      {task.dependencies && task.dependencies.length > 0 && (
                        <Badge className="bg-rose-500/20 text-rose-100 hover:bg-rose-500/20 border-none text-[8px] font-black h-4 px-1 rounded flex items-center gap-0.5">
                          <AlertTriangle className="h-2 w-2" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend footer */}
      <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30 flex flex-wrap gap-4 text-[10px] font-semibold text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-blue-500" /> Todo
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-indigo-500" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-amber-500" /> In Review
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-emerald-500" /> Done
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded bg-slate-400" /> Backlog / Cancelled
        </span>
      </div>
    </div>
  );
}
