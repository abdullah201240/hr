import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useChangeEmployeeStatusMutation } from "@/hooks/useEmployees"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface StatusChangeDialogProps {
  employee: { id: string; name: string; currentStatus: string } | null
  onClose: () => void
}

export function StatusChangeDialog({ employee, onClose }: StatusChangeDialogProps) {
  const [inactiveDate, setInactiveDate] = useState<string>("")
  const statusMutation = useChangeEmployeeStatusMutation(employee?.id || "")

  const handleStatusChange = () => {
    if (!employee) return

    const payload = employee.currentStatus === "active"
      ? { status: "inactive" as const, inactiveDate: inactiveDate || undefined }
      : { status: "active" as const }

    statusMutation.mutate(payload, {
      onSuccess: (res) => {
        toast.success(res.message)
        onClose()
        setInactiveDate("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to change employee status")
      },
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
      setInactiveDate("")
    }
  }

  return (
    <Dialog open={!!employee} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {employee?.currentStatus === "active" ? "Set Employee Inactive" : "Reactivate Employee"}
          </DialogTitle>
          <DialogDescription>
            {employee?.currentStatus === "active"
              ? `Schedule or immediately deactivate ${employee?.name}.`
              : `Reactivate ${employee?.name} to active status.`}
          </DialogDescription>
        </DialogHeader>

        {employee?.currentStatus === "active" && (
          <div className="space-y-3 py-2">
            <Label htmlFor="inactive-date" className="text-sm font-medium">
              Inactive Effective Date <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="inactive-date"
              type="date"
              value={inactiveDate}
              onChange={(e) => setInactiveDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="bg-transparent border-border/60"
            />
            <p className="text-xs text-muted-foreground">
              {inactiveDate
                ? `Employee will become inactive on ${inactiveDate}. A scheduled job will handle the transition automatically.`
                : "Leave empty to mark inactive immediately."}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              setInactiveDate("")
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={statusMutation.isPending}
            className={cn(
              employee?.currentStatus === "active"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"
            )}
          >
            {statusMutation.isPending
              ? "Processing..."
              : employee?.currentStatus === "active"
                ? inactiveDate
                  ? `Schedule Inactive (${inactiveDate})`
                  : "Mark Inactive Now"
                : "Reactivate Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
