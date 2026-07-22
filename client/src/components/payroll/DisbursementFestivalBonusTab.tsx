import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, AlertCircle, Loader2, CreditCard } from "lucide-react"
import {
  useFestivalCyclesQuery,
  useFestivalCycleDetailsQuery,
  useDisburseFestivalCycleMutation,
} from "@/hooks/useFestivalBonus"
import Swal from "sweetalert2"
import { toast } from "sonner"

interface DisbursementFestivalBonusTabProps {
  formatCurrency: (amount: number) => string
}

export function DisbursementFestivalBonusTab({
  formatCurrency,
}: DisbursementFestivalBonusTabProps) {
  const { data: cycles = [], isLoading: isCyclesLoading } = useFestivalCyclesQuery()

  // Find cycles that are Awaiting_Disbursement or Disbursed
  const disbursementCycles = useMemo(() => {
    return cycles.filter((cy) => cy.status === "Awaiting_Disbursement" || cy.status === "Disbursed")
  }, [cycles])

  const [selectedCycleId, setSelectedCycleId] = useState<string>("")
  const activeCycleId = selectedCycleId || disbursementCycles[0]?.id || ""

  const { data: cycleDetails, isLoading: isDetailsLoading } = useFestivalCycleDetailsQuery(activeCycleId)

  const disburseMutation = useDisburseFestivalCycleMutation()

  const [paymentMethod, setPaymentMethod] = useState("Bank_Transfer")
  const [paymentRef, setPaymentRef] = useState("")
  const [disbursementDate, setDisbursementDate] = useState(() => new Date().toISOString().split("T")[0])

  const payouts = cycleDetails?.payouts || []
  const cycle = cycleDetails?.cycle

  const handleDisburse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeCycleId) return

    if (!paymentRef.trim()) {
      toast.error("Please enter a payment reference number/ID")
      return
    }

    Swal.fire({
      title: "Disburse Festival Payouts?",
      text: `Are you sure you want to disburse payouts for "${cycle?.name}"? This will update all payout records to Paid status.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Disburse Payouts",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        disburseMutation.mutate(
          {
            id: activeCycleId,
            paymentMethod,
            paymentRef: paymentRef.trim(),
            disbursementDate,
          },
          {
            onSuccess: () => {
              Swal.fire("Disbursed!", "Festival cycle has been successfully paid and recorded.", "success")
              setPaymentRef("")
            },
            onError: (err) => {
              toast.error(err.message || "Disbursement execution failed")
            },
          }
        )
      }
    })
  }

  return (
    <div className="space-y-6">
      {disbursementCycles.length > 0 && cycle?.status === "Awaiting_Disbursement" && (
        <Card className="shadow-none border-indigo-100 bg-indigo-50/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-900">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Execute Festival Payout Disbursement
            </CardTitle>
            <CardDescription className="text-xs text-indigo-700">
              Enter accounts reference details to initiate payment transfer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDisburse} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="payMethod" className="text-xs font-semibold text-indigo-900">Payment Method</Label>
                <select
                  id="payMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-white border border-indigo-200 text-xs h-9 rounded-md px-2"
                >
                  <option value="Bank_Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Mobile_Banking">Mobile Banking (bKash/Nagad)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payRef" className="text-xs font-semibold text-indigo-900">Reference / Txn ID</Label>
                <Input
                  id="payRef"
                  type="text"
                  placeholder="e.g. TXN982301"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="bg-white border-indigo-200 text-xs h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payDate" className="text-xs font-semibold text-indigo-900">Disbursement Date</Label>
                <Input
                  id="payDate"
                  type="date"
                  value={disbursementDate}
                  onChange={(e) => setDisbursementDate(e.target.value)}
                  className="bg-white border-indigo-200 text-xs h-9"
                  required
                />
              </div>

              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                disabled={disburseMutation.isPending}
              >
                {disburseMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Mark As Disbursed
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              Festival Bonus Disbursement Register
            </CardTitle>
            <CardDescription className="text-xs">
              List of paid or pending payout entries for the selected cycle.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {disbursementCycles.length > 0 && (
              <select
                value={activeCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                {disbursementCycles.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} ({opt.status})
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isCyclesLoading || isDetailsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading disbursement details...</span>
            </div>
          ) : disbursementCycles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
              No festival bonus cycles are ready for disbursement.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Basic Salary</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Calculated</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Final Payout</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Payment Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((pay) => (
                  <TableRow key={pay.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{pay.employeeName}</p>
                        <p className="text-[10px] text-muted-foreground">{pay.employeeCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs">{pay.employeeType}</TableCell>
                    <TableCell className="py-3 text-xs">{formatCurrency(pay.basicSalary)}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{formatCurrency(pay.calculatedAmount)}</TableCell>
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      {formatCurrency(pay.finalAmount)}
                    </TableCell>
                    <TableCell className="py-3">
                      {pay.status === "Paid" || cycle?.status === "Disbursed" ? (
                        <Badge className="text-[9px] font-bold py-0.5 px-2 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          Disbursed
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] font-bold py-0.5 px-2 bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                          Awaiting Disbursement
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {pay.paymentMethod ? (
                        <span>
                          {pay.paymentMethod.replace("_", " ")} - <span className="font-semibold text-foreground">{pay.paymentRef}</span>
                        </span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
