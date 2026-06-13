import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, LayoutGrid, Clock, Building2, CalendarClock, CalendarDays, Plus, Trash2, Calendar, ArrowRight, Sparkles } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState, useEffect } from "react"

// ─── Attendance Setup Types & Helpers ─────────────────────────────────────────
interface SetupHoliday {
  id: string
  name: string
  startDay: number
  endDay: number
}

const DAYS_IN_JUNE = 30
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

  const cells: (number | null)[] = []
  for (let i = 0; i < JUNE_OFFSET; i++) cells.push(null)
  for (let d = 1; d <= DAYS_IN_JUNE; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 text-center mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[9px] font-bold text-muted-foreground/60 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const { isStart, isEnd, inRange, isConflict } = getCellState(day)
          const isEdge = isStart || isEnd

          let cellClass = "relative flex items-center justify-center h-7 text-[11px] font-medium cursor-pointer transition-all"
          if (isEdge) cellClass += " z-10"
          if (inRange) cellClass += " bg-primary/10"

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

export default function SettingsPage() {
  const { theme, setTheme, sidebarSize, setSidebarSize } = useTheme()
  const [officeStartTime, setOfficeStartTime] = useState("09:00")
  const [officeEndTime, setOfficeEndTime] = useState("18:00")
  const [lateThreshold, setLateThreshold] = useState("15")

  // Attendance Setup States
  const [weeklyHolidays, setWeeklyHolidays] = useState<string[]>(["Saturday", "Sunday"])
  const [regularHolidays, setRegularHolidays] = useState<SetupHoliday[]>([
    { id: "default-1", name: "National Holiday - Independence Celebration", startDay: 18, endDay: 18 }
  ])
  const [pickStart, setPickStart] = useState<number | null>(null)
  const [pickEnd, setPickEnd] = useState<number | null>(null)
  const [newHolidayName, setNewHolidayName] = useState("")
  const [pickStep, setPickStep] = useState<"start" | "end">("start")

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

  const handleCalendarClick = (day: number) => {
    if (pickStep === "start") {
      setPickStart(day)
      setPickEnd(null)
      setPickStep("end")
    } else {
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

  const handleSaveOfficeSettings = () => {
    toast.success("Office settings saved!", {
      description: `Office hours: ${officeStartTime} - ${officeEndTime}`
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 shadow-none border border-border/40">
          <TabsTrigger value="attendance" className="text-xs">Attendance Setup</TabsTrigger>
          <TabsTrigger value="office" className="text-xs">Office Hours</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Holidays */}
            <Card className="shadow-none border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Weekly Holiday Settings
                </CardTitle>
                <CardDescription className="text-xs">
                  Select recurring weekly off days — reflects instantly on the calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1.5 pt-1">
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
              </CardContent>
            </Card>

            {/* Holiday Calendar */}
            <Card className="shadow-none border-border/40">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Holiday Date Range Picker
                </CardTitle>
                <CardDescription className="text-xs">
                  Click a start date, then an end date on the calendar to define a holiday range.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="office">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Office Hours & Attendance
              </CardTitle>
              <CardDescription>Configure work schedules and time tracking rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Office Hours */}
              <div className="space-y-4">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Standard Office Hours
                </Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={officeStartTime}
                      onChange={(e) => setOfficeStartTime(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={officeEndTime}
                      onChange={(e) => setOfficeEndTime(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Late Threshold */}
              <div className="space-y-4">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  Late Arrival Policy
                </Label>
                <div className="space-y-2">
                  <Label className="text-xs">Late Threshold (minutes)</Label>
                  <Input
                    type="number"
                    value={lateThreshold}
                    onChange={(e) => setLateThreshold(e.target.value)}
                    placeholder="15"
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Employees arriving more than {lateThreshold} minutes after {officeStartTime} will be marked as late
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveOfficeSettings} className="text-xs h-9">
                Save Office Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color Scheme */}
              <div className="space-y-2">
                <Label className="text-xs">Color Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-md border p-3 hover:border-primary/50 transition-all capitalize cursor-pointer",
                        theme === mode ? "border-primary bg-primary/5" : "border-border/40"
                      )}
                    >
                      <div className={`h-12 w-full rounded ${mode === "dark" ? "bg-gray-900" : mode === "light" ? "bg-white border border-border/30" : "bg-gradient-to-r from-white to-gray-900"}`} />
                      <span className="text-xs font-medium">{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* Sidebar layout sizing */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  Sidebar Layout Density
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "small", name: "Compact (Small)", desc: "Show only icons to maximize work area", preview: "w-10 bg-muted" },
                    { id: "large", name: "Standard (Large)", desc: "Show icons with names and full details", preview: "w-24 bg-muted" },
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSidebarSize(size.id as any)}
                      className={cn(
                        "flex flex-col items-start gap-2 text-left rounded-md border p-3.5 hover:border-primary/50 transition-all cursor-pointer",
                        sidebarSize === size.id ? "border-primary bg-primary/5" : "border-border/40"
                      )}
                    >
                      <div className="h-10 w-full rounded bg-background border border-border/20 flex gap-1 p-1">
                        <div className={cn("h-full rounded-sm transition-all duration-300", size.preview)} />
                        <div className="flex-1 flex flex-col gap-1 py-1">
                          <div className="h-2 w-3/4 rounded bg-muted/60" />
                          <div className="h-2 w-1/2 rounded bg-muted/30" />
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs font-medium text-foreground block">{size.name}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">{size.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
