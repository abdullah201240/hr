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

const DEFAULT_FORM: Partial<LeaveType> = {
  name: "",
  days: 0,
  paid: true,
  requiresApproval: true,
  requiresDocument: false,
  description: "",
  color: "bg-sky-500",
  icon: "CalendarOff",
  clause: "",
  carryForward: false,
  maxCarryOverDays: null,
  encashment: false,
  encashmentPercent: null,
  isProRata: false,
  sandwichRule: false,
  compLeaveExpiryDays: null,
  eligibility: "",
}

export function LeaveTypeDialog({ open, onOpenChange, editingLeave, onSave }: LeaveTypeDialogProps) {
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveType>>(DEFAULT_FORM)

  const handleReset = () => {
    setLeaveForm({ ...DEFAULT_FORM })
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
      clause: leaveForm.clause || null,
      carryForward: leaveForm.carryForward ?? false,
      maxCarryOverDays: leaveForm.maxCarryOverDays ?? null,
      encashment: leaveForm.encashment ?? false,
      encashmentPercent: leaveForm.encashmentPercent ?? null,
      isProRata: leaveForm.isProRata ?? false,
      sandwichRule: leaveForm.sandwichRule ?? false,
      compLeaveExpiryDays: leaveForm.compLeaveExpiryDays ?? null,
      eligibility: leaveForm.eligibility || null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLeave ? 'Edit Leave Type' : 'Add New Leave Type'}</DialogTitle>
          <DialogDescription>
            {editingLeave ? 'Update the leave policy configuration.' : 'Configure a new leave type for your organization.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">

          {/* ── Section: Basic Info ───────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">Basic Information</p>

            <div className="grid gap-2">
              <Label htmlFor="leaveName">Leave Type Name *</Label>
              <Input
                id="leaveName"
                placeholder="e.g., Annual Leave, Sick Leave"
                value={leaveForm.name || ''}
                onChange={(e) => setLeaveForm({...leaveForm, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div className="grid gap-2">
                <Label htmlFor="leaveClause">Clause Reference</Label>
                <Input
                  id="leaveClause"
                  placeholder="e.g., 5.4.3"
                  value={leaveForm.clause || ''}
                  onChange={(e) => setLeaveForm({...leaveForm, clause: e.target.value})}
                />
              </div>
            </div>

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

            <div className="grid gap-2">
              <Label htmlFor="leaveEligibility">Eligibility Restriction</Label>
              <Input
                id="leaveEligibility"
                placeholder="e.g., Female Employees Only (leave empty for all)"
                value={leaveForm.eligibility || ''}
                onChange={(e) => setLeaveForm({...leaveForm, eligibility: e.target.value})}
              />
            </div>
          </div>

          {/* ── Section: Core Policy ─────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">Core Policy</p>

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

          {/* ── Section: Carry Forward ──────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">Carry Forward & Encashment</p>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Allow Carry Forward</Label>
                <p className="text-xs text-muted-foreground">Unused leave can be carried to next year</p>
              </div>
              <Switch
                checked={leaveForm.carryForward || false}
                onCheckedChange={(checked) => setLeaveForm({
                  ...leaveForm,
                  carryForward: checked,
                  maxCarryOverDays: checked ? leaveForm.maxCarryOverDays : null,
                })}
              />
            </div>

            {leaveForm.carryForward && (
              <div className="grid gap-2 pl-4 border-l-2 border-border/40">
                <Label htmlFor="maxCarryOver" className="text-xs">Maximum Carry-Over Days</Label>
                <Input
                  id="maxCarryOver"
                  type="number"
                  min="0"
                  placeholder="e.g., 60 (leave empty for unlimited)"
                  value={leaveForm.maxCarryOverDays ?? ''}
                  onChange={(e) => setLeaveForm({...leaveForm, maxCarryOverDays: e.target.value ? parseInt(e.target.value) : null})}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Allow Encashment</Label>
                <p className="text-xs text-muted-foreground">Unused leave can be converted to cash</p>
              </div>
              <Switch
                checked={leaveForm.encashment || false}
                onCheckedChange={(checked) => setLeaveForm({
                  ...leaveForm,
                  encashment: checked,
                  encashmentPercent: checked ? leaveForm.encashmentPercent : null,
                })}
              />
            </div>

            {leaveForm.encashment && (
              <div className="grid gap-2 pl-4 border-l-2 border-border/40">
                <Label htmlFor="encashPct" className="text-xs">Encashment Percentage (%)</Label>
                <Input
                  id="encashPct"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 50"
                  value={leaveForm.encashmentPercent ?? ''}
                  onChange={(e) => setLeaveForm({...leaveForm, encashmentPercent: e.target.value ? parseInt(e.target.value) : null})}
                />
              </div>
            )}
          </div>

          {/* ── Section: Special Rules ──────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">Special Rules</p>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Pro-Rata Calculation</Label>
                <p className="text-xs text-muted-foreground">Days calculated based on actual service period (new joiners)</p>
              </div>
              <Switch
                checked={leaveForm.isProRata || false}
                onCheckedChange={(checked) => setLeaveForm({...leaveForm, isProRata: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sandwich Leave Rule</Label>
                <p className="text-xs text-muted-foreground">Intervening holidays between leave days count as leave</p>
              </div>
              <Switch
                checked={leaveForm.sandwichRule || false}
                onCheckedChange={(checked) => setLeaveForm({...leaveForm, sandwichRule: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Compensatory Leave Expiry</Label>
                <p className="text-xs text-muted-foreground">Must be availed within a set number of days (0 or empty = no expiry)</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Input
                type="number"
                min="0"
                placeholder="e.g., 14 days"
                value={leaveForm.compLeaveExpiryDays ?? ''}
                onChange={(e) => setLeaveForm({...leaveForm, compLeaveExpiryDays: e.target.value ? parseInt(e.target.value) : null})}
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
