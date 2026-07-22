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

// Time Format Helpers
export function convert24to12(time24: string): string {
  if (!time24) return ""
  const [hourStr, minStr] = time24.split(":")
  let hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  hour = hour % 12
  hour = hour ? hour : 12
  const hrStr = hour.toString().padStart(2, "0")
  const minFormatted = min.toString().padStart(2, "0")
  return `${hrStr}:${minFormatted} ${ampm}`
}

export function convert12to24(time12: string | null | undefined): string {
  if (!time12) return ""
  const match = time12.match(/^(\d{2}):(\d{2}) ([AP]M)$/)
  if (!match) return ""
  let [_, hoursStr, minutesStr, modifier] = match
  let hours = parseInt(hoursStr, 10)
  if (modifier === "PM" && hours < 12) hours += 12
  if (modifier === "AM" && hours === 12) hours = 0
  return `${hours.toString().padStart(2, "0")}:${minutesStr}`
}

interface RequestCorrectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: any
  onSubmit: (proposedCheckIn: string, proposedCheckOut: string, correctionReason: string) => Promise<void>
  isPending: boolean
}

export function RequestCorrectionDialog({
  open,
  onOpenChange,
  record,
  onSubmit,
  isPending,
}: RequestCorrectionDialogProps) {
  const [proposedCheckIn, setProposedCheckIn] = useState("09:00")
  const [proposedCheckOut, setProposedCheckOut] = useState("18:00")
  const [correctionReason, setCorrectionReason] = useState("")

  useEffect(() => {
    if (record) {
      setProposedCheckIn(convert12to24(record.checkIn) || "09:00")
      setProposedCheckOut(convert12to24(record.checkOut) || "18:00")
      setCorrectionReason(record.correctionReason || "")
    }
  }, [record, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(proposedCheckIn, proposedCheckOut, correctionReason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Request Attendance Correction</DialogTitle>
          <DialogDescription className="text-xs">
            Request changes for your attendance log on <span className="font-semibold text-foreground">{record?.dateStr}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proposedCheckIn" className="text-xs font-semibold">Proposed Check-In Time</Label>
            <Input
              id="proposedCheckIn"
              type="time"
              value={proposedCheckIn}
              onChange={(e) => setProposedCheckIn(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposedCheckOut" className="text-xs font-semibold">Proposed Check-Out Time</Label>
            <Input
              id="proposedCheckOut"
              type="time"
              value={proposedCheckOut}
              onChange={(e) => setProposedCheckOut(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="correctionReason" className="text-xs font-semibold">Reason for Correction</Label>
            <Textarea
              id="correctionReason"
              placeholder="Explain why you are requesting this correction..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="text-xs min-h-[90px] resize-none"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Spinner className="mr-2 h-4 w-4 text-primary-foreground animate-spin" />Submitting...</>
              ) : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
