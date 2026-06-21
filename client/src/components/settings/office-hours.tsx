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
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  useAttendanceSettingsQuery,
  useUpdateAttendanceSettingsMutation,
} from "@/hooks/useAttendanceSettings"
import type { LateRule } from "@/types"

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OfficeSettings {
  startTime: string
  endTime: string
  breakStart: string
  breakEnd: string
  lateThreshold: number
  halfDayThreshold: number
  lateRules: LateRule[]
  twoStepLeaveThresholdDays: number
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
  twoStepLeaveThresholdDays: 2,
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
  const [activeSubTab, setActiveSubTab] = useState<"shifts" | "attendance" | "leave">("shifts")

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
        twoStepLeaveThresholdDays: d.twoStepLeaveThresholdDays ?? DEFAULT_SETTINGS.twoStepLeaveThresholdDays,
      })
    }
  }, [settingsQuery.data])

  // ─── Validation & Summary Helpers ────────────────────────────────────────
  const summaryInfo = useMemo(() => {
    const totalMin = timeToMinutes(settings.endTime) - timeToMinutes(settings.startTime)
    const breakMin = timeToMinutes(settings.breakEnd) - timeToMinutes(settings.breakStart)
    const workMin = totalMin - breakMin

    return {
      totalMinutes: totalMin,
      breakMinutes: breakMin,
      workMinutes: workMin,
    }
  }, [settings.startTime, settings.endTime, settings.breakStart, settings.breakEnd])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const updateField = <K extends keyof OfficeSettings>(key: K, value: OfficeSettings[K]) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
  }

  const saveShifts = () => {
    const totalMin = timeToMinutes(settings.endTime) - timeToMinutes(settings.startTime)
    const breakMin = timeToMinutes(settings.breakEnd) - timeToMinutes(settings.breakStart)
    
    if (totalMin <= 0) {
      toast.error("Validation Error", { description: "End time must be after start time." })
      return
    }
    if (breakMin <= 0) {
      toast.error("Validation Error", { description: "Break end must be after break start." })
      return
    }
    if (
      timeToMinutes(settings.breakStart) < timeToMinutes(settings.startTime) ||
      timeToMinutes(settings.breakEnd) > timeToMinutes(settings.endTime)
    ) {
      toast.error("Validation Error", { description: "Break time must be within office hours." })
      return
    }

    updateSettingsMut.mutate({
      startTime: settings.startTime,
      endTime: settings.endTime,
      breakStart: settings.breakStart,
      breakEnd: settings.breakEnd,
    }, {
      onSuccess: () => {
        toast.success("Shift schedule saved!", {
          description: `Work hours: ${formatTime12(settings.startTime)} – ${formatTime12(settings.endTime)} (${formatDuration(totalMin - breakMin)} net work)`,
        })
      },
      onError: () => {
        toast.error("Failed to save shift schedule")
      }
    })
  }

  const saveAttendancePolicies = () => {
    if (settings.lateThreshold <= 0) {
      toast.error("Validation Error", { description: "Late threshold must be positive." })
      return
    }
    if (settings.halfDayThreshold <= 0) {
      toast.error("Validation Error", { description: "Half day threshold must be positive." })
      return
    }

    updateSettingsMut.mutate({
      lateThreshold: settings.lateThreshold,
      halfDayThreshold: settings.halfDayThreshold,
      lateRules: settings.lateRules,
    }, {
      onSuccess: () => {
        toast.success("Attendance policies saved successfully!")
      },
      onError: () => {
        toast.error("Failed to save attendance policies")
      }
    })
  }

  const saveLeaveRules = () => {
    if (settings.twoStepLeaveThresholdDays <= 0) {
      toast.error("Validation Error", { description: "Threshold days must be positive." })
      return
    }

    updateSettingsMut.mutate({
      twoStepLeaveThresholdDays: settings.twoStepLeaveThresholdDays,
    }, {
      onSuccess: () => {
        toast.success("2-step leave approval rules saved!")
      },
      onError: () => {
        toast.error("Failed to save leave approval rules")
      }
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
    <div className="space-y-6">
      {/* ── Sub-tab Switcher ── */}
      <div className="flex border-b border-border/40 pb-px gap-2">
        <button
          onClick={() => setActiveSubTab("shifts")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 px-4 transition-all -mb-px",
            activeSubTab === "shifts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Shifts & Schedule
        </button>
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 px-4 transition-all -mb-px",
            activeSubTab === "attendance"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Attendance Policies
        </button>
        <button
          onClick={() => setActiveSubTab("leave")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 px-4 transition-all -mb-px",
            activeSubTab === "leave"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Leave Verification
        </button>
      </div>

      {/* ── Shifts & Schedule Sub-tab ── */}
      {activeSubTab === "shifts" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card left: Shift & Break settings */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-primary" />
                Work Shift Schedule
              </CardTitle>
              <CardDescription>
                Configure shifts start/end times and standard break windows.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary" />
                  Office Work Schedule
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.startTime}
                      onChange={(e) => updateField("startTime", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">End Time</Label>
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

              <div className="space-y-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Coffee className="h-4 w-4 text-primary" />
                  Lunch / Recess Hour
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Break Start</Label>
                    <Input
                      type="time"
                      value={settings.breakStart}
                      onChange={(e) => updateField("breakStart", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Break End</Label>
                    <Input
                      type="time"
                      value={settings.breakEnd}
                      onChange={(e) => updateField("breakEnd", e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={saveShifts} disabled={isSaving} className="w-full gap-2 h-10 mt-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Shift Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Card right: computed shift summary details */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-5 w-5 text-primary" />
                Schedule Summary
              </CardTitle>
              <CardDescription>Computed parameters based on times entered above</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2.5">
                <SummaryRow
                  label="Office Hours"
                  value={`${formatTime12(settings.startTime)} – ${formatTime12(settings.endTime)}`}
                  badge={formatDuration(Math.max(0, summaryInfo.totalMinutes))}
                />
                <SummaryRow
                  label="Break Time"
                  value={`${formatTime12(settings.breakStart)} – ${formatTime12(settings.breakEnd)}`}
                  badge={formatDuration(Math.max(0, summaryInfo.breakMinutes))}
                  badgeColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                />
                <div className="border-t border-border/30 pt-2.5">
                  <SummaryRow
                    label="Net Working Hours"
                    value="Per day"
                    badge={formatDuration(Math.max(0, summaryInfo.workMinutes))}
                    badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    highlight
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Attendance Policies Sub-tab ── */}
      {activeSubTab === "attendance" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card left: Threshold settings */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-5 w-5 text-primary" />
                Attendance Policy Setup
              </CardTitle>
              <CardDescription>
                Define late arrivals and half-day thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Late Threshold (mins)</Label>
                  <Input
                    type="number"
                    value={settings.lateThreshold}
                    onChange={(e) => updateField("lateThreshold", parseInt(e.target.value) || 0)}
                    min={1}
                    max={120}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Arriving more than {settings.lateThreshold} min after shift start marked Late.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Half Day Threshold (mins)</Label>
                  <Input
                    type="number"
                    value={settings.halfDayThreshold}
                    onChange={(e) => updateField("halfDayThreshold", parseInt(e.target.value) || 0)}
                    min={60}
                    max={480}
                    className="h-10"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Arriving more than {settings.halfDayThreshold} min late marked Half Day.
                  </p>
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance Policies</h4>
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

              <Button onClick={saveAttendancePolicies} disabled={isSaving} className="w-full gap-2 h-10 mt-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Attendance Policies
              </Button>
            </CardContent>
          </Card>

          {/* Card right: Late penalties rules table */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Timer className="h-5 w-5 text-primary" />
                Late Penalties & Deductions
              </CardTitle>
              <CardDescription>Rules assigning salary / leave penalties dynamically</CardDescription>
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Add Penalty Rule</p>
                <div className="grid gap-2 grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase">Min Minutes</Label>
                    <Input type="number" placeholder="e.g. 1" id="new-rule-min" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase">Max Minutes</Label>
                    <Input type="number" placeholder="e.g. 30" id="new-rule-max" className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] uppercase">Penalty Description</Label>
                  <Input type="text" placeholder="e.g. 30 Minutes Basic Salary Deduction" id="new-rule-penalty" className="h-8 text-xs" />
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
      )}

      {/* ── Leave Verification Sub-tab ── */}
      {activeSubTab === "leave" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card left: Leave threshold configuration */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                2-Step Leave Approvals
              </CardTitle>
              <CardDescription>
                Set rules for double-approval authorizations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Threshold (Days)</Label>
                <Input
                  type="number"
                  value={settings.twoStepLeaveThresholdDays}
                  onChange={(e) => updateField("twoStepLeaveThresholdDays", parseInt(e.target.value) || 1)}
                  min={1}
                  max={365}
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Leaves with a duration of {settings.twoStepLeaveThresholdDays} days or more will trigger a two-step approval process.
                </p>
              </div>

              <Button onClick={saveLeaveRules} disabled={isSaving} className="w-full gap-2 h-10 mt-2">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Leave Rules
              </Button>
            </CardContent>
          </Card>

          {/* Card right: Step-by-step documentation guide */}
          <Card className="shadow-none border-border/40 bg-muted/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                How 2-Step Verification Works
              </CardTitle>
              <CardDescription>Visual workflow overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-l-2 border-primary/20 pl-4 space-y-4 text-xs">
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Step 1: Employee Applies</p>
                  <p className="text-muted-foreground mt-0.5">
                    If the leave duration is {settings.twoStepLeaveThresholdDays} days or more, 2-step verification is engaged automatically.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Step 2: Line Manager Approval</p>
                  <p className="text-muted-foreground mt-0.5">
                    The request goes to the employee's Line Manager for the first step authorization. Status becomes "Pending 2nd Step".
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="font-bold text-foreground">Step 3: Final HR/Admin Approval</p>
                  <p className="text-muted-foreground mt-0.5">
                    Once the Line Manager approves, the leave moves to the 2nd approval queue for authorized roles (like Sakib) to fully approve.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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

