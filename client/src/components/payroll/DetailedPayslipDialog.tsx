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
              <p className="text-[10px] text-muted-foreground print:text-foreground">Employee ID</p>
              <p className="font-semibold mt-0.5">{viewPayslip.employeeDisplayId || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground print:text-foreground">Designation</p>
              <p className="font-semibold mt-0.5">{viewPayslip.designationName || "\u2014"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground print:text-foreground">Department</p>
              <p className="font-semibold mt-0.5">{viewPayslip.departmentName || "—"}</p>
            </div>
          </div>

          {/* Attendance & Leave Summary in detailed view */}
          <div className="p-3 bg-muted/20 border border-border/30 rounded-lg space-y-2">
            <p className="font-bold text-[10px] uppercase text-muted-foreground tracking-wide">Attendance & Leave Details</p>
            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              <div className="bg-background p-1.5 rounded border border-border/40">
                <p className="text-muted-foreground">Working</p>
                <p className="font-bold text-xs mt-0.5">{viewPayslip.totalWorkingDays ?? 0} d</p>
              </div>
              <div className="bg-emerald-500/5 text-emerald-600 p-1.5 rounded border border-emerald-500/10">
                <p className="text-emerald-600/80">Present</p>
                <p className="font-bold text-xs mt-0.5">{viewPayslip.presentDays ?? 0} d</p>
              </div>
              <div className="bg-rose-500/5 text-rose-600 p-1.5 rounded border border-rose-500/10">
                <p className="text-rose-600/80">Absent</p>
                <p className="font-bold text-xs mt-0.5">{viewPayslip.absentDays ?? 0} d</p>
              </div>
              <div className="bg-blue-500/5 text-blue-600 p-1.5 rounded border border-blue-500/10">
                <p className="text-blue-600/80">Leaves</p>
                <p className="font-bold text-xs mt-0.5">{viewPayslip.leaveDays ?? 0} d</p>
              </div>
              <div className="bg-amber-500/5 text-amber-600 p-1.5 rounded border border-amber-500/10">
                <p className="text-amber-600/80">Late</p>
                <p className="font-bold text-xs mt-0.5">{viewPayslip.lateDays ?? 0} d</p>
              </div>
            </div>
          </div>

          {/* Earnings and deductions lists */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            {/* Earnings */}
            <div className="space-y-2">
              <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">Earnings</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Basic Salary:</span><span className="font-semibold">{formatCurrency(viewPayslip.basicSalary)}</span></div>
                {viewPayslip.allowances && Object.entries(viewPayslip.allowances).map(([name, val]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}:</span>
                    <span className="font-semibold">{formatCurrency(val as number)}</span>
                  </div>
                ))}
                {(!viewPayslip.allowances || Object.keys(viewPayslip.allowances).length === 0) && (
                  <>
                    <div className="flex justify-between"><span>HRA Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceHra)}</span></div>
                    <div className="flex justify-between"><span>Transport Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceTransport)}</span></div>
                    <div className="flex justify-between"><span>Medical Allowance:</span><span className="font-semibold">{formatCurrency(viewPayslip.allowanceMedical)}</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-2">
              <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">Deductions</p>
              <div className="space-y-1">
                {viewPayslip.deductions && Object.entries(viewPayslip.deductions).map(([name, val]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}:</span>
                    <span className="font-semibold">{formatCurrency(val as number)}</span>
                  </div>
                ))}
                {(!viewPayslip.deductions || Object.keys(viewPayslip.deductions).length === 0) && (
                  <>
                    <div className="flex justify-between"><span>Income Tax:</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionTax)}</span></div>
                    <div className="flex justify-between"><span>PF Contribution ({empPfRate}%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionPf)}</span></div>
                  </>
                )}
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
          <Button size="sm" className="gap-2 text-xs cursor-pointer" onClick={() => window.open(`/payroll/print/${selectedMonth}/${viewPayslip.id}`, "_blank")}>
            <Printer className="h-4 w-4" />
            Print Payslip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
