import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CalendarClock,
  ChevronLeft,
  CalendarDays,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAYS_IN_JUNE = 30

// June 1, 2026 is a Monday → offset = 0
const JUNE_OFFSET = 0

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const getDurationLabel = (start: number, end: number) => {
  const count = end - start + 1
  return `${count} day${count !== 1 ? "s" : ""}`
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Mini Calendar Range Picker ───────────────────────────────────────────────
interface MiniCalendarPickerProps {
  startDay: number | null
  endDay: number | null
  onSelect: (day: number) => void
  highlightedDays?: number[]
}

function MiniCalendarPicker({ startDay, endDay, onSelect, highlightedDays = [] }: MiniCalendarPickerProps) {
  const [hoverDay, setHoverDay] = useState<number | null>(null)

  const getPreviewEnd = () => {
    if (startDay && !endDay && hoverDay) {
      return hoverDay >= startDay ? hoverDay : null
    }
    return endDay
  }

  const previewEnd = getPreviewEnd()

  const getCellState = (day: number) => {
    const isStart = day === startDay
    const isEnd = day === endDay || (startDay && !endDay && hoverDay === day && hoverDay >= startDay)
    const inRange = startDay && previewEnd && day > startDay && day < previewEnd
    const isConflict = highlightedDays.includes(day)
    return { isStart, isEnd, inRange, isConflict }
  }

  // Build 5-week grid (35 cells), June starts on Monday (cell 0)
  const cells: (number | null)[] = []
  for (let i = 0; i < JUNE_OFFSET; i++) cells.push(null)
  for (let d = 1; d <= DAYS_IN_JUNE; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      {/* Header */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[9px] font-bold text-muted-foreground/60 py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const { isStart, isEnd, inRange, isConflict } = getCellState(day)
          const isEdge = isStart || isEnd

          let cellClass = "relative flex items-center justify-center h-7 text-[11px] font-medium cursor-pointer transition-all"

          if (isEdge) {
            cellClass += " z-10"
          }
          if (inRange) {
            cellClass += " bg-primary/10"
          }

          let innerClass = "h-6 w-6 flex items-center justify-center rounded-full transition-all text-[11px] font-bold"
          if (isStart || isEnd) {
            innerClass += " bg-primary text-primary-foreground shadow-sm"
          } else if (inRange) {
            innerClass += " text-foreground"
          } else if (isConflict) {
            innerClass += " bg-violet-500/20 text-violet-500 ring-1 ring-violet-400/50"
          } else {
            innerClass += " text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }

          // Left/right round clip for range bar
          const isRangeStart = isStart && inRange !== false
          const isRangeEnd = isEnd

          return (
            <div
              key={day}
              className={cellClass}
              onClick={() => onSelect(day)}
              onMouseEnter={() => setHoverDay(day)}
              onMouseLeave={() => setHoverDay(null)}
            >
              {/* Range background bar */}
              {(inRange || (isRangeStart && previewEnd && day < previewEnd) || (isRangeEnd && startDay && day > startDay)) && (
                <div className={`absolute inset-y-0.5 bg-primary/10 ${
                  isStart ? "left-1/2 right-0" :
                  isEnd ? "left-0 right-1/2" :
                  "left-0 right-0"
                }`} />
              )}
              <span className={innerClass}>{day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AttendanceSetupPage() {
  const navigate = useNavigate()

  // Weekly Holiday States
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])

  // Regular Holiday States  
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "default-1", name: "National Holiday - Independence Celebration", startDay: 18, endDay: 18 }
  ])

  // Range picker states
  const [pickStart, setPickStart] = useState<number | null>(null)
  const [pickEnd, setPickEnd] = useState<number | null>(null)
  const [newHolidayName, setNewHolidayName] = useState("")
  const [pickStep, setPickStep] = useState<"start" | "end">("start")

  // Load from localStorage
  useEffect(() => {
    const savedWeekly = localStorage.getItem("hr_weekly_holidays")
    if (savedWeekly) {
      try { setWeeklyHolidays(JSON.parse(savedWeekly)) } catch (e) { console.error(e) }
    }
    const savedRegular = localStorage.getItem("hr_regular_holidays")
    if (savedRegular) {
      try { setRegularHolidays(JSON.parse(savedRegular)) } catch (e) { console.error(e) }
    }
  }, [])

  const saveToStorage = (weekly: string[], regular: SetupHoliday[]) => {
    localStorage.setItem("hr_weekly_holidays", JSON.stringify(weekly))
    localStorage.setItem("hr_regular_holidays", JSON.stringify(regular))
  }

  // Toggle Weekly Holiday
  const toggleWeeklyHoliday = (dayName: string) => {
    const updated = weeklyHolidays.includes(dayName)
      ? weeklyHolidays.filter(d => d !== dayName)
      : [...weeklyHolidays, dayName]
    setWeeklyHolidays(updated)
    saveToStorage(updated, regularHolidays)
    toast.info("Weekly holidays updated", {
      description: `${dayName} is now ${updated.includes(dayName) ? "a holiday" : "a working day"}.`
    })
  }

  // Calendar cell click handler (two-step: pick start then end)
  const handleCalendarClick = (day: number) => {
    if (pickStep === "start") {
      setPickStart(day)
      setPickEnd(null)
      setPickStep("end")
    } else {
      // If they click before the start, swap to new start
      if (day < (pickStart ?? day)) {
        setPickStart(day)
        setPickStep("end")
      } else {
        setPickEnd(day)
        setPickStep("start")
      }
    }
  }

  const resetPicker = () => {
    setPickStart(null)
    setPickEnd(null)
    setPickStep("start")
    setNewHolidayName("")
  }

  // All days already covered by existing holidays
  const conflictDays = regularHolidays.flatMap(h => {
    const days = []
    for (let d = h.startDay; d <= h.endDay; d++) days.push(d)
    return days
  })

  const handleAddHoliday = () => {
    if (!pickStart || !pickEnd) {
      toast.error("Please select a date range on the calendar first.")
      return
    }
    if (!newHolidayName.trim()) {
      toast.error("Please enter a holiday name.")
      return
    }

    const start = Math.min(pickStart, pickEnd)
    const end = Math.max(pickStart, pickEnd)

    // Check overlap
    const hasOverlap = regularHolidays.some(h => !(end < h.startDay || start > h.endDay))
    if (hasOverlap) {
      toast.error("Date range overlaps with an existing holiday.")
      return
    }

    const newHoliday: SetupHoliday = {
      id: generateId(),
      name: newHolidayName.trim(),
      startDay: start,
      endDay: end,
    }

    const updated = [...regularHolidays, newHoliday].sort((a, b) => a.startDay - b.startDay)
    setRegularHolidays(updated)
    saveToStorage(weeklyHolidays, updated)
    toast.success("Holiday added", {
      description: `"${newHoliday.name}" — Jun ${start}${end !== start ? ` to Jun ${end}` : ""} (${getDurationLabel(start, end)})`
    })
    resetPicker()
  }

  const handleDeleteHoliday = (id: string) => {
    const updated = regularHolidays.filter(h => h.id !== id)
    setRegularHolidays(updated)
    saveToStorage(weeklyHolidays, updated)
    toast.success("Holiday removed")
  }

  const isRangeReady = pickStart !== null && pickEnd !== null && pickEnd >= pickStart

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4 px-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate("/attendance")}
          className="h-9 w-9 rounded-xl border-border/40 bg-card hover:bg-muted/50 shrink-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Attendance Settings
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure weekly off days and holiday date ranges for the calendar
          </p>
        </div>
      </div>

      {/* ─── Two-column layout ─── */}
      <div className="grid gap-6 lg:grid-cols-2 px-1">

        {/* ── Col 1: Weekly Holidays ── */}
        <div className="rounded-2xl bg-card p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <CalendarClock className="h-4.5 w-4.5 text-primary" />
              Weekly Holiday Settings
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select recurring weekly off days — reflects instantly on the calendar.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName) => {
              const isActive = weeklyHolidays.includes(dayName)
              const abbr = dayName.slice(0, 3).toUpperCase()
              return (
                <button
                  key={dayName}
                  onClick={() => toggleWeeklyHoliday(dayName)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all text-left border ${
                    isActive
                      ? "bg-primary/10 border-primary/25 hover:bg-primary/15"
                      : "bg-transparent border-border/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {abbr.slice(0, 2)}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground">{dayName}</span>
                      <p className="text-[10px] text-muted-foreground">
                        {isActive ? "Recurring weekly holiday" : "Standard working day"}
                      </p>
                    </div>
                  </div>
                  <div className={`h-4.5 w-8 rounded-full relative transition-all ${isActive ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${isActive ? "left-4" : "left-0.5"}`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Col 2: Regular Holiday Calendar ── */}
        <div className="rounded-2xl bg-card p-5 space-y-5">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-primary" />
              Holiday Date Range Picker
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click a start date, then an end date on the calendar to define a holiday range.
            </p>
          </div>

          {/* Instruction chips */}
          <div className="flex items-center gap-2 text-[11px]">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              pickStep === "start" && !pickStart
                ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                : pickStart
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold"
                : "border-border/30 text-muted-foreground"
            }`}>
              <span className="h-4 w-4 rounded-full bg-current opacity-20 inline-block" />
              {pickStart ? `Jun ${pickStart}` : "Start Date"}
            </div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
              pickStep === "end" && pickStart
                ? "border-primary/50 bg-primary/10 text-primary font-semibold animate-pulse"
                : pickEnd
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 font-semibold"
                : "border-border/30 text-muted-foreground"
            }`}>
              <span className="h-4 w-4 rounded-full bg-current opacity-20 inline-block" />
              {pickEnd ? `Jun ${pickEnd}` : "End Date"}
            </div>
            {isRangeReady && (
              <Badge className="ml-auto bg-primary/10 text-primary border-primary/20 text-[10px]">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                {getDurationLabel(Math.min(pickStart!, pickEnd!), Math.max(pickStart!, pickEnd!))}
              </Badge>
            )}
          </div>

          {/* Mini Calendar */}
          <div className="rounded-xl border border-border/30 bg-muted/10 p-3">
            <MiniCalendarPicker
              startDay={pickStart}
              endDay={pickEnd}
              onSelect={handleCalendarClick}
              highlightedDays={conflictDays}
            />
          </div>

          {/* Holiday Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Holiday Name
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={isRangeReady
                  ? `e.g. Eid Holiday (Jun ${Math.min(pickStart!, pickEnd!)}–${Math.max(pickStart!, pickEnd!)})`
                  : "Select a date range first..."}
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                disabled={!isRangeReady}
                onKeyDown={(e) => e.key === "Enter" && handleAddHoliday()}
                className="h-9 rounded-xl border-border/40 bg-muted/20 text-xs text-foreground flex-1"
              />
              <Button
                onClick={handleAddHoliday}
                disabled={!isRangeReady || !newHolidayName.trim()}
                size="sm"
                className="h-9 gap-1.5 rounded-xl text-xs font-semibold shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {isRangeReady && (
              <button
                onClick={resetPicker}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Configured Holidays List */}
          <div className="space-y-2 pt-3 border-t border-border/20">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Configured Holidays ({regularHolidays.length})
            </h4>

            {regularHolidays.length > 0 ? (
              <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5">
                {regularHolidays.map((holiday) => {
                  const isMultiDay = holiday.endDay !== holiday.startDay
                  const duration = getDurationLabel(holiday.startDay, holiday.endDay)
                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/15 border border-border/20 text-xs group hover:border-border/40 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Date range chip */}
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="h-7 w-7 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center font-extrabold text-[11px]">
                            {holiday.startDay}
                          </div>
                          {isMultiDay && (
                            <>
                              <div className="h-0.5 w-3 bg-violet-300/50 rounded" />
                              <div className="h-7 w-7 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center font-extrabold text-[11px]">
                                {holiday.endDay}
                              </div>
                            </>
                          )}
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
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/5 rounded-xl border border-dashed border-border/20">
                <Calendar className="h-7 w-7 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No holidays configured yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">Select a range on the calendar above to add one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
