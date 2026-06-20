import type { Task } from "@/hooks/useTasks";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskWorkloadViewProps {
  tasks: Task[];
  employees: any[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function TaskWorkloadView({ tasks, employees }: TaskWorkloadViewProps) {
  // Aggregate stats per employee
  const employeeStats = employees.map((emp) => {
    const empTasks = tasks.filter((t) => t.assigneeId === emp.id);
    const completedTasks = empTasks.filter((t) => t.status === "Done").length;
    const estHours = empTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const actHours = empTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const capacityLimit = 40; // Default capacity limit is 40 hours

    // Generate day heatmap counts (based on task due day of week)
    const dayCounts = Array(7).fill(0);
    empTasks.forEach((t) => {
      if (t.dueDate) {
        const date = new Date(t.dueDate);
        const dayIdx = (date.getDay() + 6) % 7; // Align so Mon is 0, Sun is 6
        dayCounts[dayIdx]++;
      }
    });

    return {
      id: emp.id,
      name: emp.fullNameEnglish,
      photo: emp.employeePhotoUrl,
      taskCount: empTasks.length,
      completedCount: completedTasks,
      estimatedHours: estHours,
      actualHours: actHours,
      capacityLimit,
      dayCounts,
    };
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
          <span className="text-xs text-slate-500 font-medium">Total Tracked Hours</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)}h
            </span>
            <span className="text-xs text-slate-400">
              allocated of {tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)}h estimated
            </span>
          </div>
        </Card>
        <Card className="p-4 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
          <span className="text-xs text-slate-500 font-medium">Over-Capacity Employees</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-500">
              {employeeStats.filter((e) => e.estimatedHours > e.capacityLimit).length}
            </span>
            <span className="text-xs text-slate-400">workers exceeding 40h limit</span>
          </div>
        </Card>
        <Card className="p-4 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
          <span className="text-xs text-slate-500 font-medium">Task Completion Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-500">
              {tasks.length ? Math.round((tasks.filter((t) => t.status === "Done").length / tasks.length) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-400">overall workspace progress</span>
          </div>
        </Card>
      </div>

      {/* Capacity & Time Comparison List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">
            Team Capacity Allocation & Hours Meter
          </h3>
          <div className="flex flex-col gap-4.5">
            {employeeStats.map((stat) => {
              const isOver = stat.estimatedHours > stat.capacityLimit;
              const percent = Math.min(100, Math.round((stat.estimatedHours / stat.capacityLimit) * 100));

              return (
                <div key={stat.id} className="flex flex-col gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.photo ? (
                        <img src={stat.photo} alt={stat.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-semibold">
                          {stat.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{stat.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-slate-500">
                        {stat.actualHours}h / {stat.estimatedHours}h
                      </span>
                      {isOver && (
                        <span className="flex items-center gap-0.5 text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          <AlertCircle className="w-3 h-3" /> OVERLIMIT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Estimated vs Actual Progress Bars */}
                  <div className="flex flex-col gap-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", isOver ? "bg-rose-500" : "bg-primary")}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    {/* Actual work logged hours indicator */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.round((stat.actualHours / (stat.estimatedHours || 1)) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>Est: {percent}% of capacity</span>
                      <span>Actual log efficiency</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Weekly Workload Availability Heatmap */}
        <Card className="p-5 bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-4">
            Weekly Task Distribution Heatmap
          </h3>
          <div className="flex flex-col gap-3">
            {/* Heatmap Header */}
            <div className="grid grid-cols-8 gap-1.5 items-center text-center">
              <span className="text-[10px] font-bold text-slate-500 text-left">Member</span>
              {WEEKDAYS.map((day) => (
                <span key={day} className="text-[10px] font-bold text-slate-500">{day}</span>
              ))}
            </div>

            {/* Heatmap Rows */}
            {employeeStats.map((stat) => (
              <div key={stat.id} className="grid grid-cols-8 gap-1.5 items-center">
                <div className="flex items-center gap-1.5 text-left overflow-hidden">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={stat.name}>
                    {stat.name.split(" ")[0]}
                  </span>
                </div>

                {stat.dayCounts.map((count, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-all",
                      count === 0 && "bg-slate-100 dark:bg-slate-800/30 text-transparent",
                      count === 1 && "bg-primary/20 text-primary dark:text-primary-foreground",
                      count === 2 && "bg-primary/45 text-primary dark:text-primary-foreground",
                      count >= 3 && "bg-primary text-primary-foreground font-extrabold shadow-md scale-105"
                    )}
                    title={`${count} tasks scheduled on ${WEEKDAYS[idx]}`}
                  >
                    {count > 0 ? count : ""}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-6 text-[10px] text-slate-500 justify-end">
            <span>Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800/30" />
              <span>0 tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-primary/20" />
              <span>1 task</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-primary/45" />
              <span>2 tasks</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-primary" />
              <span>3+ tasks</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
