import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Loader2, MessageSquare } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  useFestivalCyclesQuery,
  useFestivalCycleDetailsQuery,
  useApproveFestivalPayoutMdMutation,
  useRejectFestivalPayoutMdMutation,
  useBulkApproveFestivalMdMutation,
} from "@/hooks/useFestivalBonus"
import Swal from "sweetalert2"
import { toast } from "sonner"
import { PayoutCommentsDialog } from "./PayoutCommentsDialog"

interface MdFestivalBonusApprovalsTabProps {
  formatCurrency: (amount: number) => string
}

export function MdFestivalBonusApprovalsTab({
  formatCurrency,
}: MdFestivalBonusApprovalsTabProps) {
  const { hasPermission } = usePermissions()

  const { data: cycles = [], isLoading: isCyclesLoading } = useFestivalCyclesQuery()

  // Find active cycles awaiting MD approval
  const mdAwaitingCycles = useMemo(() => {
    return cycles.filter((cy) => cy.status === "Awaiting_MD_Approval")
  }, [cycles])

  const [selectedCycleId, setSelectedCycleId] = useState<string>("")

  // Auto-select first cycle if none selected
  const activeCycleId = selectedCycleId || mdAwaitingCycles[0]?.id || ""

  const { data: cycleDetails, isLoading: isDetailsLoading } = useFestivalCycleDetailsQuery(activeCycleId)

  const approvePayoutMutation = useApproveFestivalPayoutMdMutation()
  const rejectPayoutMutation = useRejectFestivalPayoutMdMutation()
  const bulkApproveMutation = useBulkApproveFestivalMdMutation()

  const payouts = cycleDetails?.payouts || []

  // Filter payouts that are in Awaiting_MD_Approval status
  const eligiblePayouts = useMemo(() => {
    return payouts.filter((p) => p.status === "Awaiting_MD_Approval")
  }, [payouts])

  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [activePayoutForComments, setActivePayoutForComments] = useState<any>(null)

  const openCommentsDialog = (payout: any) => {
    setActivePayoutForComments(payout)
    setIsCommentsOpen(true)
  }

  const handleApprove = (payout: any) => {
    Swal.fire({
      title: "Approve Bonus Payout?",
      text: `Are you sure you want to finalize the payout of ${formatCurrency(payout.finalAmount)} for ${payout.employeeName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        approvePayoutMutation.mutate(
          { payoutId: payout.id, cycleId: activeCycleId },
          {
            onSuccess: () => {
              toast.success(`Approved payout for ${payout.employeeName}`)
            },
            onError: (err) => {
              toast.error(err.message || "Failed to approve payout")
            },
          }
        )
      }
    })
  }

  const handleReject = (payout: any) => {
    Swal.fire({
      title: "Reject Bonus Payout?",
      text: `Enter the rejection reason/comment for ${payout.employeeName}:`,
      icon: "warning",
      input: "text",
      inputPlaceholder: "Enter rejection reason...",
      showCancelButton: true,
      confirmButtonText: "Reject",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "You must enter a reason for rejection!"
        }
        return null
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        rejectPayoutMutation.mutate(
          { payoutId: payout.id, cycleId: activeCycleId, comment: result.value.trim() },
          {
            onSuccess: () => {
              toast.success(`Rejected payout for ${payout.employeeName}`)
            },
            onError: (err) => {
              toast.error(err.message || "Failed to reject payout")
            },
          }
        )
      }
    })
  }

  const handleBulkApprove = () => {
    if (!activeCycleId) return
    Swal.fire({
      title: "Bulk Approve MD Queue?",
      text: `Are you sure you want to approve the entire festival cycle register? This will send it to accounts for disbursement.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Approve All",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        bulkApproveMutation.mutate(activeCycleId, {
          onSuccess: () => {
            Swal.fire("Bulk Approved!", "Entire cycle register has been approved.", "success")
          },
          onError: (err) => {
            toast.error(err.message || "Bulk approval failed")
          },
        })
      }
    })
  }

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            Festival Bonus MD Approvals Queue
          </CardTitle>
          <CardDescription className="text-xs">
            Final review and MD sign-off on computed festival bonus sheets.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {eligiblePayouts.length > 0 && hasPermission("payroll:approve_md") && (
            <Button
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Bulk Approve All (MD)
            </Button>
          )}

          {mdAwaitingCycles.length > 0 && (
            <select
              value={activeCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
            >
              {mdAwaitingCycles.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
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
            <span className="text-xs text-muted-foreground">Loading MD approvals...</span>
          </div>
        ) : eligiblePayouts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            No pending payouts require Managing Director approval for this cycle.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Type</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Join Date</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Tenure</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Basic / Gross</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Bonus Amount</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground text-right w-36">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eligiblePayouts.map((pay) => (
                <TableRow key={pay.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                  <TableCell className="py-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{pay.employeeName}</p>
                      <p className="text-[10px] text-muted-foreground">{pay.employeeCode}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-xs">{pay.employeeType}</TableCell>
                  <TableCell className="py-3 text-xs">{new Date(pay.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell className="py-3 text-xs font-medium">{pay.serviceMonths} mo</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground">
                    {formatCurrency(pay.basicSalary)} / {formatCurrency(pay.grossSalary)}
                  </TableCell>
                  <TableCell className="py-3 text-xs font-bold text-foreground">
                    {formatCurrency(pay.finalAmount)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-[9px] font-bold py-0.5 px-2 bg-indigo-500/10 text-indigo-600 border-indigo-500/20 animate-pulse">
                      Awaiting MD Approval
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    {hasPermission("payroll:approve_md") && (
                      <div className="flex items-center justify-end gap-1.5 mr-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 rounded-md px-2"
                          onClick={() => handleApprove(pay)}
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-semibold bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:text-rose-700 rounded-md px-2"
                          onClick={() => handleReject(pay)}
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => openCommentsDialog(pay)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary relative rounded-md border border-border/40 hover:bg-muted/10"
                          title="View collaboration notes"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {pay.comments && pay.comments.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                              {pay.comments.length}
                            </span>
                          )}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {/* ─── Comments Dialog ─── */}
      <PayoutCommentsDialog
        isOpen={isCommentsOpen}
        onClose={() => {
          setIsCommentsOpen(false)
          setActivePayoutForComments(null)
        }}
        payout={
          activePayoutForComments
            ? payouts.find((p) => p.id === activePayoutForComments.id) || activePayoutForComments
            : null
        }
        cycleId={activeCycleId}
      />
    </Card>
  )
}
