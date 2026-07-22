import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Paperclip, X, CheckCircle2, Clock, FileText, Image } from "lucide-react"
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
import { toast } from "sonner"
import { useAttendanceSettingsQuery, useHolidaysQuery } from "@/hooks/useAttendanceSettings"
import { useLeaveTypesQuery } from "@/hooks/useLeaveTypes"

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  preSelectedLeaveKey?: string | null
  initialData?: {
    id: string
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
    attachments: Attachment[]
  } | null
  onSubmit: (data: {
    leaveTypeId: string
    startDate: string
    endDate: string
    reason: string
    attachments: Attachment[]
  }) => void
  isSubmitting?: boolean
}

// ─── Allowed file types ────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
])

const MAX_FILE_SIZE_MB = 10
const MAX_ATTACHMENTS = 5

// ─── Helpers ──────────────────────────────────────────────────────────────────


function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return <Image className="h-3.5 w-3.5 text-sky-500 shrink-0" />
  }
  return <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApplyLeaveDialog({
  open,
  onOpenChange,
  selectedDate,
  balances,
  preSelectedLeaveKey,
  initialData,
  onSubmit,
  isSubmitting = false,
}: ApplyLeaveDialogProps) {
  const [startDate, setStartDate] = useState(selectedDate)
  const [endDate, setEndDate] = useState(selectedDate)
  const [leaveTypeId, setLeaveTypeId] = useState("")
  const [reason, setReason] = useState("")

  // Attachment states
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [newAttTitle, setNewAttTitle] = useState("")
  const [newAttFileName, setNewAttFileName] = useState("")
  const [newAttFileUrl, setNewAttFileUrl] = useState("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: attendanceSettingsData } = useAttendanceSettingsQuery()
  const { data: holidaysData = [] } = useHolidaysQuery()
  const { data: leaveTypesResponse } = useLeaveTypesQuery({ limit: 100 })

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setStartDate(initialData.startDate)
        setEndDate(initialData.endDate)
        setLeaveTypeId(initialData.leaveTypeId)
        setReason(initialData.reason)
        setAttachments(initialData.attachments || [])
      } else {
        setStartDate(selectedDate)
        setEndDate(selectedDate)
        setReason("")
        setAttachments([])

        if (preSelectedLeaveKey) {
          const matched = balances.find((b) => b.key === preSelectedLeaveKey)
          if (matched) {
            setLeaveTypeId(matched.id)
          } else {
            autoSelectLeaveType()
          }
        } else {
          autoSelectLeaveType()
        }
      }

      // Reset upload state
      setNewAttTitle("")
      setNewAttFileName("")
      setNewAttFileUrl("")
      setUploadProgress(0)
      setUploadError(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedDate, initialData])

  function autoSelectLeaveType() {
    const available = balances.find((b) => b.total - b.used > 0)
    if (available) {
      setLeaveTypeId(available.id)
    } else if (balances.length > 0) {
      setLeaveTypeId(balances[0].id)
    }
  }

  const selectedType = balances.find((b) => b.id === leaveTypeId)
  const showDocuments = selectedType?.requiresDocument ?? false

  // Lock dates for Early Out, Movement, and Late Arrival
  useEffect(() => {
    if (
      selectedType &&
      (selectedType.key === "earlyout" ||
        selectedType.key === "movement" ||
        selectedType.key === "latearrival" ||
        selectedType.key === "lateentry")
    ) {
      setEndDate(startDate)
    }
  }, [startDate, selectedType])

  // Clear attachments when leave type no longer requires docs
  useEffect(() => {
    if (!showDocuments) {
      setAttachments([])
      setNewAttTitle("")
      setNewAttFileName("")
      setNewAttFileUrl("")
      setUploadError(null)
    }
  }, [showDocuments])

  // ─── File Upload ────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset previous upload state
    setUploadError(null)
    setNewAttFileName("")
    setNewAttFileUrl("")

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setUploadError(`File type "${file.type || file.name.split(".").pop()}" is not supported. Please upload a PDF, Word, Excel, or image file.`)
      e.target.value = ""
      return
    }

    // Validate file size
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      e.target.value = ""
      return
    }

    if (file.size === 0) {
      setUploadError("File is empty. Please choose a valid file.")
      e.target.value = ""
      return
    }

    // Check attachment limit
    if (attachments.length >= MAX_ATTACHMENTS) {
      setUploadError(`Maximum ${MAX_ATTACHMENTS} attachments allowed.`)
      e.target.value = ""
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate upload progress (Cloudinary doesn't report progress via the REST API)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 85))
      }, 200)

      const res = await apiClient.post<any>("upload?folder=leaves", formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (res && res.secureUrl) {
        setNewAttFileName(file.name)
        setNewAttFileUrl(res.secureUrl)
        // Auto-fill title from filename (strip extension)
        if (!newAttTitle.trim()) {
          setNewAttTitle(file.name.replace(/\.[^.]+$/, ""))
        }
      } else {
        throw new Error("Server did not return a secure URL")
      }
    } catch (err: any) {
      setUploadError(
        err?.message?.includes("not allowed")
          ? "This file type is not allowed on the server. Use PDF, Word, Excel, or common image formats."
          : "Upload failed. Please check your connection and try again."
      )
      setNewAttFileName("")
      setNewAttFileUrl("")
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 600)
      e.target.value = ""
    }
  }, [attachments.length, newAttTitle])

  const handleAddAttachment = () => {
    if (!newAttTitle.trim()) {
      setUploadError("Please enter a document title before adding.")
      return
    }
    if (!newAttFileName || !newAttFileUrl) {
      setUploadError("Please upload a file before adding.")
      return
    }

    setAttachments([
      ...attachments,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: newAttTitle.trim(),
        fileName: newAttFileName,
        fileUrl: newAttFileUrl,
      },
    ])
    setNewAttTitle("")
    setNewAttFileName("")
    setNewAttFileUrl("")
    setUploadError(null)
  }

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!leaveTypeId) {
      toast.warning("Please select a leave type before submitting.")
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.warning("Start date cannot be after end date.")
      return
    }

    if (!reason.trim()) {
      toast.warning("Please provide a reason for your leave.")
      return
    }

    // Auto-include pending attachment if user uploaded but didn't click "Add Document"
    let finalAttachments = [...attachments]
    if (newAttTitle.trim() && newAttFileName && newAttFileUrl) {
      finalAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        title: newAttTitle.trim(),
        fileName: newAttFileName,
        fileUrl: newAttFileUrl,
      })
    }

    onSubmit({
      leaveTypeId,
      startDate,
      endDate,
      reason: reason.trim(),
      attachments: finalAttachments,
    })
  }

  // ─── UI Helpers ─────────────────────────────────────────────────────────────

  const getDurationDays = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0

    const rawDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const selectedLeaveType = leaveTypesResponse?.data?.find((lt) => lt.id === leaveTypeId)
    if (!selectedLeaveType || selectedLeaveType.sandwichRule) {
      return rawDays
    }

    const weeklyHolidays = attendanceSettingsData?.weeklyHolidays || ["Saturday", "Sunday"]

    let activeDays = 0
    const current = new Date(start)
    while (current <= end) {
      const dayName = current.toLocaleDateString("en-US", { weekday: "long" })
      const isWeeklyHoliday = weeklyHolidays.includes(dayName)

      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, "0")
      const dateVal = String(current.getDate()).padStart(2, "0")
      const formattedCurrent = `${year}-${month}-${dateVal}`

      const isPublicHoliday = holidaysData.some((h) =>
        formattedCurrent >= h.startDate && formattedCurrent <= h.endDate
      )

      if (!isWeeklyHoliday && !isPublicHoliday) {
        activeDays++
      }

      current.setDate(current.getDate() + 1)
    }

    return activeDays
  }

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr)
    return isNaN(d.getTime())
      ? ""
      : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(d)
  }

  const duration = getDurationDays()
  const selectedBalance = balances.find((b) => b.id === leaveTypeId)
  const remaining = selectedBalance ? selectedBalance.total - selectedBalance.used : 0
  const isOverBalance = duration > 0 && remaining < duration

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[440px] overflow-hidden">

        {/* Processing overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 backdrop-blur-sm rounded-lg">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Clock className="absolute inset-0 m-auto h-5 w-5 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">Processing Your Request</p>
              <p className="text-xs text-muted-foreground max-w-[220px]">
                Validating eligibility, balance &amp; submitting your leave application…
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {initialData ? "Edit & Resubmit Leave" : "Apply for Leave"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {initialData
              ? "Modify your leave request and resubmit for review."
              : "Fill in the details below to submit your leave request."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label htmlFor="leave-type" className="text-xs font-semibold">Leave Type</Label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId} disabled={isSubmitting}>
              <SelectTrigger id="leave-type" className="w-full text-xs h-9">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {balances.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {b.label}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        b.total - b.used <= 0
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }`}>
                        {b.total - b.used} left
                      </span>
                    </span>
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
                disabled={isSubmitting}
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
                disabled={
                  isSubmitting ||
                  selectedType?.key === "earlyout" ||
                  selectedType?.key === "movement" ||
                  selectedType?.key === "latearrival" ||
                  selectedType?.key === "lateentry"
                }
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs h-9"
              />
            </div>
          </div>

          {/* Duration banner */}
          {duration > 0 && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold ${
              isOverBalance
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
            }`}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>
                {duration} {duration === 1 ? "day" : "days"}
                {" "}&mdash; {formatDateDisplay(startDate)} → {formatDateDisplay(endDate)}
                {isOverBalance && (
                  <span className="ml-1 text-rose-500 dark:text-rose-400">
                    (exceeds {remaining} day{remaining !== 1 ? "s" : ""} remaining balance)
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave</Label>
            <Textarea
              id="reason"
              placeholder="Please describe the reason for your leave request…"
              value={reason}
              disabled={isSubmitting}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[72px] resize-none"
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground text-right">{reason.length}/2000</p>
          </div>

          {/* Attachments */}
          {showDocuments && (
            <div className="space-y-2 border-t border-border/40 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <Paperclip className="h-3 w-3" />
                  Supporting Documents
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {attachments.length}/{MAX_ATTACHMENTS} files
                </span>
              </div>

              {/* Existing attachments */}
              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/30 text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getFileIcon(att.fileName)}
                        <span className="font-semibold text-foreground shrink-0">{att.title}:</span>
                        <span className="text-muted-foreground truncate">{att.fileName}</span>
                      </div>
                      {!isSubmitting && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 ml-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded shrink-0"
                          onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new attachment */}
              {attachments.length < MAX_ATTACHMENTS && (
                <div className="space-y-2 p-3 rounded-lg border border-border/40 bg-muted/10">
                  {/* Title input */}
                  <div className="space-y-1">
                    <Label htmlFor="att-title" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                      Document Title
                    </Label>
                    <input
                      id="att-title"
                      type="text"
                      placeholder="e.g. Doctor Certificate, Flight Ticket"
                      value={newAttTitle}
                      onChange={(e) => setNewAttTitle(e.target.value)}
                      disabled={isUploading || isSubmitting}
                      className="w-full text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  {/* File input */}
                  <div className="space-y-1">
                    <Label htmlFor="att-file" className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                      Select File (PDF, Word, Excel, Image — max {MAX_FILE_SIZE_MB}MB)
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        id="att-file"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.svg"
                        onChange={handleFileChange}
                        disabled={isUploading || isSubmitting}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadError(null)
                          document.getElementById("att-file")?.click()
                        }}
                        className="h-8 text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
                        disabled={isUploading || isSubmitting}
                      >
                        {isUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Paperclip className="h-3 w-3" />
                        )}
                        {isUploading ? "Uploading…" : "Browse…"}
                      </Button>
                      <span className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">
                        {newAttFileName || "No file chosen"}
                      </span>
                      {newAttFileName && !isUploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewAttFileName("")
                            setNewAttFileUrl("")
                            setUploadError(null)
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Upload progress bar */}
                    {isUploading && (
                      <div className="space-y-1">
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Uploading to secure storage… {uploadProgress}%
                        </p>
                      </div>
                    )}

                    {/* Upload success indicator */}
                    {newAttFileUrl && !isUploading && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        File uploaded securely. Ready to attach.
                      </p>
                    )}

                    {/* Upload error */}
                    {uploadError && (
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 leading-relaxed">
                        ⚠ {uploadError}
                      </p>
                    )}
                  </div>

                  {/* Add attachment button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!newAttTitle.trim() || !newAttFileName || !newAttFileUrl || isUploading || isSubmitting}
                    onClick={handleAddAttachment}
                    className="w-full h-8 text-[11px] font-semibold bg-primary/10 hover:bg-primary/20 text-primary border-none mt-1"
                  >
                    + Add Document
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isUploading || isSubmitting || !leaveTypeId}
            className="text-xs bg-sky-500 hover:bg-sky-600 text-white border-none min-w-[80px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing…
              </span>
            ) : (
              initialData ? "Resubmit" : "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
