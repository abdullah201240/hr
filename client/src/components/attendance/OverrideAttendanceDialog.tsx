import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { convert12to24, convert24to12 } from "./RequestCorrectionDialog"

interface OverrideAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeEmployees: any[]
  record: any
  defaultDate: string
  onSubmit: (payload: any) => Promise<void>
  isPending: boolean
}

export function OverrideAttendanceDialog({
  open,
  onOpenChange,
  activeEmployees,
  record,
  defaultDate,
  onSubmit,
  isPending,
}: OverrideAttendanceDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState("present")
  const [checkIn, setCheckIn] = useState("09:00")
  const [checkOut, setCheckOut] = useState("18:00")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      if (record) {
        setEmployeeId(record.employeeId)
        setDate(record.date)
        setStatus(record.status)
        setCheckIn(convert12to24(record.checkIn) || "09:00")
        setCheckOut(convert12to24(record.checkOut) || "18:00")
        setNotes(record.notes || "")
      } else {
        setEmployeeId("")
        setDate(defaultDate)
        setStatus("present")
        setCheckIn("09:00")
        setCheckOut("18:00")
        setNotes("")
      }
    }
  }, [record, open, defaultDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId) return

    const payload = {
      employeeId,
      date,
      status,
      checkIn: (status === "present" || status === "late") ? convert24to12(checkIn) : undefined,
      checkOut: (status === "present" || status === "late") ? convert24to12(checkOut) : undefined,
      notes: notes || undefined,
    }
    await onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Attendance Manual Override</DialogTitle>
          <DialogDescription className="text-xs">Directly override or add an attendance log for an employee.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Employee</Label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border/60 bg-transparent text-xs px-3 focus:outline-none cursor-pointer dark:bg-zinc-950"
              required
              disabled={!!record}
            >
              <option value="">-- Choose Employee --</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullNameEnglish} ({emp.employeeId})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs"
              required
              disabled={!!record}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Attendance Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 rounded-lg border border-border/60 bg-transparent text-xs px-3 focus:outline-none cursor-pointer dark:bg-zinc-950"
              required
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="holiday">Holiday</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>

          {(status === "present" || status === "late") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Check-In</Label>
                <Input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold">Check-Out</Label>
                <Input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Override Reason / Notes</Label>
            <Textarea
              placeholder="e.g. Card reader failure, field duty, manual override..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Spinner className="mr-2 h-4 w-4 text-primary-foreground animate-spin" />Saving...</>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
