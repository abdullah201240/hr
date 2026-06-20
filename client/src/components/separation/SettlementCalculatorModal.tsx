import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Receipt,
  FileText,
  TrendingUp,
  ShieldAlert,
  DollarSign,
  Printer,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useSettlementQuery,
  useSaveSettlementMutation,
  useUpdateSettlementStatusMutation,
} from "@/hooks/useSettlement"
import { Button } from "@/components/ui/button"

interface SettlementCalculatorModalProps {
  isOpen: boolean
  onClose: () => void
  separationId: string
  employeeName: string
}

export function SettlementCalculatorModal({
  isOpen,
  onClose,
  separationId,
  employeeName,
}: SettlementCalculatorModalProps) {
  const { data: settlement, isLoading, refetch } = useSettlementQuery(separationId, isOpen)
  const saveMutation = useSaveSettlementMutation()
  const statusMutation = useUpdateSettlementStatusMutation()

  // Form states
  const [separationType, setSeparationType] = useState("Resignation")
  const [payableDays, setPayableDays] = useState(0)
  const [encashableAlDays, setEncashableAlDays] = useState(0)
  const [pfInterest, setPfInterest] = useState(0)
  const [medicalReimbursement, setMedicalReimbursement] = useState(0)
  const [wellnessAllowance, setWellnessAllowance] = useState(0)
  const [otherReimbursements, setOtherReimbursements] = useState(0)
  const [salaryAdvanceRecovery, setSalaryAdvanceRecovery] = useState(0)
  const [loanRecovery, setLoanRecovery] = useState(0)
  const [noticePayRecovery, setNoticePayRecovery] = useState(0)
  const [assetRecovery, setAssetRecovery] = useState(0)
  const [taxAdjustment, setTaxAdjustment] = useState(0)
  const [otherCompanyDues, setOtherCompanyDues] = useState(0)
  const [paymentDetails, setPaymentDetails] = useState("")

  // Initialize form state from loaded settlement data
  useEffect(() => {
    if (settlement) {
      setSeparationType(settlement.separationType)
      setPayableDays(settlement.payableDays)
      setEncashableAlDays(settlement.encashableAlDays)
      setPfInterest(settlement.pfInterest)
      setMedicalReimbursement(settlement.medicalReimbursement)
      setWellnessAllowance(settlement.wellnessAllowance)
      setOtherReimbursements(settlement.otherReimbursements)
      setSalaryAdvanceRecovery(settlement.salaryAdvanceRecovery)
      setLoanRecovery(settlement.loanRecovery)
      setNoticePayRecovery(settlement.noticePayRecovery)
      setAssetRecovery(settlement.assetRecovery)
      setTaxAdjustment(settlement.taxAdjustment)
      setOtherCompanyDues(settlement.otherCompanyDues)
      setPaymentDetails(settlement.paymentDetails || "")
    }
  }, [settlement])

  if (!isOpen) return null

  if (isLoading || !settlement) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[400px]">
          <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading settlement matrix...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Live Calculations (to update instantly on user input!)
  const basicSalary = settlement.basicSalary || 50000
  const grossSalary = settlement.grossSalary || 67500
  const serviceYears = settlement.serviceYears || 0
  const employeePfBalance = settlement.employeePfBalance || 0
  const employerPfBalance = settlement.employerPfBalance || 0
  const festivalBonusAdjustment = settlement.festivalBonusAdjustment || 0

  // 1. Salary Payable
  const salaryPayable = Number(((grossSalary / 30) * payableDays).toFixed(2))

  // 2. Separation Benefit
  let separationBenefit = 0
  if (separationType === "Retirement") {
    separationBenefit = (serviceYears <= 10 ? 1 : 1.5) * basicSalary * serviceYears
  } else if (separationType === "Resignation") {
    if (serviceYears >= 5 && serviceYears <= 10) {
      separationBenefit = (14 / 30) * basicSalary * serviceYears
    } else if (serviceYears > 10) {
      separationBenefit = 1 * basicSalary * serviceYears
    }
  } else if (separationType === "Termination") {
    separationBenefit = (serviceYears <= 10 ? 1 : 1.5) * basicSalary * serviceYears
  }
  separationBenefit = Number(separationBenefit.toFixed(2))

  // 3. Leave Encashment
  const leaveEncashment = Number(((basicSalary / 30) * encashableAlDays).toFixed(2))

  // Totals
  const totalEarnings = 
    salaryPayable +
    separationBenefit +
    leaveEncashment +
    festivalBonusAdjustment +
    employeePfBalance +
    employerPfBalance +
    pfInterest +
    medicalReimbursement +
    wellnessAllowance +
    otherReimbursements

  const totalRecoveries =
    salaryAdvanceRecovery +
    loanRecovery +
    noticePayRecovery +
    assetRecovery +
    taxAdjustment +
    otherCompanyDues

  const netSettlementAmount = Number((totalEarnings - totalRecoveries).toFixed(2))

  const handleSave = () => {
    saveMutation.mutate({
      separationId,
      payload: {
        separationType,
        payableDays,
        encashableAlDays,
        pfInterest,
        medicalReimbursement,
        wellnessAllowance,
        otherReimbursements,
        salaryAdvanceRecovery,
        loanRecovery,
        noticePayRecovery,
        assetRecovery,
        taxAdjustment,
        otherCompanyDues,
      }
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleUpdateStatus = (newStatus: "Approved" | "Paid") => {
    statusMutation.mutate({
      separationId,
      status: newStatus,
      paymentDetails: newStatus === "Paid" ? paymentDetails : undefined
    }, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const isReadOnly = settlement.status === "Paid" || settlement.status === "Approved"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        {/* Style block to cleanly isolate print layout */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
            .print\\:bg-transparent {
              background: transparent !important;
            }
            .print\\:p-0 {
              padding: 0 !important;
            }
          }
        `}} />

        <div className="print-area">
          {/* Print Letterhead Branding Header */}
          <div className="hidden print:block text-center space-y-1 pb-4 border-b border-border mb-4">
            <h1 className="text-lg font-extrabold uppercase tracking-widest text-foreground">Sadoshima Global Corp</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">CONFIDENTIAL FULL & FINAL (F&F) SETTLEMENT STATEMENT</p>
            <p className="text-[11px] font-bold mt-1">Exiting Employee: {employeeName} ({settlement.employeeEmail})</p>
          </div>

          <DialogHeader className="print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  F&F Settlement Matrix — {employeeName}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Computes 16-step separation payouts, provident funds, and recoveries based on service terms.
                </DialogDescription>
              </div>
              <Badge className={cn("text-xs font-bold border-none px-3 py-1",
                settlement.status === "Paid" && "bg-emerald-500/10 text-emerald-600",
                settlement.status === "Approved" && "bg-amber-500/10 text-amber-600",
                settlement.status === "Draft" && "bg-sky-500/10 text-sky-600"
              )}>
                Status: {settlement.status}
              </Badge>
            </div>
          </DialogHeader>

          {/* Matrix Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-xs print:py-2">
            {/* Left Column: parameters and earnings */}
            <div className="space-y-4">
              <div className="p-4 border border-border/40 bg-muted/10 rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-foreground flex items-center gap-2 border-b border-border/10 pb-1.5">
                  <FileText className="h-4 w-4 text-primary print:hidden" />
                  1. Service Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Separation Type</Label>
                    <div className="print:hidden">
                      <Select 
                        disabled={isReadOnly}
                        value={separationType} 
                        onValueChange={setSeparationType}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Resignation" className="text-xs">Resignation</SelectItem>
                          <SelectItem value="Retirement" className="text-xs">Retirement</SelectItem>
                          <SelectItem value="Termination" className="text-xs">Termination</SelectItem>
                          <SelectItem value="Dismissal" className="text-xs">Dismissal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{separationType}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Completed Years</Label>
                    <Input disabled value={serviceYears} className="h-8 text-xs bg-muted/50 print:hidden" />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{serviceYears} Years</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Payable Days (Month)</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={payableDays} 
                      onChange={e => setPayableDays(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{payableDays} Days</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Encashable AL Days</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={encashableAlDays} 
                      onChange={e => setEncashableAlDays(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">{encashableAlDays} Days</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/20 grid grid-cols-2 gap-4 text-[11px] text-muted-foreground print:text-foreground">
                  <div>Basic Salary: <span className="font-semibold text-foreground">৳{basicSalary.toLocaleString()}</span></div>
                  <div>Gross Salary: <span className="font-semibold text-foreground">৳{grossSalary.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="p-4 border border-border/40 bg-emerald-500/[0.02] rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-emerald-600 flex items-center gap-2 border-b border-border/10 pb-1.5 print:text-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500 print:hidden" />
                  2. Payouts & Earnings (৳)
                </h3>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Salary Payable</span>
                    <span className="font-semibold text-foreground">৳{salaryPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Separation Benefit (Gratuity/Tenure)</span>
                    <span className="font-semibold text-foreground">৳{separationBenefit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Leave Encashment</span>
                    <span className="font-semibold text-foreground">৳{leaveEncashment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Festival Bonus Adj.</span>
                    <span className="font-semibold text-foreground">৳{festivalBonusAdjustment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/10">
                    <span className="text-muted-foreground print:text-foreground">Provident Fund Balance (Emp+Empr)</span>
                    <span className="font-semibold text-foreground">৳{(employeePfBalance + employerPfBalance).toLocaleString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">PF Interest</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={pfInterest} 
                        onChange={e => setPfInterest(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{pfInterest.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Medical Reimbursement</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={medicalReimbursement} 
                        onChange={e => setMedicalReimbursement(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{medicalReimbursement.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Wellness Allowance</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={wellnessAllowance} 
                        onChange={e => setWellnessAllowance(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{wellnessAllowance.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] text-muted-foreground">Other Reimbursements</Label>
                      <Input 
                        disabled={isReadOnly}
                        type="number" 
                        value={otherReimbursements} 
                        onChange={e => setOtherReimbursements(Number(e.target.value))} 
                        className="h-7 text-[11px] print:hidden" 
                      />
                      <p className="hidden print:block font-semibold text-[11px] border border-border/20 p-1.5 rounded bg-muted/5">৳{otherReimbursements.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20 text-emerald-700 font-bold text-sm print:text-foreground">
                    <span>Total Earnings</span>
                    <span>৳{totalEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Recoveries & Deductions */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="p-4 border border-border/40 bg-rose-500/[0.02] rounded-2xl space-y-3 print:bg-transparent print:border print:border-border/30">
                <h3 className="font-bold text-rose-600 flex items-center gap-2 border-b border-border/10 pb-1.5 print:text-foreground">
                  <ShieldAlert className="h-4 w-4 text-rose-500 print:hidden" />
                  3. Recoveries & Deductions (৳)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Salary Advance Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={salaryAdvanceRecovery} 
                      onChange={e => setSalaryAdvanceRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{salaryAdvanceRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Loan Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={loanRecovery} 
                      onChange={e => setLoanRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{loanRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Notice Pay Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={noticePayRecovery} 
                      onChange={e => setNoticePayRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{noticePayRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Asset Recovery</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={assetRecovery} 
                      onChange={e => setAssetRecovery(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{assetRecovery.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Tax Adjustment</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={taxAdjustment} 
                      onChange={e => setTaxAdjustment(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{taxAdjustment.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase">Other Company Dues</Label>
                    <Input 
                      disabled={isReadOnly}
                      type="number" 
                      value={otherCompanyDues} 
                      onChange={e => setOtherCompanyDues(Number(e.target.value))} 
                      className="h-8 text-xs print:hidden" 
                    />
                    <p className="hidden print:block font-semibold text-xs border border-border/20 p-2 rounded bg-muted/5">৳{otherCompanyDues.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-rose-500/20 text-rose-700 font-bold text-sm print:text-foreground">
                  <span>Total Recoveries</span>
                  <span>৳{totalRecoveries.toLocaleString()}</span>
                </div>
              </div>

              {/* Net payout summary */}
              <div className="p-4 border border-border bg-muted/30 rounded-2xl space-y-4 print:bg-transparent print:p-0 print:border-none">
                <div className="flex justify-between items-center text-sm font-extrabold text-foreground border-b border-border/10 pb-2">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4.5 w-4.5 text-primary print:hidden" />
                    Net Settlement Payable
                  </span>
                  <span className="text-lg text-primary print:text-foreground font-black">৳{netSettlementAmount.toLocaleString()}</span>
                </div>

                {settlement.status === "Approved" && (
                  <div className="space-y-2 pt-2 border-t border-border/40 print:hidden">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Payment Details (Reference/Method)</Label>
                    <Input 
                      placeholder="e.g. Bank Transfer Ref TXN-12345" 
                      value={paymentDetails} 
                      onChange={e => setPaymentDetails(e.target.value)} 
                      className="h-8 text-xs" 
                    />
                  </div>
                )}

                {settlement.status === "Paid" && settlement.paymentDetails && (
                  <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[11px] text-emerald-800 print:bg-transparent print:border-none print:p-0">
                    <strong>Payment Reference:</strong> {settlement.paymentDetails}
                  </div>
                )}

                {/* Print layout signature footer */}
                <div className="hidden print:flex justify-between pt-14 text-[9px] font-bold">
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>Exiting Employee</p>
                  </div>
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>HR Specialist</p>
                  </div>
                  <div className="text-center w-36 border-t border-border pt-1">
                    <p>Managing Director</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 print:hidden">
                  {settlement.status === "Draft" && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSave} 
                        disabled={saveMutation.isPending}
                        className="text-xs h-8"
                      >
                        {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Save Draft
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          saveMutation.mutate({
                            separationId,
                            payload: {
                              separationType,
                              payableDays,
                              encashableAlDays,
                              pfInterest,
                              medicalReimbursement,
                              wellnessAllowance,
                              otherReimbursements,
                              salaryAdvanceRecovery,
                              loanRecovery,
                              noticePayRecovery,
                              assetRecovery,
                              taxAdjustment,
                              otherCompanyDues,
                            }
                          }, {
                            onSuccess: () => {
                              handleUpdateStatus("Approved")
                            }
                          })
                        }} 
                        disabled={statusMutation.isPending || saveMutation.isPending}
                        className="text-xs h-8 bg-amber-600 hover:bg-amber-700"
                      >
                        {statusMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Approve & Lock
                      </Button>
                    </>
                  )}

                  {settlement.status === "Approved" && (
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus("Paid")}
                      disabled={statusMutation.isPending || !paymentDetails.trim()}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {statusMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      Mark as Paid
                    </Button>
                  )}

                  {/* Print Button */}
                  <Button 
                    size="sm" 
                    className="gap-2 text-xs h-8 bg-sky-600 hover:bg-sky-700" 
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4" />
                    Print F&F
                  </Button>

                  <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">Close</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
