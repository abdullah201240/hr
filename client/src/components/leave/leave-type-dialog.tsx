import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { LeaveType } from "@/types"

interface LeaveTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingLeave: LeaveType | null
  onSave: (leaveType: LeaveType) => void
}

export function LeaveTypeDialog({ open, onOpenChange, editingLeave, onSave }: LeaveTypeDialogProps) {
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveType>>({
    name: "",
    days: 0,
    paid: true,
    requiresApproval: true,
    requiresDocument: false,
    description: "",
    color: "bg-sky-500",
    icon: "CalendarOff"
  })

  const handleReset = () => {
    setLeaveForm({
      name: "",
      days: 0,
      paid: true,
      requiresApproval: true,
      requiresDocument: false,
      description: "",
      color: "bg-sky-500",
      icon: "CalendarOff"
    })
  }

  // Reset form when dialog opens or editingLeave changes
  useEffect(() => {
    if (open) {
      if (editingLeave) {
        setLeaveForm(editingLeave)
      } else {
        handleReset()
      }
    }
  }, [editingLeave, open])

  const handleSave = () => {
    if (!leaveForm.name || leaveForm.name.trim() === '') {
      toast.error('Please enter a leave type name')
      return
    }
    if (leaveForm.days === undefined || leaveForm.days < 0) {
      toast.error('Please enter valid number of days')
      return
    }

    const newLeaveType: LeaveType = {
      id: editingLeave?.id || '',
      name: leaveForm.name!,
      description: leaveForm.description || '',
      days: leaveForm.days!,
      paid: leaveForm.paid ?? true,
      requiresApproval: leaveForm.requiresApproval ?? true,
      requiresDocument: leaveForm.requiresDocument ?? false,
      color: leaveForm.color || 'bg-sky-500',
      icon: leaveForm.icon || 'CalendarOff',
      isActive: leaveForm.isActive ?? true
    }

    onSave(newLeaveType)
    handleReset()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleReset()
      }
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingLeave ? 'Edit Leave Type' : 'Add New Leave Type'}</DialogTitle>
          <DialogDescription>
            {editingLeave ? 'Update the leave policy configuration.' : 'Configure a new leave type for your organization.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Leave Name */}
          <div className="grid gap-2">
            <Label htmlFor="leaveName">Leave Type Name *</Label>
            <Input
              id="leaveName"
              placeholder="e.g., Annual Leave, Sick Leave"
              value={leaveForm.name || ''}
              onChange={(e) => setLeaveForm({...leaveForm, name: e.target.value})}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="leaveDesc">Description</Label>
            <Textarea
              id="leaveDesc"
              placeholder="Brief description of this leave type..."
              value={leaveForm.description || ''}
              onChange={(e) => setLeaveForm({...leaveForm, description: e.target.value})}
              rows={2}
            />
          </div>

          {/* Days Allocation */}
          <div className="grid gap-2">
            <Label htmlFor="leaveDays">Annual Days *</Label>
            <Input
              id="leaveDays"
              type="number"
              min="0"
              max="365"
              value={leaveForm.days || 0}
              onChange={(e) => setLeaveForm({...leaveForm, days: parseInt(e.target.value) || 0})}
            />
          </div>

          {/* Policy Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Paid Leave</Label>
                <p className="text-xs text-muted-foreground">Employees receive salary during this leave</p>
              </div>
              <Switch
                checked={leaveForm.paid || false}
                onCheckedChange={(checked) => setLeaveForm({...leaveForm, paid: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Requires Approval</Label>
                <p className="text-xs text-muted-foreground">Manager must approve leave requests</p>
              </div>
              <Switch
                checked={leaveForm.requiresApproval || false}
                onCheckedChange={(checked) => setLeaveForm({...leaveForm, requiresApproval: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Document Required</Label>
                <p className="text-xs text-muted-foreground">Employees must upload supporting documents</p>
              </div>
              <Switch
                checked={leaveForm.requiresDocument || false}
                onCheckedChange={(checked) => setLeaveForm({...leaveForm, requiresDocument: checked})}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {editingLeave ? 'Update Leave Type' : 'Add Leave Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
