import { useParams, useNavigate } from "react-router"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Loader2 } from "lucide-react"
import { usePayrollCycleQuery } from "@/hooks/usePayroll"

export default function PrintPayslipPage() {
  const { monthKey, payslipId } = useParams<{ monthKey: string; payslipId: string }>()
  const navigate = useNavigate()
  const { data: cycle, isLoading, isError } = usePayrollCycleQuery(monthKey || "")

  const viewPayslip = cycle?.payslips?.find((p) => p.id === payslipId)

  // Auto-trigger printing when loading is done and data is present
  useEffect(() => {
    if (viewPayslip) {
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [viewPayslip])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Loading payslip statement...</p>
      </div>
    )
  }

  if (isError || !viewPayslip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Statement Not Found</h1>
        <p className="text-muted-foreground mt-2">The requested payslip details could not be loaded.</p>
        <Button onClick={() => navigate("/payroll")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Payroll
        </Button>
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }



  const pfRate = 10; // Standard provident fund matching rate default

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      {/* Control Panel (Hidden during print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print bg-card p-4 rounded-xl">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 cursor-pointer">
          <Printer className="h-4 w-4" /> Print Payslip
        </Button>
      </div>

      {/* Official Payslip Statement Container */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16">
        {/* Style block for printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            html, body, #root, .dark, [class*="dark"] {
              background-color: white !important;
              color: black !important;
            }
            .print-document, .print-document * {
              background-color: white !important;
              color: black !important;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
          }
        `}} />

        {/* Company Header */}
        <div className="flex justify-between items-start pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-slate-50">
              Sadoshima Global Corp
            </h1>
            <p className="text-xs text-muted-foreground mt-1 print:text-slate-600">
              123 Innovation Boulevard, Suite 500<br />
              Dhaka, Bangladesh • contact@sadoshima.com
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground print:text-slate-600">
            <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">Salary Statement</p>
            <p className="mt-1">Period: {monthKey}</p>
          </div>
        </div>

        <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed print:text-black">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg print:bg-transparent print:rounded-none">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground print:text-slate-600">Employee Name</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black mt-0.5">{viewPayslip.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground print:text-slate-600">Employee ID</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black mt-0.5">{viewPayslip.employeeDisplayId || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground print:text-slate-600">Designation</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black mt-0.5">{viewPayslip.designationName || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground print:text-slate-600">Department</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black mt-0.5">{viewPayslip.departmentName || "—"}</p>
            </div>
          </div>

          {/* Earnings and Deductions Columns */}
          <div className="grid grid-cols-2 gap-8 pt-4">
            {/* Earnings */}
            <div className="space-y-3">
              <p className="font-bold text-xs uppercase text-emerald-600 pb-1 tracking-wider">Earnings</p>
              <div className="space-y-2 text-xs">
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
                {viewPayslip.bonusAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Bonus ({viewPayslip.bonusDescription || "Performance"}):</span>
                    <span className="font-semibold">{formatCurrency(viewPayslip.bonusAmount)}</span>
                  </div>
                )}
                {viewPayslip.festivalBonusAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Festival Bonus:</span>
                    <span className="font-semibold">{formatCurrency(viewPayslip.festivalBonusAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <p className="font-bold text-xs uppercase text-rose-500 pb-1 tracking-wider">Deductions</p>
              <div className="space-y-2 text-xs">
                {viewPayslip.deductions && Object.entries(viewPayslip.deductions).map(([name, val]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}:</span>
                    <span className="font-semibold">{formatCurrency(val as number)}</span>
                  </div>
                ))}
                {(!viewPayslip.deductions || Object.keys(viewPayslip.deductions).length === 0) && (
                  <>
                    <div className="flex justify-between"><span>Income Tax:</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionTax)}</span></div>
                    <div className="flex justify-between"><span>PF Contribution ({pfRate}%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductionPf)}</span></div>
                  </>
                )}
              </div>
            </div>
          </div>

         

          {/* Disbursement details */}
          {viewPayslip.paymentStatus === "Paid" && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg space-y-1 print:bg-transparent print:rounded-none">
              <p className="font-bold text-xs uppercase text-emerald-600 print:text-black tracking-wide">Payout Disbursement Info</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground print:text-slate-700 mt-1">
                <div><span className="font-medium text-foreground print:text-black">Date:</span> {viewPayslip.paymentDate}</div>
                <div><span className="font-medium text-foreground print:text-black">Method:</span> {viewPayslip.paymentMethod}</div>
                <div className="col-span-2"><span className="font-medium text-foreground print:text-black">Reference:</span> <span className="font-mono">{viewPayslip.paymentReference}</span></div>
              </div>
            </div>
          )}

          {/* Net Pay Box */}
          <div className="pt-4 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-900 dark:text-slate-50 print:text-black text-base">Net Pay Distribution:</span>
            <span className="text-2xl font-extrabold text-primary print:text-black">{formatCurrency(viewPayslip.netPay)}</span>
          </div>

          {/* Signatures */}
          <div className="flex justify-between pt-20 text-xs">
            <div className="text-center w-40 pt-2">
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black">Officer Signature</p>
            </div>
            <div className="text-center w-40 pt-2">
              <p className="font-semibold text-slate-900 dark:text-slate-50 print:text-black">HR Director / Auditor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
