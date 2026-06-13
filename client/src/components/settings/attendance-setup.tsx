import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar, CalendarDays, Clock, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
}

const DAYS_IN_JUNE = 30

function MiniCalendarPicker({
  startDay,
  endDay,
  onSelect,
  highlightedDays = []
}: {
  startDay: number | null
  endDay: number | null
  onSelect: (day: number) => void
  highlightedDays?: number[]
}) {
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  const isInRange = (day: number) => {
    if (startDay === null || endDay === null) return false
    return day >= Math.min(startDay, endDay) && day <= Math.max(startDay, endDay)
  }

  const isHighlighted = (day: number) => highlightedDays.includes(day)

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
        <div key={i} className="h-8 flex items-center justify-center text-[10px] font-semibold text-muted-foreground/50 uppercase">
          {day}
        </div>
      ))}
      {Array.from({ length: DAYS_IN_JUNE }, (_, i) => i + 1).map((day) => {
        const isStart = day === startDay || day === endDay
        const inRange = isInRange(day)
        const highlighted = isHighlighted(day)
        const isHovered = hoverDay === day
        
        return (
          <button
            key={day}
            type="button"
            onClick={() => onSelect(day)}
            onMouseEnter={() => setHoverDay(day)}
            onMouseLeave={() => setHoverDay(null)}
            className={cn(
              "h-8 w-full rounded-md text-xs font-medium transition-all relative",
              "hover:bg-primary/10 hover:text-primary",
              inRange && "bg-primary/20 text-primary",
              (isStart || highlighted) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground font-bold",
              isHovered && !inRange && !isStart && !highlighted && "ring-2 ring-primary/30"
            )}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

export function AttendanceSetup() {
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "h1", name: "Eid al-Adha", startDay: 6, endDay: 8 },
    { id: "h2", name: "Independence Day", startDay: 21, endDay: 21 },
    { id: "h3", name: "Summer Break", startDay: 25, endDay: 30 }
  ])
  const [pickStart, setPickStart] = useState<number | null>(null)
  const [pickEnd, setPickEnd] = useState<number | null>(null)

  const toggleWeeklyDay = (day: string) => {
    if (weeklyHolidays.includes(day)) {
      setWeeklyHolidays(weeklyHolidays.filter(d => d !== day))
    } else {
      setWeeklyHolidays([...weeklyHolidays, day])
    }
  }

  const handleDayClick = (day: number) => {
    if (pickStart === null || (pickStart !== null && pickEnd !== null)) {
      setPickStart(day)
      setPickEnd(null)
    } else {
      setPickEnd(day)
    }
  }

  const handleAddHolidayRange = () => {
    if (pickStart === null || pickEnd === null) {
      toast.error("Select start & end days", {
        description: "Click two dates on the calendar to define a range."
      })
      return
    }
    const start = Math.min(pickStart, pickEnd)
    const end = Math.max(pickStart, pickEnd)
    const name = prompt(`Holiday name for Jun ${start}–${end}:`)
    if (!name) return

    const newHoliday: SetupHoliday = {
      id: `h-${Date.now()}`,
      name,
      startDay: start,
      endDay: end
    }
    setRegularHolidays([...regularHolidays, newHoliday])
    setPickStart(null)
    setPickEnd(null)
    toast.success("Holiday added!", {
      description: `${name}: Jun ${start} – Jun ${end}`
    })
  }

  const handleDeleteHoliday = (id: string) => {
    setRegularHolidays(regularHolidays.filter(h => h.id !== id))
    toast.success("Holiday removed")
  }

  const handleSaveWeeklyHolidays = () => {
    toast.success("Weekly holidays saved!", {
      description: `Weekly off days: ${weeklyHolidays.join(", ")}`
    })
  }

  const highlightedDays = regularHolidays.flatMap(h => {
    const days: number[] = []
    for (let d = h.startDay; d <= h.endDay; d++) days.push(d)
    return days
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Weekly Holidays Card */}
      <Card className="shadow-none border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            Weekly Off Days
          </CardTitle>
          <CardDescription>Select recurring weekly holidays for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
              <button
                key={day}
                onClick={() => toggleWeeklyDay(day)}
                className={cn(
                  "h-10 rounded-lg border text-xs font-medium transition-all",
                  weeklyHolidays.includes(day)
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-card text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {day}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveWeeklyHolidays} className="w-full gap-2 h-9">
            Save Weekly Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Holiday Calendar Card */}
      <Card className="shadow-none border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5" />
            Holiday Calendar — June 2026
          </CardTitle>
          <CardDescription>Click a start day, then an end day to add a holiday range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MiniCalendarPicker
            startDay={pickStart}
            endDay={pickEnd}
            onSelect={handleDayClick}
            highlightedDays={highlightedDays}
          />

          <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border/20 p-3">
            <div className="text-xs">
              <p className="font-semibold text-foreground">
                {pickStart !== null && pickEnd === null && <>Select end day…</>}
                {pickStart !== null && pickEnd !== null && (
                  <>Jun {Math.min(pickStart, pickEnd)} – Jun {Math.max(pickStart, pickEnd)}</>
                )}
                {pickStart === null && <span className="text-muted-foreground">Click a start date</span>}
              </p>
            </div>
            <Button onClick={handleAddHolidayRange} disabled={pickStart === null || pickEnd === null} size="sm" className="h-8 gap-1.5 text-xs">
              <span>Add Holiday</span>
            </Button>
          </div>

          <Separator className="bg-border/30" />

          <div className="space-y-2.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Scheduled Holidays
            </Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {regularHolidays.length > 0 ? regularHolidays.map((holiday) => {
                const isMultiDay = holiday.startDay !== holiday.endDay
                const duration = holiday.endDay - holiday.startDay + 1
                return (
                  <div key={holiday.id} className="group flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2.5 hover:border-border/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate text-[11px]">{holiday.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Jun {holiday.startDay}{isMultiDay ? ` – Jun ${holiday.endDay}` : ""}, 2026
                          <span className="ml-1.5 text-violet-500 font-semibold">• {duration}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )
              }) : (
                <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/5 rounded-xl border border-dashed border-border/20">
                  <Calendar className="h-7 w-7 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No holidays configured yet.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Select a range on the calendar above to add one.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
