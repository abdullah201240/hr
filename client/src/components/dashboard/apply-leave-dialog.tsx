import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
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
import { apiClient } from "@/lib/api"
import Swal from "sweetalert2"

interface Attachment {
  id: string
  title: string
  fileName: string
  fileUrl: string
}

interface LeaveBalance {
  id: string
  key: string
  label: string
  color: string
  icon: any
  total: number
  used: number
  requiresDocument?: boolean
}

interface ApplyLeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: string // YYYY-MM-DD
  balances: LeaveBalance[]
  onSubmit: (data: {
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
    attachments: Attachment[]
  }) => void
}

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  selectedDate,
  balances,
  onSubmit,
}: ApplyLeaveDialogProps) {
  const [startDate, setStartDate] = useState(selectedDate)
  const [endDate, setEndDate] = useState(selectedDate)
  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [reason, setReason] = useState("")
  
  // Attachment upload states
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttTitle, setNewAttTitle] = useState("")
  const [newAttFileName, setNewAttFileName] = useState("")
  const [newAttFileUrl, setNewAttFileUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  // Sync inputs when selectedDate change or dialog opens
  useEffect(() => {
    if (open) {
      setStartDate(selectedDate)
      setEndDate(selectedDate)
      setReason("")
      setAttachments([])
      setNewAttTitle("")
      setNewAttFileName("")
      setNewAttFileUrl("")
      
      // Auto-select first available leave type with remaining days
      const available = balances.find((b) => b.total - b.used > 0)
      if (available) {
        setLeaveTypeId(available.id)
      } else if (balances.length > 0) {
        setLeaveTypeId(balances[0].id)
      }
    }
  }, [open, selectedDate, balances])

  // Find current selected leave type balance to check if documents are required
  const selectedType = balances.find((b) => b.id === leaveTypeId)
  const showDocuments = selectedType?.requiresDocument ?? false

  // Clean up attachment inputs if the selected leave type does not require documents
  useEffect(() => {
    if (!showDocuments) {
      setAttachments([])
      setNewAttTitle("")
      setNewAttFileName("")
      setNewAttFileUrl("")
    }
  }, [showDocuments])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await apiClient.post<any>("upload?folder=leaves", formData)
      if (res && res.secureUrl) {
        setNewAttFileName(file.name)
        setNewAttFileUrl(res.secureUrl)
        if (!newAttTitle.trim()) {
          setNewAttTitle(file.name.split(".")[0])
        }
      }
    } catch (err) {
      console.error("Upload error:", err)
      Swal.fire({
        title: "Upload Failed",
        text: "Could not upload attachment to cloud storage. Please try again.",
        icon: "error",
        confirmButtonText: "Ok",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddAttachment = () => {
    if (newAttTitle.trim() && newAttFileName && newAttFileUrl) {
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substring(2, 9),
        title: newAttTitle.trim(),
        fileName: newAttFileName,
        fileUrl: newAttFileUrl,
      }
      setAttachments([...attachments, newAttachment])
      setNewAttTitle("")
      setNewAttFileName("")
      setNewAttFileUrl("")
    }
  }

  const handleSubmit = () => {
    if (!leaveTypeId) {
      Swal.fire({
        title: "Leave Type Required",
        text: "Please select a leave type before submitting.",
        icon: "warning",
      })
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      Swal.fire({
        title: "Invalid Dates",
        text: "Start date cannot be after end date.",
        icon: "warning",
      })
      return
    }

    onSubmit({
      leaveTypeId,
      startDate,
      endDate,
      reason: reason.trim() || "No reason provided",
      attachments,
    })
  }

  // Calculate duration in days
  const getDurationDays = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0
    const diffTime = end.getTime() - start.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const duration = getDurationDays()

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? ""
      : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(d)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Apply Leave</DialogTitle>
          <DialogDescription className="text-xs">
            Select leave type and provide details to submit your request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-3">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-type" className="text-xs font-semibold">Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger id="leave-type" className="w-full text-xs h-9">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.label} ({b.total - b.used} days left)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs font-semibold">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (new Date(endDate) < new Date(e.target.value)) {
                    setEndDate(e.target.value)
                  }
                }}
                className="w-full text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs font-semibold">End Date</Label>
              <Input
                id="end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs h-9"
              />
            </div>
          </div>

          {duration > 0 && (
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-1 rounded w-fit">
              Duration: {duration} {duration === 1 ? "day" : "days"} ({formatDateDisplay(startDate)} to {formatDateDisplay(endDate)})
            </p>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
            <Textarea
              id="reason"
              placeholder="Please specify the reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>

          {/* Attachments */}
          {showDocuments && (
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded"
                        onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 p-2.5 rounded-lg border border-border/40 bg-muted/10">
                <div className="space-y-1">
                  <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Document Title</Label>
                  <input
                    id="att-title"
                    type="text"
                    placeholder="e.g. Doctor Certificate, Ticket"
                    value={newAttTitle}
                    onChange={(e) => setNewAttTitle(e.target.value)}
                    className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Select File</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="att-file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("att-file")?.click()}
                      className="h-8 text-[11px] font-semibold flex items-center gap-1.5"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Browse..."
                      )}
                    </Button>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                      {newAttFileName || "No file chosen"}
                    </span>
                    {newAttFileName && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setNewAttFileName("")
                          setNewAttFileUrl("")
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!newAttTitle.trim() || !newAttFileName || !newAttFileUrl || isUploading}
                  onClick={handleAddAttachment}
                  className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1"
                >
                  Add Document
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isUploading}
            className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none"
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
