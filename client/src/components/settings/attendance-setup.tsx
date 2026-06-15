import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  CalendarIcon,
  CalendarDays,
  Clock,
  Trash2,
  Plus,
  Pencil,
  X,
  CalendarOff,
  Briefcase,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  format,
  differenceInDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns"
import {
  useAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
  useHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} from "@/hooks/useAttendanceSettings"
import type { Holiday } from "@/types"

// ─── Helpers ───────────────────────────────────────────────────────────────────
const DAY_INDEX_TO_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function parseHolidayDate(d: string): Date {
  return new Date(d + "T00:00:00")
}

export function AttendanceSetup() {
  const [holidayName, setHolidayName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  // ─── API hooks ───────────────────────────────────────────────────────────
  const settingsQuery = useAttendanceSettingsQuery()
  const holidaysQuery = useHolidaysQuery()
  const updateSettingsMut = useUpdateAttendanceSettingsMutation()
  const createHolidayMut = useCreateHolidayMutation()
  const updateHolidayMut = useUpdateHolidayMutation()
  const deleteHolidayMut = useDeleteHolidayMutation()

  // ─── Derived data ────────────────────────────────────────────────────────
  const weeklyHolidays = settingsQuery.data?.weeklyHolidays ?? ["Saturday", "Sunday"]
  const holidays: Holiday[] = holidaysQuery.data ?? []

  // Convert holidays to Date-based for display
  const regularHolidays = useMemo(
    () =>
      holidays.map((h) => ({
        ...h,
        startDateObj: parseHolidayDate(h.startDate),
        endDateObj: parseHolidayDate(h.endDate),
      })),
    [holidays],
  )

  const isLoading = settingsQuery.isLoading || holidaysQuery.isLoading
  const isSavingSettings = updateSettingsMut.isPending
  const isCreatingHoliday = createHolidayMut.isPending
  const isUpdatingHoliday = updateHolidayMut.isPending
  const isDeletingHoliday = deleteHolidayMut.isPending
  const isMutating = isCreatingHoliday || isUpdatingHoliday

  // ─── Weekly Holidays ────────────────────────────────────────────────────
  const toggleWeeklyDay = (day: string) => {
    const updated = weeklyHolidays.includes(day)
      ? weeklyHolidays.filter((d) => d !== day)
      : [...weeklyHolidays, day]

    updateSettingsMut.mutate(
      { weeklyHolidays: updated },
      {
        onSuccess: () => {
          toast.info("Weekly holidays updated", {
            description: `${day} is now ${updated.includes(day) ? "a holiday" : "a working day"}.`,
          })
        },
        onError: () => {
          toast.error("Failed to update weekly holidays")
        },
      },
    )
  }

  // ─── Holiday CRUD ───────────────────────────────────────────────────────
  const handleAddHoliday = () => {
    if (!startDate) {
      toast.error("Start date required", {
        description: "Please select a start date.",
      })
      return
    }

    if (!holidayName.trim()) {
      toast.error("Enter a holiday name", {
        description: "Please name this holiday before adding.",
      })
      return
    }

    const start = startOfDay(new Date(startDate))
    const end = endDate ? startOfDay(new Date(endDate)) : start

    if (end < start) {
      toast.error("Invalid date range", {
        description: "End date cannot be before start date.",
      })
      return
    }

    // Check for overlap (exclude the holiday being edited)
    const hasOverlap = regularHolidays.some((h) => {
      if (editingId && h.id === editingId) return false
      const hStart = startOfDay(h.startDateObj)
      const hEnd = startOfDay(h.endDateObj)
      return !(end < hStart || start > hEnd)
    })

    if (hasOverlap) {
      toast.error("Date overlap detected", {
        description: "This range conflicts with an existing holiday.",
      })
      return
    }

    const startStr = format(start, "yyyy-MM-dd")
    const endStr = format(end, "yyyy-MM-dd")

    // Edit mode — update existing holiday
    if (editingId) {
      updateHolidayMut.mutate(
        { id: editingId, payload: { name: holidayName.trim(), startDate: startStr, endDate: endStr } },
        {
          onSuccess: () => {
            const duration = differenceInDays(end, start) + 1
            toast.success("Holiday updated!", {
              description: `"${holidayName.trim()}" — ${format(start, "MMM d")} to ${format(end, "MMM d, yyyy")} (${duration} ${duration === 1 ? "day" : "days"})`,
            })
            resetForm()
          },
          onError: () => {
            toast.error("Failed to update holiday")
          },
        },
      )
      return
    }

    // Create mode — add new holiday
    createHolidayMut.mutate(
      { name: holidayName.trim(), startDate: startStr, endDate: endStr },
      {
        onSuccess: () => {
          const duration = differenceInDays(end, start) + 1
          toast.success("Holiday added!", {
            description: `"${holidayName.trim()}" — ${format(start, "MMM d")} to ${format(end, "MMM d, yyyy")} (${duration} ${duration === 1 ? "day" : "days"})`,
          })
          resetForm()
        },
        onError: () => {
          toast.error("Failed to add holiday")
        },
      },
    )
  }

  const handleDeleteHoliday = (id: string) => {
    deleteHolidayMut.mutate(id, {
      onSuccess: () => {
        // If we were editing this holiday, exit edit mode
        if (editingId === id) resetForm()
        toast.success("Holiday removed")
      },
      onError: () => {
        toast.error("Failed to remove holiday")
      },
    })
  }

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingId(holiday.id)
    setHolidayName(holiday.name)
    setStartDate(holiday.startDate)
    setEndDate(holiday.endDate !== holiday.startDate ? holiday.endDate : "")
  }

  const resetForm = () => {
    setEditingId(null)
    setHolidayName("")
    setStartDate("")
    setEndDate("")
  }

  // ─── Summary stats ─────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const now = new Date()
    const mStart = startOfMonth(now)
    const mEnd = endOfMonth(now)
    const days = eachDayOfInterval({ start: mStart, end: mEnd })

    let workingDays = 0
    let weekendDays = 0
    let holidayDays = 0

    for (const day of days) {
      const dayName = DAY_INDEX_TO_NAME[getDay(day)]
      const dayTime = startOfDay(day).getTime()

      const isRegularHoliday = regularHolidays.some((h) => {
        const s = startOfDay(h.startDateObj).getTime()
        const e = startOfDay(h.endDateObj).getTime()
        return dayTime >= s && dayTime <= e
      })

      const isWeeklyHoliday = weeklyHolidays.includes(dayName)

      if (isRegularHoliday) {
        holidayDays++
      } else if (isWeeklyHoliday) {
        weekendDays++
      } else {
        workingDays++
      }
    }

    return { workingDays, weekendDays, holidayDays, total: days.length }
  }, [weeklyHolidays, regularHolidays])

  // ─── Sorted holidays list ──────────────────────────────────────────────
  const sortedHolidays = useMemo(
    () => [...regularHolidays].sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime()),
    [regularHolidays],
  )

  // ─── Computed range info ──────────────────────────────────────────────
  const rangeStart = startDate ? startOfDay(new Date(startDate)) : null
  const rangeEnd = endDate ? startOfDay(new Date(endDate)) : null
  const rangeDays = rangeStart && rangeEnd ? differenceInDays(rangeEnd, rangeStart) + 1 : null
  const canAdd = !!startDate && !!holidayName.trim()

  // ─── Loading state ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading attendance settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Summary Cards ─── */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="shadow-none border border-border/30 bg-emerald-500/[0.04]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{summary.workingDays}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Working Days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/30 bg-orange-500/[0.04]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <CalendarOff className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{summary.weekendDays}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Weekly Off Days
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border/30 bg-violet-500/[0.04]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{summary.holidayDays}</p>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Holidays ({format(new Date(), "MMM")})
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Weekly Holidays Card ── */}
        <Card className="shadow-none border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Weekly Off Days
            </CardTitle>
            <CardDescription>
              Select recurring weekly holidays — reflects instantly on the attendance calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                (dayName) => {
                  const isActive = weeklyHolidays.includes(dayName)
                  const abbr = dayName.slice(0, 3).toUpperCase()
                  return (
                    <button
                      key={dayName}
                      onClick={() => toggleWeeklyDay(dayName)}
                      disabled={isSavingSettings}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all text-left border",
                        isActive
                          ? "bg-primary/10 border-primary/25 hover:bg-primary/15"
                          : "bg-transparent border-border/30 hover:bg-muted/30",
                        isSavingSettings && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {abbr.slice(0, 2)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground">{dayName}</span>
                          <p className="text-[10px] text-muted-foreground">
                            {isActive ? "Recurring weekly holiday" : "Standard working day"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "h-4.5 w-8 rounded-full relative transition-all",
                          isActive ? "bg-primary" : "bg-muted",
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow transition-all",
                            isActive ? "left-4" : "left-0.5",
                          )}
                        />
                      </div>
                    </button>
                  )
                },
              )}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {weeklyHolidays.length} off day{weeklyHolidays.length !== 1 ? "s" : ""} per week —{" "}
                {weeklyHolidays.join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── Holiday Setup Card ── */}
        <Card className="shadow-none border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Holiday Setup
            </CardTitle>
            <CardDescription>
              Add holidays with a name, start date, and optional end date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Editing indicator + cancel */}
            {editingId && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-2">
                  <Pencil className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-semibold text-primary">Editing holiday</span>
                </div>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            )}

            {/* Holiday Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Holiday Name</Label>
              <Input
                type="text"
                placeholder="e.g. Eid al-Adha, Independence Day"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (endDate && e.target.value > endDate) setEndDate(e.target.value)
                  }}
                  className="h-10"
                />
              </div>

              <div className="flex items-end pb-2.5">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Same as start"
                  className="h-10"
                />
              </div>
            </div>

            {/* Range preview */}
            {rangeStart && (
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {format(rangeStart, "MMM d, yyyy")}
                  </Badge>
                  {rangeEnd && rangeDays && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {format(rangeEnd, "MMM d, yyyy")}
                      </Badge>
                      <span className="text-muted-foreground font-semibold">
                        ({rangeDays} {rangeDays === 1 ? "day" : "days"})
                      </span>
                    </>
                  )}
                  {!rangeEnd && (
                    <span className="text-muted-foreground italic">Single day (same as start)</span>
                  )}
                </div>
                <button
                  onClick={resetForm}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear
                </button>
              </div>
            )}

            <Button
              onClick={handleAddHoliday}
              disabled={!canAdd || isMutating}
              className={cn(
                "w-full gap-2 h-10",
                editingId && "bg-primary/90",
              )}
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}{" "}
              {editingId ? "Update Holiday" : "Add Holiday"}
            </Button>

            <Separator className="bg-border/30" />

            {/* ── Scheduled Holidays List ── */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Scheduled Holidays
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  {holidays.length} configured
                </Badge>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {sortedHolidays.length > 0 ? (
                  sortedHolidays.map((holiday) => {
                    const duration = differenceInDays(holiday.endDateObj, holiday.startDateObj) + 1
                    const isMultiDay = duration > 1
                    const isEditing = editingId === holiday.id

                    return (
                      <div
                        key={holiday.id}
                        className={cn(
                          "group flex items-center justify-between rounded-lg border bg-card px-3 py-2.5 transition-colors",
                          isEditing
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/30 hover:border-border/50",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="h-7 w-7 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center font-extrabold text-[11px]">
                              {format(holiday.startDateObj, "d")}
                            </div>
                            {isMultiDay && (
                              <>
                                <div className="h-0.5 w-3 bg-violet-300/50 rounded" />
                                <div className="h-7 w-7 rounded-lg bg-violet-500/15 text-violet-500 flex items-center justify-center font-extrabold text-[11px]">
                                  {format(holiday.endDateObj, "d")}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate text-[11px]">
                              {holiday.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {format(holiday.startDateObj, "MMM d")}
                              {isMultiDay
                                ? ` – ${format(holiday.endDateObj, "MMM d, yyyy")}`
                                : `, ${format(holiday.startDateObj, "yyyy")}`}
                              <span className="ml-1.5 text-violet-500 font-semibold">
                                • {duration} {duration === 1 ? "day" : "days"}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditHoliday(holiday)}
                            className={cn(
                              "h-7 w-7 rounded-lg transition-colors",
                              isEditing
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/5",
                            )}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            disabled={isDeletingHoliday}
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/5 rounded-xl border border-dashed border-border/20">
                    <CalendarIcon className="h-7 w-7 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">No holidays configured yet.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Fill in the name and dates above to add one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
