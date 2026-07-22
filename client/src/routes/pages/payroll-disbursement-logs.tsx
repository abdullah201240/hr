import { useDisbursementsQuery } from "@/hooks/usePayroll"
import { DisbursementLogsTab } from "@/components/payroll/DisbursementLogsTab"

export default function PayrollDisbursementLogsPage() {
  const { data: disbursements = [], isLoading: isDisbursementsLoading } = useDisbursementsQuery()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Payroll Disbursement Logs</h2>
        <p className="text-muted-foreground text-sm">Audit trail of completed monthly payroll settlements and reference transaction records.</p>
      </div>

      <DisbursementLogsTab
        disbursements={disbursements}
        formatCurrency={formatCurrency}
        isLoading={isDisbursementsLoading}
      />
    </div>
  )
}
