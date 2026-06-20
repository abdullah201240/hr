import { CalendarCheck, Clock, CalendarX, Palmtree, CalendarDays } from "lucide-react"

interface AttendanceKPIProps {
  counts: {
    present: number
    late: number
    absent: number
    leave: number
    holiday: number
    weekend: number
  }
}

export function AttendanceKPIs({ counts }: AttendanceKPIProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
          <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{counts.present}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CalendarCheck className="h-5 w-5" />
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late</span>
          <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{counts.late}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Clock className="h-5 w-5" />
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absent</span>
          <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{counts.absent}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
          <CalendarX className="h-5 w-5" />
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">On Leave</span>
          <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-500">{counts.leave}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
          <Palmtree className="h-5 w-5" />
        </div>
      </div>
      <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40 col-span-2 sm:col-span-1">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Holiday / Off</span>
          <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-500">
            {counts.holiday + counts.weekend}
          </p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
          <CalendarDays className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
