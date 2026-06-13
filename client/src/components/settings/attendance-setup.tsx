import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Calendar as CalendarIcon, CalendarDays, Clock, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import type { DateRange } from "react-day-picker"
import { format, differenceInDays, startOfDay } from "date-fns"

interface SetupHoliday {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

export function AttendanceSetup() {
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "h1", name: "Eid al-Adha", startDate: new Date(2026, 5, 6), endDate: new Date(2026, 5, 8) },
    { id: "h2", name: "Independence Day", startDate: new Date(2026, 5, 21), endDate: new Date(2026, 5, 21) },
    { id: "h3", name: "Summer Break", startDate: new Date(2026, 5, 25), endDate: new Date(2026, 5, 30) }
  ])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [holidayName, setHolidayName] = useState("")

  // Load from localStorage on mount
  useEffect(() => {
    const savedWeekly = localStorage.getItem("hr_weekly_holidays")
    if (savedWeekly) {
      try {
        setWeeklyHolidays(JSON.parse(savedWeekly))
      } catch (e) {
        console.error(e)
      }
    }

    const savedRegular = localStorage.getItem("hr_regular_holidays")
    if (savedRegular) {
      try {
        const parsed = JSON.parse(savedRegular)
        const formatted = parsed.map((h: any) => ({
          ...h,
          startDate: h.startDate ? new Date(h.startDate) : new Date(2026, 5, h.startDay),
          endDate: h.endDate ? new Date(h.endDate) : new Date(2026, 5, h.endDay)
        }))
        setRegularHolidays(formatted)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const toggleWeeklyDay = (day: string) => {
    if (weeklyHolidays.includes(day)) {
      setWeeklyHolidays(weeklyHolidays.filter(d => d !== day))
    } else {
      setWeeklyHolidays([...weeklyHolidays, day])
    }
  }

  const handleSaveWeeklyHolidays = () => {
    localStorage.setItem("hr_weekly_holidays", JSON.stringify(weeklyHolidays))
    toast.success("Weekly holidays saved!", {
      description: `Weekly off days: ${weeklyHolidays.join(", ")}`
    })
  }

  const saveRegularHolidays = (updated: SetupHoliday[]) => {
    setRegularHolidays(updated)
    const toSave = updated.map(h => ({
      id: h.id,
      name: h.name,
      startDate: h.startDate.toISOString(),
      endDate: h.endDate.toISOString(),
      startDay: h.startDate.getDate(),
      endDay: h.endDate.getDate()
    }))
    localStorage.setItem("hr_regular_holidays", JSON.stringify(toSave))
  }

  const handleAddHolidayRange = () => {
    if (!dateRange?.from) {
      toast.error("Select start & end days", {
        description: "Click a range of dates on the calendar."
      })
      return
    }

    if (!holidayName.trim()) {
      toast.error("Please enter a holiday name", {
        description: "Enter a name for this holiday before adding."
      })
      return
    }

    const start = startOfDay(dateRange.from)
    const end = startOfDay(dateRange.to || dateRange.from)

    // Check for overlap
    const hasOverlap = regularHolidays.some(h => {
      const hStart = startOfDay(h.startDate)
      const hEnd = startOfDay(h.endDate)
      return !(end < hStart || start > hEnd)
    })

    if (hasOverlap) {
      toast.error("Overlap Detected", {
        description: "Date range overlaps with an existing holiday."
      })
      return
    }

    const newHoliday: SetupHoliday = {
      id: `h-${Date.now()}`,
      name: holidayName.trim(),
      startDate: start,
      endDate: end
    }

    const updated = [...regularHolidays, newHoliday]
    saveRegularHolidays(updated)
    setDateRange(undefined)
    setHolidayName("")
    toast.success("Holiday added!", {
      description: `${newHoliday.name}: ${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`
    })
  }

  const handleDeleteHoliday = (id: string) => {
    const updated = regularHolidays.filter(h => h.id !== id)
    saveRegularHolidays(updated)
    toast.success("Holiday removed")
  }

  const resetSelection = () => {
    setDateRange(undefined)
    setHolidayName("")
  }

  // Modifiers for highlighting saved holidays on the calendar
  const modifiers = {
    holiday: (date: Date) => {
      return regularHolidays.some(h => {
        const d = startOfDay(date).getTime()
        const start = startOfDay(h.startDate).getTime()
        const end = startOfDay(h.endDate).getTime()
        return d >= start && d <= end
      })
    }
  }

  const modifiersClassNames = {
    holiday: "bg-violet-500/10 text-violet-500 border border-violet-500/30 rounded-md font-semibold hover:bg-violet-500/20"
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Weekly Holidays Card */}
      <Card className="shadow-none border border-border/40">
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
                  "h-10 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                  weeklyHolidays.includes(day)
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : "bg-card text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {day}
              </button>
            ))}
          </div>
          <Button onClick={handleSaveWeeklyHolidays} className="w-full gap-2 h-9 cursor-pointer">
            Save Weekly Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Holiday Calendar Card */}
      <Card className="shadow-none border border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-5 w-5" />
            Holiday Calendar
          </CardTitle>
          <CardDescription>Select a date range on the calendar to configure a holiday</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Calendar Picker */}
          <div className="flex justify-center border border-border/30 rounded-xl p-3 bg-muted/5">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md"
            />
          </div>

          {/* Holiday Name Input */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Holiday Name</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={dateRange?.from
                  ? `e.g. Eid Holiday (${format(dateRange.from, "MMM d")} – ${dateRange.to ? format(dateRange.to, "MMM d") : "..."})`
                  : "Select date range first..."}
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                disabled={!dateRange?.from}
                onKeyDown={(e) => e.key === "Enter" && handleAddHolidayRange()}
                className="h-9 flex-1"
              />
              <Button 
                onClick={handleAddHolidayRange} 
                disabled={!dateRange?.from || !holidayName.trim()}
                size="sm" 
                className="h-9 gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            
            {/* Range Display */}
            {dateRange?.from && (
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">
                    Start: {format(dateRange.from, "MMM d, yyyy")}
                  </span>
                  {dateRange.to && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">
                        End: {format(dateRange.to, "MMM d, yyyy")}
                      </span>
                    </>
                  )}
                  {!dateRange.to && (
                    <span className="text-muted-foreground italic">Select end date...</span>
                  )}
                </div>
                <button
                  onClick={resetSelection}
                  className="text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          <Separator className="bg-border/30" />

          {/* Scheduled Holidays List */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Scheduled Holidays
            </Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {regularHolidays.length > 0 ? (
                regularHolidays
                  .slice()
                  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
                  .map((holiday) => {
                    const duration = differenceInDays(holiday.endDate, holiday.startDate) + 1
                    const isMultiDay = duration > 1

                    return (
                      <div 
                        key={holiday.id} 
                        className="group flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2.5 hover:border-border/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate text-[11px]">{holiday.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {format(holiday.startDate, "MMM d")}
                              {isMultiDay ? ` – ${format(holiday.endDate, "MMM d, yyyy")}` : `, ${format(holiday.startDate, "yyyy")}`}
                              <span className="ml-1.5 text-violet-500 font-semibold">• {duration} {duration === 1 ? 'day' : 'days'}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/5 rounded-xl border border-dashed border-border/20">
                  <CalendarIcon className="h-7 w-7 text-muted-foreground/40 mb-2" />
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
