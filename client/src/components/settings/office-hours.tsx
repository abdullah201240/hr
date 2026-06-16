import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Clock,
  Building2,
  AlertCircle,
  Coffee,
  Timer,
  Loader2,
  Plus,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  useAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} from "@/hooks/useAttendanceSettings"
import type { UpdateAttendanceSettingsPayload, LateRule } from "@/types"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OfficeSettings {
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
  lateThreshold: number
  halfDayThreshold: number
  lateRules: LateRule[]
}

const DEFAULT_SETTINGS: OfficeSettings = {
  startTime: "09:00",
  endTime: "18:00",
  breakStart: "13:00",
  breakEnd: "14:00",
  lateThreshold: 15,
  halfDayThreshold: 240,
  lateRules: [
    { minMinutes: 1, maxMinutes: 30, penalty: '30 Minutes Basic Salary Deduction' },
    { minMinutes: 31, maxMinutes: 60, penalty: '1 Hour Basic Salary Deduction' },
    { minMinutes: 61, maxMinutes: 120, penalty: '2 Hours Basic Salary Deduction' },
    { minMinutes: 121, maxMinutes: 240, penalty: 'Half-Day Leave Deduction or Equivalent Basic Salary Deduction' }
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

export function OfficeHours() {
  const [settings, setSettings] = useState<OfficeSettings>(DEFAULT_SETTINGS)

  // ─── API hooks ───────────────────────────────────────────────────────────
  const settingsQuery = useAttendanceSettingsQuery()
  const updateSettingsMut = useUpdateAttendanceSettingsMutation()

  // ─── Sync from API on load ──────────────────────────────────────────────
  useEffect(() => {
    if (settingsQuery.data) {
      const d = settingsQuery.data
      setSettings({
        startTime: d.startTime || DEFAULT_SETTINGS.startTime,
        endTime: d.endTime || DEFAULT_SETTINGS.endTime,
        breakStart: d.breakStart || DEFAULT_SETTINGS.breakStart,
        breakEnd: d.breakEnd || DEFAULT_SETTINGS.breakEnd,
        lateThreshold: d.lateThreshold || DEFAULT_SETTINGS.lateThreshold,
        halfDayThreshold: d.halfDayThreshold || DEFAULT_SETTINGS.halfDayThreshold,
        lateRules: d.lateRules || DEFAULT_SETTINGS.lateRules,
      })
    }
  }, [settingsQuery.data])

  // ─── Validation ──────────────────────────────────────────────────────────
  const validation = useMemo(() => {
    const totalMin = timeToMinutes(settings.endTime) - timeToMinutes(settings.startTime)
    const breakMin = timeToMinutes(settings.breakEnd) - timeToMinutes(settings.breakStart)
    const workMin = totalMin - breakMin

    const errors: string[] = []

    if (totalMin <= 0) {
      errors.push("End time must be after start time.")
    }

    if (breakMin <= 0) {
      errors.push("Break end must be after break start.")
    }

    // Break must fall within office hours
    if (
      timeToMinutes(settings.breakStart) < timeToMinutes(settings.startTime) ||
      timeToMinutes(settings.breakEnd) > timeToMinutes(settings.endTime)
    ) {
      errors.push("Break time must be within office hours.")
    }

    if (settings.lateThreshold <= 0) {
      errors.push("Late threshold must be positive.")
    }

    return {
      totalMinutes: totalMin,
      breakMinutes: breakMin,
      workMinutes: workMin,
      errors,
      isValid: errors.length === 0,
    }
  }, [settings])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const updateField = <K extends keyof OfficeSettings>(key: K, value: OfficeSettings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
  }

  const handleSave = () => {
    if (!validation.isValid) {
      toast.error("Validation Error", {
        description: validation.errors.join(" "),
      })
      return
    }

    const payload: UpdateAttendanceSettingsPayload = {
      startTime: settings.startTime,
      endTime: settings.endTime,
      breakStart: settings.breakStart,
      breakEnd: settings.breakEnd,
      lateThreshold: settings.lateThreshold,
      halfDayThreshold: settings.halfDayThreshold,
      lateRules: settings.lateRules,
    }

    updateSettingsMut.mutate(payload, {
      onSuccess: () => {
        toast.success("Office settings saved!", {
          description: `Office hours: ${formatTime12(settings.startTime)} – ${formatTime12(settings.endTime)} (${formatDuration(validation.workMinutes)} working)`,
        })
      },
      onError: () => {
        toast.error("Failed to save office settings")
      },
    })
  }

  const isLoading = settingsQuery.isLoading
  const isSaving = updateSettingsMut.isPending

  // ─── Loading state ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading office settings...</span>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ── Office Hours Card ── */}
      <Card className="shadow-none border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary" />
            Standard Office Hours
          </CardTitle>
          <CardDescription>
            Configure daily work schedule and break times
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Office Time Range */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              Work Schedule
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Start Time
                </Label>
                <Input
                  type="time"
                  value={settings.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  End Time
                </Label>
                <Input
                  type="time"
                  value={settings.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Break Time */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Coffee className="h-4 w-4 text-primary" />
              Lunch / Break Time
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Break Start
                </Label>
                <Input
                  type="time"
                  value={settings.breakStart}
                  onChange={(e) => updateField("breakStart", e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Break End
                </Label>
                <Input
                  type="time"
                  value={settings.breakEnd}
                  onChange={(e) => updateField("breakEnd", e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Late Arrival Policy */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-primary" />
              Late Arrival Policy
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Late Threshold (minutes)
                </Label>
                <Input
                  type="number"
                  value={settings.lateThreshold}
                  onChange={(e) => updateField("lateThreshold", parseInt(e.target.value) || 0)}
                  min={1}
                  max={120}
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Arriving more than {settings.lateThreshold} min after{" "}
                  {formatTime12(settings.startTime)} → marked Late
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Half Day Threshold (minutes)
                </Label>
                <Input
                  type="number"
                  value={settings.halfDayThreshold}
                  onChange={(e) => updateField("halfDayThreshold", parseInt(e.target.value) || 0)}
                  min={60}
                  max={480}
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Arriving more than {settings.halfDayThreshold} min late → marked Half Day
                </p>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {err}
                </p>
              ))}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={!validation.isValid || isSaving}
            className="w-full gap-2 h-10"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save Office Settings
          </Button>
        </CardContent>
      </Card>

      {/* ── Summary Card ── */}
      <div className="space-y-6">
        <Card className="shadow-none border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5 text-primary" />
              Schedule Summary
            </CardTitle>
            <CardDescription>Computed from your configured settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Summary Rows */}
            <div className="space-y-2.5">
              <SummaryRow
                label="Office Hours"
                value={`${formatTime12(settings.startTime)} – ${formatTime12(settings.endTime)}`}
                badge={formatDuration(Math.max(0, validation.totalMinutes))}
              />
              <SummaryRow
                label="Break Time"
                value={`${formatTime12(settings.breakStart)} – ${formatTime12(settings.breakEnd)}`}
                badge={formatDuration(Math.max(0, validation.breakMinutes))}
                badgeColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
              />
              <div className="border-t border-border/30 pt-2.5">
                <SummaryRow
                  label="Net Working Hours"
                  value="Per day"
                  badge={formatDuration(Math.max(0, validation.workMinutes))}
                  badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  highlight
                />
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Policy summary */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Attendance Policies
              </h4>
              <div className="space-y-2">
                <PolicyRow
                  label="Late Mark"
                  description={`After ${settings.lateThreshold} min past ${formatTime12(settings.startTime)}`}
                  color="amber"
                />
                <PolicyRow
                  label="Half Day"
                  description={`After ${settings.halfDayThreshold} min past ${formatTime12(settings.startTime)}`}
                  color="red"
                />
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Quick reference */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/20 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Status Rules
              </p>
              <StatusRule
                status="Present"
                color="emerald"
                rule={`Clock-in before ${formatTime12(settings.startTime)} + ${settings.lateThreshold} min`}
              />
              <StatusRule
                status="Late"
                color="amber"
                rule={`Clock-in ${settings.lateThreshold}–${settings.halfDayThreshold} min after start`}
              />
              <StatusRule
                status="Half Day"
                color="orange"
                rule={`Clock-in after ${settings.halfDayThreshold} min past start`}
              />
              <StatusRule
                status="Absent"
                color="red"
                rule="No clock-in recorded for the day"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Late Attendance Penalty Card (Table 10) ── */}
        <Card className="shadow-none border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="h-5 w-5 text-primary" />
              Late Attendance Penalty
            </CardTitle>
            <CardDescription>Configure basic salary or leave deduction rules based on late duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-border/30 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/30 text-muted-foreground font-semibold">
                    <th className="p-3">Late Duration</th>
                    <th className="p-3">Penalty / Deduction</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.lateRules && settings.lateRules.length > 0 ? (
                    settings.lateRules.map((rule, index) => (
                      <tr key={index} className="border-b border-border/20 hover:bg-muted/10">
                        <td className="p-3 font-medium text-foreground">
                          {rule.minMinutes} – {rule.maxMinutes} Min
                        </td>
                        <td className="p-3 text-muted-foreground">{rule.penalty}</td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updatedRules = settings.lateRules.filter((_, idx) => idx !== index)
                              updateField("lateRules", updatedRules)
                            }}
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground italic">
                        No late penalty rules configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Add New Penalty Rule
              </p>
              <div className="grid gap-2 grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase">Min Minutes</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1"
                    id="new-rule-min"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase">Max Minutes</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 30"
                    id="new-rule-max"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] uppercase">Penalty Description</Label>
                <Input
                  type="text"
                  placeholder="e.g. 30 Minutes Basic Salary Deduction"
                  id="new-rule-penalty"
                  className="h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const minEl = document.getElementById("new-rule-min") as HTMLInputElement
                  const maxEl = document.getElementById("new-rule-max") as HTMLInputElement
                  const penEl = document.getElementById("new-rule-penalty") as HTMLInputElement
                  
                  const min = parseInt(minEl?.value)
                  const max = parseInt(maxEl?.value)
                  const penalty = penEl?.value?.trim()

                  if (isNaN(min) || isNaN(max) || !penalty) {
                    toast.error("Please fill in all rule fields correctly.")
                    return
                  }

                  const newRule = { minMinutes: min, maxMinutes: max, penalty }
                  const updatedRules = [...(settings.lateRules || []), newRule].sort((a, b) => a.minMinutes - b.minMinutes)
                  updateField("lateRules", updatedRules)

                  // Clear fields
                  if (minEl) minEl.value = ""
                  if (maxEl) maxEl.value = ""
                  if (penEl) penEl.value = ""
                }}
                className="w-full h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Rule to Table
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  badge,
  badgeColor = "bg-primary/10 text-primary",
  highlight = false,
}: {
  label: string
  value: string
  badge: string
  badgeColor?: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1",
        highlight && "font-bold",
      )}
    >
      <div>
        <p className={cn("text-xs", highlight ? "font-bold text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        <p className={cn("text-[10px]", highlight ? "text-foreground" : "text-muted-foreground/70")}>
          {value}
        </p>
      </div>
      <Badge variant="outline" className={cn("text-[10px] font-bold", badgeColor)}>
        {badge}
      </Badge>
    </div>
  )
}

function PolicyRow({
  label,
  description,
  color,
}: {
  label: string
  description: string
  color: "amber" | "red"
}) {
  const dotColor = color === "amber" ? "bg-amber-500" : "bg-red-500"

  return (
    <div className="flex items-start gap-2.5">
      <div className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", dotColor)} />
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function StatusRule({
  status,
  color,
  rule,
}: {
  status: string
  color: "emerald" | "amber" | "orange" | "red"
  rule: string
}) {
  const badgeClass = cn(
    "text-[9px] font-bold uppercase tracking-wider min-w-[52px] justify-center",
    color === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    color === "amber" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    color === "orange" && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    color === "red" && "bg-red-500/10 text-red-600 dark:text-red-400",
  )

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={badgeClass}>
        {status}
      </Badge>
      <span className="text-[10px] text-muted-foreground">{rule}</span>
    </div>
  )
}
