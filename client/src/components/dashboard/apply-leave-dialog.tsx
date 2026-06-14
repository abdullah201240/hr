import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Attachment, LeaveBalance } from "./types"

interface ApplyLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDayNumber: number
  leaveType: string
  onLeaveTypeChange: (type: string) => void
  balances: LeaveBalance[]
  onSubmit: (data: {
    startDay: number
    endDay: number
    leaveType: string
    reason: string
    attachments: Attachment[]
  }) => void
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  selectedDayNumber,
  leaveType,
  onLeaveTypeChange,
  balances,
  onSubmit,
}: ApplyLeaveDialogProps) {
  const [startDay, setStartDay] = useState(selectedDayNumber)
  const [endDay, setEndDay] = useState(selectedDayNumber)
  const [reason, setReason] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttTitle, setNewAttTitle] = useState("")
  const [newAttFileName, setNewAttFileName] = useState("")

  // Sync days when dialog opens with new selectedDay
  if (open && startDay !== selectedDayNumber) {
    setStartDay(selectedDayNumber)
    setEndDay(selectedDayNumber)
  }

  const handleSubmit = () => {
    onSubmit({
      startDay,
      endDay,
      leaveType,
      reason: reason.trim() || "No reason provided",
      attachments,
    })
    setReason("")
    setAttachments([])
    setNewAttTitle("")
    setNewAttFileName("")
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Apply Leave for June {selectedDayNumber}, 2026</DialogTitle>
          <DialogDescription className="text-xs">
            Select leave type and provide details to apply for leave.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          <div className="space-y-1.5">
            <Label htmlFor="leave-type" className="text-xs font-semibold">Leave Type</Label>
            <Select value={leaveType} onValueChange={onLeaveTypeChange}>
              <SelectTrigger id="leave-type" className="w-full text-xs h-9">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.key} value={b.key} disabled={b.total - b.used <= 0} className="text-xs">
                    {b.label} ({b.total - b.used} days left)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-day" className="text-xs font-semibold">Start Day</Label>
              <Input id="start-day" type="date" min="2026-06-01" max="2026-06-30"
                value={`2026-06-${startDay.toString().padStart(2, "0")}`}
                onChange={(e) => { const parts = e.target.value.split("-"); if (parts[2]) { const day = parseInt(parts[2]); setStartDay(day); if (endDay < day) setEndDay(day); } }}
                className="w-full text-xs h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-day" className="text-xs font-semibold">End Day</Label>
              <Input id="end-day" type="date" min={`2026-06-${startDay.toString().padStart(2, "0")}`} max="2026-06-30"
                value={`2026-06-${endDay.toString().padStart(2, "0")}`}
                onChange={(e) => { const parts = e.target.value.split("-"); if (parts[2]) setEndDay(parseInt(parts[2])); }}
                className="w-full text-xs h-9" />
            </div>
          </div>
          {endDay >= startDay && (
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
              Duration: {endDay - startDay + 1} {endDay - startDay + 1 === 1 ? "day" : "days"}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
            <Textarea id="reason" placeholder="Please specify the reason..."
              value={reason} onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[80px] resize-none" />
          </div>
          <div className="space-y-2 border-t border-border/40 pt-3">
            <Label className="text-xs font-semibold">Attachments</Label>
            {attachments.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border/20 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-primary shrink-0">{att.title}:</span>
                      <span className="text-muted-foreground truncate">{att.fileName}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded"
                      onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}>&times;</Button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-1">
                <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Document Title</Label>
                <input id="att-title" type="text" placeholder="e.g. Doctor Certificate, Ticket"
                  value={newAttTitle} onChange={(e) => setNewAttTitle(e.target.value)}
                  className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Select File</Label>
                <div className="flex items-center gap-2">
                  <input id="att-file" type="file" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) setNewAttFileName(file.name); }} />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("att-file")?.click()}
                    className="h-8 text-[11px] font-semibold flex items-center gap-1.5">Browse...</Button>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{newAttFileName || "No file chosen"}</span>
                  {newAttFileName && (
                    <Button size="sm" variant="ghost" onClick={() => setNewAttFileName("")} className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted">&times;</Button>
                  )}
                </div>
              </div>
              <Button type="button" size="sm" variant="secondary"
                disabled={!newAttTitle.trim() || !newAttFileName}
                onClick={() => { if (newAttTitle.trim() && newAttFileName) { setAttachments([...attachments, { id: Math.random().toString(36).substring(2, 9), title: newAttTitle.trim(), fileName: newAttFileName }]); setNewAttTitle(""); setNewAttFileName(""); } }}
                className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1">Add Document</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCancel} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={handleSubmit} className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none">Submit Leave Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
