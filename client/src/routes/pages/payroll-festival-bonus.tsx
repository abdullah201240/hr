import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Coins,
  CalendarHeart,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  CreditCard,
  Percent,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import {
  useFestivalCyclesQuery,
  useFestivalCycleDetailsQuery,
  useCreateFestivalCycleMutation,
  useRecalculateFestivalCycleMutation,
  useUpdateFestivalPayoutMutation,
  useApproveFestivalCycleMutation,
  useDisburseFestivalCycleMutation,
  useDeleteFestivalCycleMutation,
  useFestivalBonusSettingsQuery,
} from "@/hooks/useFestivalBonus"
import { toast } from "sonner"

const FORMULA_LABELS: Record<string, string> = {
  one_month_basic: "One Month Basic",
  pro_rata_service_months: "Pro-rata Service",
  earned_festival_bonus: "Earned Bonus",
}

export default function PayrollFestivalBonusPage() {
  const { data: cycles = [], isLoading: isCyclesLoading } = useFestivalCyclesQuery()
  const { data: fbSettings } = useFestivalBonusSettingsQuery()

  const [selectedCycleId, setSelectedCycleId] = useState<string>("")
  const { data: cycleDetails, isLoading: isDetailsLoading } = useFestivalCycleDetailsQuery(selectedCycleId)

  // Mutations
  const createCycleMutation = useCreateFestivalCycleMutation()
  const recalculateCycleMutation = useRecalculateFestivalCycleMutation()
  const updatePayoutMutation = useUpdateFestivalPayoutMutation()
  const approveCycleMutation = useApproveFestivalCycleMutation()
  const disburseCycleMutation = useDisburseFestivalCycleMutation()
  const deleteCycleMutation = useDeleteFestivalCycleMutation()

  // Modal / Dialog local states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  // Form states
  const [newCycleName, setNewCycleName] = useState("")
  const [newCycleDate, setNewCycleDate] = useState("")

  const [disburseMethod, setDisburseMethod] = useState("Bank Transfer")
  const [disburseRef, setDisburseRef] = useState("")
  const [disburseDate, setDisburseDate] = useState(() => new Date().toISOString().split("T")[0])

  const [editingPayout, setEditingPayout] = useState<any>(null)
  const [overrideValue, setOverrideValue] = useState("")

  const activeCycle = cycleDetails?.cycle
  const payouts = cycleDetails?.payouts || []

  // Derived stats
  const eligiblePayouts = useMemo(() => payouts.filter((p) => p.isEligible), [payouts])
  const totalCalculatingBudget = useMemo(() => {
    return eligiblePayouts.reduce((sum, p) => sum + (p.overrideAmount !== null ? p.overrideAmount : p.calculatedAmount), 0)
  }, [eligiblePayouts])

  const handleSelectCycle = (id: string) => {
    setSelectedCycleId(id)
  }

  const handleCreateCycle = () => {
    if (!newCycleName.trim() || !newCycleDate) {
      toast.error("Please fill in all cycle details.")
      return
    }

    createCycleMutation.mutate(
      {
        name: newCycleName,
        festivalDate: new Date(newCycleDate).toISOString(),
      },
      {
        onSuccess: (data: any) => {
          toast.success("Festival cycle created and calculated successfully.")
          setIsCreateOpen(false)
          setNewCycleName("")
          setNewCycleDate("")
          if (data?.cycle?.id) {
            setSelectedCycleId(data.cycle.id)
          }
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create cycle.")
        },
      }
    )
  }

  const handleRecalculate = () => {
    if (!selectedCycleId) return
    Swal.fire({
      title: "Recalculate Register?",
      text: "This will clear any overrides or settings changes and recalculate all employee payouts based on current employee directory data and rules settings.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Recalculate",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((res) => {
      if (res.isConfirmed) {
        recalculateCycleMutation.mutate(selectedCycleId, {
          onSuccess: () => {
            toast.success("Festival payouts recalculated successfully.")
          },
          onError: (err) => {
            toast.error(err.message || "Failed to recalculate.")
          },
        })
      }
    })
  }

  const handleDelete = () => {
    if (!selectedCycleId) return
    Swal.fire({
      title: "Delete Cycle?",
      text: "Are you sure you want to permanently delete this draft festival cycle?",
      icon: "error",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((res) => {
      if (res.isConfirmed) {
        deleteCycleMutation.mutate(selectedCycleId, {
          onSuccess: () => {
            toast.success("Cycle deleted successfully.")
            setSelectedCycleId("")
          },
          onError: (err) => {
            toast.error(err.message || "Failed to delete cycle.")
          },
        })
      }
    })
  }

  const handleApprove = () => {
    if (!selectedCycleId) return
    Swal.fire({
      title: "Approve Register?",
      text: "Are you sure you want to lock the calculations and approve this festival bonus register?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((res) => {
      if (res.isConfirmed) {
        approveCycleMutation.mutate(selectedCycleId, {
          onSuccess: () => {
            toast.success("Festival register approved.")
          },
          onError: (err) => {
            toast.error(err.message || "Failed to approve.")
          },
        })
      }
    })
  }

  const handleDisburse = () => {
    if (!selectedCycleId || !disburseRef.trim()) {
      toast.error("Please provide transaction reference.")
      return
    }
    disburseCycleMutation.mutate(
      {
        id: selectedCycleId,
        paymentMethod: disburseMethod,
        paymentRef: disburseRef,
        disbursementDate: new Date(disburseDate).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("Festival payouts successfully disbursed.")
          setIsDisburseOpen(false)
          setDisburseRef("")
        },
        onError: (err) => {
          toast.error(err.message || "Failed to disburse.")
        },
      }
    )
  }

  const toggleSpecialApproval = (payoutId: string, currentVal: boolean) => {
    updatePayoutMutation.mutate({
      payoutId,
      specialApprovalGranted: !currentVal,
    }, {
      onError: (err) => {
        toast.error(err.message || "Failed to toggle special approval.")
      },
    })
  }

  const openOverrideDialog = (payout: any) => {
    setEditingPayout(payout)
    setOverrideValue(payout.overrideAmount !== null ? String(payout.overrideAmount) : "")
    setIsOverrideOpen(true)
  }

  const saveOverrideAmount = () => {
    if (!editingPayout) return
    const parsed = overrideValue === "" ? null : Number(overrideValue)
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      toast.error("Invalid amount.")
      return
    }

    updatePayoutMutation.mutate({
      payoutId: editingPayout.id,
      overrideAmount: parsed,
    }, {
      onSuccess: () => {
        toast.success("Manual override saved.")
        setIsOverrideOpen(false)
        setEditingPayout(null)
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save override.")
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Title ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Festival Bonus Processing</h2>
          <p className="text-xs text-muted-foreground">Automated festival bonus calculations, overrides, and payouts</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 text-xs h-9 shrink-0">
          <Plus className="h-4 w-4" /> Add Bonus Cycle
        </Button>
      </div>

      {/* ─── Main Content Layout ─── */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left Side: Cycles History Panel */}
        <Card className="lg:col-span-1 shadow-none border border-border/40 max-h-[700px] overflow-y-auto">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <CalendarHeart className="h-4 w-4 text-primary" /> Cycles History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 space-y-1">
            {isCyclesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : cycles.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">No bonus cycles found.</div>
            ) : (
              cycles.map((cy) => (
                <button
                  key={cy.id}
                  onClick={() => handleSelectCycle(cy.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg text-xs transition-colors flex flex-col gap-1 border border-transparent",
                    selectedCycleId === cy.id
                      ? "bg-primary/5 border-primary/20 text-foreground font-semibold"
                      : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate max-w-[130px]">{cy.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 py-0 border-none font-bold",
                        cy.status === "Disbursed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500",
                        cy.status === "Approved" && "bg-blue-500/10 text-blue-600 dark:text-blue-500",
                        cy.status === "Draft" && "bg-amber-500/10 text-amber-600 dark:text-amber-500"
                      )}
                    >
                      {cy.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] opacity-70">
                    {new Date(cy.festivalDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  {cy.status === "Disbursed" ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-1">৳{cy.totalAmount.toLocaleString()} ({cy.totalEmployees} paid)</span>
                  ) : (
                    <span className="text-[10px] mt-1">৳{cy.totalAmount.toLocaleString()} estimated</span>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right Side: Cycle Details & Payout Grid */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedCycleId ? (
            <Card className="shadow-none border border-border/40 py-20 flex flex-col items-center justify-center text-center">
              <Coins className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold">No Bonus Cycle Selected</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">Select a cycle from the history panel or create a new one to process and review employee festival payouts.</p>
            </Card>
          ) : isDetailsLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground mt-2">Loading payouts details...</span>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border/30 bg-muted/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Register Budget</span>
                  <p className="text-2xl font-bold tracking-tight text-primary mt-1">৳{totalCalculatingBudget.toLocaleString()}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{activeCycle?.status === "Disbursed" ? "Disbursed payroll total" : "Estimated payout total"}</p>
                </div>
                <div className="p-4 rounded-xl border border-border/30 bg-muted/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Eligible Employees</span>
                  <p className="text-2xl font-bold tracking-tight mt-1">{eligiblePayouts.length}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Headcount qualifying by rules</p>
                </div>
                <div className="p-4 rounded-xl border border-border/30 bg-muted/10 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Formula</span>
                    <Badge variant="secondary" className="text-[9px] font-bold ml-2">
                      {fbSettings ? FORMULA_LABELS[fbSettings.amountFormula] : "Default"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Eligibility period: {fbSettings?.minServiceMonths} months min tenure
                  </p>
                </div>
              </div>

              {/* Payout Details Grid */}
              <Card className="shadow-none border border-border/40">
                <CardHeader className="py-4 border-b border-border/40 flex flex-row items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1">
                      {activeCycle?.name} Details
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Created: {new Date(activeCycle?.createdAt || "").toLocaleString()}
                    </CardDescription>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    {activeCycle?.status === "Draft" && (
                      <>
                        <Button onClick={handleRecalculate} variant="outline" size="sm" className="gap-1.5 h-8 text-[11px] hover:border-amber-500/40 hover:text-amber-600 hover:bg-amber-500/5">
                          <RefreshCw className="h-3 w-3" /> Recalculate
                        </Button>
                        <Button onClick={handleApprove} variant="outline" size="sm" className="gap-1.5 h-8 text-[11px] border-emerald-600/30 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/5">
                          <CheckCircle className="h-3 w-3" /> Approve register
                        </Button>
                        <Button onClick={handleDelete} variant="ghost" size="sm" className="gap-1.5 h-8 text-[11px] text-rose-500 hover:text-rose-600 hover:bg-rose-500/5">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      </>
                    )}

                    {activeCycle?.status === "Approved" && (
                      <>
                        <Button onClick={() => setIsDisburseOpen(true)} className="gap-1.5 h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm">
                          <CreditCard className="h-3 w-3" /> Disburse Register
                        </Button>
                      </>
                    )}

                    {activeCycle?.status === "Disbursed" && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs py-1 px-3">
                        ✓ Disbursed & Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="p-3">Employee</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Join Date</th>
                        <th className="p-3">Tenure</th>
                        <th className="p-3">Basic</th>
                        <th className="p-3">Calculated</th>
                        <th className="p-3">Override</th>
                        <th className="p-3">Final</th>
                        <th className="p-3 text-center">Eligibility</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((pay) => {
                        const hasOverride = pay.overrideAmount !== null
                        const finalVal = pay.overrideAmount ?? pay.calculatedAmount;
                        return (
                          <tr key={pay.id} className={cn("border-b border-border/20 hover:bg-muted/10 transition-colors", !pay.isEligible && "opacity-60")}>
                            <td className="p-3">
                              <div className="font-semibold text-foreground">{pay.employeeName}</div>
                              <div className="text-[10px] text-muted-foreground">{pay.employeeCode}</div>
                            </td>
                            <td className="p-3">{pay.employeeType}</td>
                            <td className="p-3">{new Date(pay.joinDate).toLocaleDateString()}</td>
                            <td className="p-3 font-medium">{pay.serviceMonths} mo</td>
                            <td className="p-3 text-muted-foreground">৳{pay.basicSalary.toLocaleString()}</td>
                            <td className="p-3 font-semibold">৳{pay.calculatedAmount.toLocaleString()}</td>
                            <td className="p-3">
                              {hasOverride && pay.overrideAmount !== null ? (
                                <Badge variant="outline" className="border-amber-500/20 text-amber-600 bg-amber-500/5 font-semibold text-[10px]">
                                  ৳{pay.overrideAmount.toLocaleString()}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                            <td className="p-3 font-bold text-primary">৳{finalVal.toLocaleString()}</td>
                            <td className="p-3 text-center">
                              {pay.isEligible ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold">
                                  Eligible
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-bold">
                                  Ineligible
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {activeCycle?.status === "Draft" ? (
                                <div className="flex gap-2 justify-end items-center">
                                  {/* Special Approval clause switch if ineligible and allowed */}
                                  {fbSettings?.allowSpecialApproval && !pay.isEligible && (
                                    <div className="flex items-center gap-1.5 mr-1" title="Grant manual special approval exception">
                                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Special:</span>
                                      <Switch
                                        checked={pay.specialApprovalGranted}
                                        onCheckedChange={() => toggleSpecialApproval(pay.id, pay.specialApprovalGranted)}
                                        className="scale-75"
                                      />
                                    </div>
                                  )}
                                  {pay.isEligible && (
                                    <Button onClick={() => openOverrideDialog(pay)} variant="outline" size="sm" className="h-7 text-[10px] px-2 gap-1 border-border/80">
                                      Adjust
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">{pay.status}</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ─── Create Cycle Dialog ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <CalendarHeart className="h-5 w-5 text-primary" /> Process Festival Bonus
              </CardTitle>
              <CardDescription className="text-xs">Create a bonus register cycle and query eligible payouts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="c-name" className="text-xs font-semibold">Bonus Description / Event</Label>
                <Input
                  id="c-name"
                  placeholder="e.g. Eid-ul-Adha 2026, Christmas 2026"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-date" className="text-xs font-semibold">Festival Date</Label>
                <Input
                  id="c-date"
                  type="date"
                  value={newCycleDate}
                  onChange={(e) => setNewCycleDate(e.target.value)}
                  className="text-xs h-9"
                />
                <p className="text-[9px] text-muted-foreground">Festival date represents the cutoff for tenure calculation.</p>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/40 flex justify-end gap-2 bg-muted/10 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleCreateCycle} disabled={createCycleMutation.isPending} size="sm" className="text-xs h-8">
                {createCycleMutation.isPending ? "Generating..." : "Generate Register"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Disburse Register Dialog ─── */}
      {isDisburseOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-500" /> Disburse Festival Bonuses
              </CardTitle>
              <CardDescription className="text-xs">Provide details to log bonus payment distributions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Distribution Method</Label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  className="w-full bg-background border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
                >
                  <option value="Bank Transfer">Bank Transfer (EFT/Wire)</option>
                  <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
                  <option value="Cash Payment">Cash Payment</option>
                  <option value="Corporate Cheque">Corporate Cheque</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-ref" className="text-xs font-semibold">Payment Voucher / Transaction Ref</Label>
                <Input
                  id="d-ref"
                  placeholder="e.g. TXN-FB-2026-9024"
                  value={disburseRef}
                  onChange={(e) => setDisburseRef(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-date" className="text-xs font-semibold">Disbursement Date</Label>
                <Input
                  id="d-date"
                  type="date"
                  value={disburseDate}
                  onChange={(e) => setDisburseDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/40 flex justify-end gap-2 bg-muted/10 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setIsDisburseOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleDisburse} disabled={disburseCycleMutation.isPending} size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                {disburseCycleMutation.isPending ? "Disbursing..." : "Disburse Register"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Manual Override Payout Dialog ─── */}
      {isOverrideOpen && editingPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Percent className="h-5 w-5 text-amber-500" /> Payout Adjustment
              </CardTitle>
              <CardDescription className="text-xs">Adjust payout override for {editingPayout.employeeName}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-2 text-xs">
              <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-md border border-border/30">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Base Calculated</span>
                  <p className="font-semibold text-sm">৳{editingPayout.calculatedAmount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Employee basic</span>
                  <p className="font-medium text-xs">৳{editingPayout.basicSalary.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="o-amount" className="text-xs font-semibold">Override Amount (৳)</Label>
                <Input
                  id="o-amount"
                  type="number"
                  placeholder="Leave blank to use calculated formula value"
                  value={overrideValue}
                  onChange={(e) => setOverrideValue(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/40 flex justify-end gap-2 bg-muted/10 rounded-b-xl">
              <Button variant="outline" size="sm" onClick={() => setIsOverrideOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={saveOverrideAmount} disabled={updatePayoutMutation.isPending} size="sm" className="text-xs h-8 bg-amber-500 hover:bg-amber-600 border-none text-white font-semibold">
                Save Adjustment
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
