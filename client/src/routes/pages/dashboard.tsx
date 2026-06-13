import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Coffee,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleCheck,
  Plus,
  Star,
  GraduationCap,
  Heart,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Leave Balances ───────────────────────────────────────────────────────────
const leaveBalances = [
  { label: "Annual Leave", used: 8, total: 18, color: "bg-sky-500", light: "text-sky-500", icon: Coffee },
  { label: "Sick Leave", used: 2, total: 10, color: "bg-rose-500", light: "text-rose-500", icon: Heart },
  { label: "Casual Leave", used: 1, total: 5, color: "bg-amber-500", light: "text-amber-500", icon: Star },
  { label: "Training Leave", used: 0, total: 3, color: "bg-violet-500", light: "text-violet-500", icon: GraduationCap },
]

// ─── My Tasks ─────────────────────────────────────────────────────────────────
const initialTasks = [
  { id: 1, text: "Finalize Q2 feedback forms", priority: "high", due: "Today", done: false },
  { id: 2, text: "Update passport document copy", priority: "medium", due: "3 days", done: false },
  { id: 3, text: "Review new hire onboarding plan", priority: "medium", due: "Jun 20", done: false },
  { id: 4, text: "Submit travel reimbursement receipt", priority: "low", due: "Jun 18", done: true },
  { id: 5, text: "Complete React 19 cert module", priority: "low", due: "Jun 25", done: false },
]

// ─── Calendar Events ──────────────────────────────────────────────────────────
const calendarEvents: Record<number, { type: string; label: string }[]> = {
  11: [{ type: "meeting", label: "Monthly HR Sync @ 11:00 AM" }],
  14: [{ type: "leave", label: "Team: David Kim – On Leave" }],
  18: [{ type: "birthday", label: "🎂 Sara Chen's Birthday" }],
  22: [{ type: "meeting", label: "Q2 Retrospective @ 3:00 PM" }],
  25: [{ type: "deadline", label: "Expense Reports Due" }],
  29: [{ type: "holiday", label: "Company Picnic Day" }],
  30: [{ type: "payday", label: "💰 Payday!" }],
}

// ─── Helper styles ────────────────────────────────────────────────────────────
const eventTypeDot: Record<string, string> = {
  meeting: "bg-sky-500",
  leave: "bg-emerald-500",
  birthday: "bg-pink-500",
  deadline: "bg-rose-500",
  holiday: "bg-amber-500",
  payday: "bg-violet-500",
}

const priorityStyle: Record<string, string> = {
  high: "text-rose-500 bg-rose-500/10",
  medium: "text-amber-500 bg-amber-500/10",
  low: "text-emerald-500 bg-emerald-500/10",
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tasks, setTasks] = useState(initialTasks)
  const [calMonth, setCalMonth] = useState(5) // June (0-indexed)
  const [calYear] = useState(2026)
  const [selectedDay, setSelectedDay] = useState<number | null>(11)

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  // ── Timers ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const toggleTask = (id: number) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t))

  // ── Calendar ───────────────────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const startOffset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7
  const isCurrentMo = calMonth === currentTime.getMonth() && calYear === currentTime.getFullYear()
  const today = currentTime.getDate()

  // ── Computed ───────────────────────────────────────────────────────────────
  const doneTasks = tasks.filter(t => t.done).length
  const totalTasks = tasks.length
  const taskPct = Math.round((doneTasks / totalTasks) * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ══ Header Section ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ══ Main Grid: Calendar + Side Panels ═══════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Interactive Calendar (2/3) ─────────────────────────────────────── */}
        <Card className="lg:col-span-2 shadow-none border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">My Calendar</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{monthNames[calMonth]} {calYear}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalMonth(m => m === 0 ? 11 : m - 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalMonth(m => m === 11 ? 0 : m + 1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                <div key={d} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-2">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const events = calendarEvents[day] || []
                const isToday = isCurrentMo && day === today
                const isSel = day === selectedDay && calMonth === 5

                return (
                  <Tooltip key={`d-${day}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105",
                          isToday
                            ? "bg-primary text-primary-foreground font-extrabold shadow-md"
                            : isSel
                            ? "bg-primary/15 text-primary font-bold ring-1 ring-primary/30"
                            : "hover:bg-muted/60 text-foreground"
                        )}
                      >
                        <span>{day}</span>
                        {events.length > 0 && (
                          <div className="flex gap-0.5 mt-0.5">
                            {events.slice(0, 2).map((ev, ei) => (
                              <span
                                key={ei}
                                className={cn(
                                  "h-1 w-1 rounded-full",
                                  eventTypeDot[ev.type] || "bg-gray-400",
                                  isToday && "bg-primary-foreground/70"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {events.length > 0 && (
                      <TooltipContent side="top" className="text-xs max-w-[180px]">
                        {events.map((ev, ei) => <p key={ei} className="font-medium">{ev.label}</p>)}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-border/20">
              {[
                { type: "meeting", label: "Meeting", color: "bg-sky-500" },
                { type: "leave", label: "Leave", color: "bg-emerald-500" },
                { type: "birthday", label: "Birthday", color: "bg-pink-500" },
                { type: "deadline", label: "Deadline", color: "bg-rose-500" },
                { type: "holiday", label: "Holiday", color: "bg-amber-500" },
                { type: "payday", label: "Payday", color: "bg-violet-500" },
              ].map(l => (
                <div key={l.type} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", l.color)} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Right Sidebar: Leave + Tasks (1/3) ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* Leave Balance */}
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Coffee className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Leave Balance</CardTitle>
                    <p className="text-[10px] text-muted-foreground">Available days</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                  25 days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaveBalances.map((lb) => {
                const Icon = lb.icon
                const remaining = lb.total - lb.used
                const percentage = (remaining / lb.total) * 100
                return (
                  <div key={lb.label} className="p-2.5 rounded-xl bg-muted/20 border border-border/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-3.5 w-3.5", lb.light)} />
                        <span className="text-[11px] font-semibold">{lb.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-foreground">
                        {remaining} <span className="text-[9px] text-muted-foreground font-normal">/ {lb.total}d</span>
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card className="shadow-none border-border/40">
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
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {tasks.filter(t => !t.done).length} Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="text-primary">{taskPct}%</span>
                </div>
                <Progress value={taskPct} className="h-2 rounded-full" />
              </div>

              {/* Task items */}
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "group flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border",
                      task.done
                        ? "border-border/10 bg-muted/10 opacity-60"
                        : "border-border/20 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      task.done
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-border group-hover:border-primary"
                    )}>
                      {task.done && <CircleCheck className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[11px] font-medium truncate",
                        task.done ? "line-through text-muted-foreground" : ""
                      )}>
                        {task.text}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{task.due}</p>
                    </div>
                    <Badge className={cn("text-[9px] border-none font-semibold shrink-0", priorityStyle[task.priority])}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full h-9 text-[11px] font-semibold gap-1.5">
                <Plus className="h-3 w-3" /> Add Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
