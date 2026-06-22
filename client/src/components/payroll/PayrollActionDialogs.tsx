import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// --- 1. SalaryDisbursementDialog ---
interface SalaryDisbursementDialogProps {
  isOpen: boolean
  onClose: () => void
  payoutMethod: string
  setPayoutMethod: (val: string) => void
  payoutDate: string
  setPayoutDate: (val: string) => void
  payoutRef: string
  setPayoutRef: (val: string) => void
  onExecute: () => void
  isPending: boolean
}

export function SalaryDisbursementDialog({
  isOpen,
  onClose,
  payoutMethod,
  setPayoutMethod,
  payoutDate,
  setPayoutDate,
  payoutRef,
  setPayoutRef,
  onExecute,
  isPending,
}: SalaryDisbursementDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Distribute & Disburse Salaries</DialogTitle>
          <DialogDescription className="text-xs">Configure payout distribution parameters to mark ledger as PAID.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Distribution Method</Label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full bg-background border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
            >
              <option value="Bank Transfer">Bank Transfer (EFT/Wire)</option>
              <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
              <option value="Cash Payment">Cash Payment</option>
              <option value="Corporate Cheque">Corporate Cheque</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Disbursement Date</Label>
            <Input
              type="date"
              value={payoutDate}
              onChange={(e) => setPayoutDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Transaction Reference / Voucher ID</Label>
            <Input
              placeholder="e.g. TXN98724128"
              value={payoutRef}
              onChange={(e) => setPayoutRef(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={onExecute} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none" disabled={isPending}>
            {isPending ? "Executing..." : "Execute Payout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// --- 2. GlobalPfSetupDialog ---
interface GlobalPfSetupDialogProps {
  isOpen: boolean
  onClose: () => void
  empPfRate: number
  setEmpPfRate: (val: number) => void
  employerPfRate: number
  setEmployerPfRate: (val: number) => void
  onSave: () => void
  isPending: boolean
}

export function GlobalPfSetupDialog({
  isOpen,
  onClose,
  empPfRate,
  setEmpPfRate,
  employerPfRate,
  setEmployerPfRate,
  onSave,
  isPending,
}: GlobalPfSetupDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Global PF Setup</DialogTitle>
          <DialogDescription className="text-xs">Adjust percentage values for retirement Provident Fund allocations.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Employee Contribution (%)</Label>
            <Input
              type="number"
              value={empPfRate}
              onChange={(e) => setEmpPfRate(Number(e.target.value))}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Employer Match Rate (%)</Label>
            <Input
              type="number"
              value={employerPfRate}
              onChange={(e) => setEmployerPfRate(Number(e.target.value))}
              className="text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Cancel</Button>
          <Button size="sm" onClick={onSave} className="text-xs" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
