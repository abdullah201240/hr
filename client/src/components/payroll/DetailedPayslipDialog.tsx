import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Printer, Info } from "lucide-react"

interface DetailedPayslipDialogProps {
  isOpen: boolean
  onClose: () => void
  viewPayslip: any
  empPfRate: number
  selectedMonth: string
  formatCurrency: (val: number) => string
}

export function DetailedPayslipDialog({
  isOpen,
  onClose,
  viewPayslip,
  empPfRate,
  selectedMonth,
  formatCurrency,
}: DetailedPayslipDialogProps) {
  if (!viewPayslip) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] text-xs">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-base font-bold flex items-center justify-between">
            <span>Pay Slip Ledger</span>
            <span className="text-[10px] text-muted-foreground mr-4">Period: {selectedMonth}</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] uppercase font-bold tracking-wider text-primary">Sadoshima Global Corp</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 border-t border-b border-border/40 py-4 text-xs print:border-none print:py-0">
          {/* Print layout branding */}
          <div className="hidden print:block text-center space-y-1 pb-4 border-b border-border">
            <h1 className="text-lg font-extrabold uppercase tracking-widest text-foreground">Sadoshima Global Corp</h1>
            <p className="text-[10px] text-muted-foreground">CONFIDENTIAL OFFICER SALARY PAYSLIP STATEMENT</p>
            <p className="text-[11px] font-bold">Salary Period: {selectedMonth}</p>
          </div>

          {/* Meta details */}
          <div className="grid grid-cols-2 gap-4 bg-muted/20 print:bg-transparent print:border print:border-border p-3 rounded-lg print:rounded-none">
            <div>
              <p className="text-[10px] text-muted-foreground print:text-foreground">Employee Name</p>
              <p className="font-semibold mt-0.5">{viewPayslip.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground print:text-foreground">Designation</p>
              <p className="font-semibold mt-0.5">{viewPayslip.role}</p>
            </div>
          </div>

          {/* Earnings and deductions lists */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Earnings */}
            <div className="space-y-2">
              <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">Earnings</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Basic Salary:</span><span className="font-semibold">{formatCurrency(viewPayslip.basicSalary)}</span></div>
                <div className="flex justify-between"><span>HRA Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceHra)}</span></div>
                <div className="flex justify-between"><span>Transport Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceTransport)}</span></div>
                <div className="flex justify-between"><span>Medical Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceMedical)}</span></div>
                {viewPayslip.festivalBonusAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Tenure Bonus:</span>
                    <span>{formatCurrency(viewPayslip.festivalBonusAmount)}</span>
                  </div>
                )}
                {viewPayslip.bonusAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Bonus ({viewPayslip.bonusDescription}):</span>
                    <span>{formatCurrency(viewPayslip.bonusAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-2">
              <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">Deductions</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Income Tax:</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionTax)}</span></div>
                <div className="flex justify-between"><span>PF Contribution ({empPfRate}%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionPf)}</span></div>
              </div>
            </div>
          </div>

          {/* Calculation Proof Details Section */}
          <div className="p-3 bg-muted/10 border border-border/40 rounded-lg space-y-1.5 print:hidden">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>CALCULATION PROOF (AUDIT TRAIL)</span>
            </div>
            <div className="text-[10px] text-muted-foreground space-y-1">
              <p>• Basic Salary calculated dynamically from assigned employee profile template component policies.</p>
              <p>• Festival Bonus computed against Tenure rules based on Join Date ({viewPayslip.joinDate || "N/A"}).</p>
              <p>• PF matching rate calculated at standard matching ({empPfRate}% employee share).</p>
            </div>
          </div>

          {/* Disbursement info if paid */}
          {viewPayslip.paymentStatus === "Paid" && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1 print:border-none print:bg-transparent">
              <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wide">Payout Disbursement Info</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <div><span className="font-medium text-foreground">Date:</span> {viewPayslip.paymentDate}</div>
                <div><span className="font-medium text-foreground">Method:</span> {viewPayslip.paymentMethod}</div>
                <div className="col-span-2"><span className="font-medium text-foreground">Reference:</span> <span className="font-mono">{viewPayslip.paymentReference}</span></div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border/40 flex justify-between items-center text-sm">
            <span className="font-bold text-foreground">Net Pay Distribution:</span>
            <span className="text-xl font-extrabold text-primary">{formatCurrency(viewPayslip.netPay)}</span>
          </div>

          {/* Print layout signature footer */}
          <div className="hidden print:flex justify-between pt-16 text-[10px]">
            <div className="text-center w-36 border-t border-border pt-1">
              <p className="font-semibold">Officer Signature</p>
            </div>
            <div className="text-center w-36 border-t border-border pt-1">
              <p className="font-semibold">HR Director / Auditor</p>
            </div>
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Close</Button>
          <Button size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Payslip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
