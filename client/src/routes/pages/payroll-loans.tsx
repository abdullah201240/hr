import { useState } from "react"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { usePermissions } from "@/hooks/usePermissions"
import { useAuthStore } from "@/store/useAuthStore"
import {
  useLoansQuery,
  useLoanDetailsQuery,
  useApplyLoanMutation,
  useProcessLoanMutation,
  useDisburseLoanMutation,
  useRecordLoanPaymentMutation,
} from "@/hooks/useLoans"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  TrendingUp,
  Banknote,
} from "lucide-react"

export default function PayrollLoansPage() {
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermissions()
  const isAdmin = hasAnyPermission(["salary:read", "payroll:read", "salary:view_all"])

  const [activeTab, setActiveTab] = useState(isAdmin ? "requests" : "my-loans")
  const [searchQuery, setSearchQuery] = useState("")
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState("")

  // Loan Request Form States
  const [loanAmount, setLoanAmount] = useState("")
  const [loanTerm, setLoanTerm] = useState("")
  const [loanReason, setLoanReason] = useState("")

  // Manual Payment Form States
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer")
  const [paymentRemarks, setPaymentRemarks] = useState("")

  // API Queries
  const { data: loansList, isLoading: isLoansLoading } = useLoansQuery(isAdmin ? undefined : user?.id)
  const { data: selectedLoan, isLoading: isDetailsLoading } = useLoanDetailsQuery(selectedLoanId)

  // API Mutations
  const applyLoanMutation = useApplyLoanMutation()
  const processLoanMutation = useProcessLoanMutation()
  const disburseLoanMutation = useDisburseLoanMutation()
  const recordPaymentMutation = useRecordLoanPaymentMutation()

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  // Filter loans list based on search query
  const filteredLoans = loansList?.filter((loan) => {
    const q = searchQuery.toLowerCase()
    return (
      loan.fullName.toLowerCase().includes(q) ||
      loan.employeeDisplayId.toLowerCase().includes(q) ||
      loan.reason.toLowerCase().includes(q) ||
      loan.status.toLowerCase().includes(q)
    )
  }) || []

  // Submit loan application
  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loanAmount || Number(loanAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!loanTerm || Number(loanTerm) <= 0) {
      toast.error("Please enter a valid term")
      return
    }
    if (!loanReason.trim()) {
      toast.error("Please provide a reason/justification")
      return
    }

    applyLoanMutation.mutate({
      amount: Number(loanAmount),
      termMonths: Number(loanTerm),
      reason: loanReason,
    }, {
      onSuccess: () => {
        toast.success("Loan application submitted successfully!")
        setIsApplyOpen(false)
        setLoanAmount("")
        setLoanTerm("")
        setLoanReason("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to submit loan request")
      }
    })
  }

  // Approve/Reject loan request
  const handleProcessLoan = (id: string, status: "Approved" | "Rejected") => {
    Swal.fire({
      title: `${status === "Approved" ? "Approve" : "Reject"} Loan Request?`,
      text: `Provide review comments or remarks:`,
      input: "text",
      inputPlaceholder: "Enter remarks...",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: status === "Approved" ? "Approve" : "Reject",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: `swal2-confirm swal2-styled px-4 py-2 mr-2 font-semibold text-white rounded-md ${
          status === "Approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
        }`,
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        processLoanMutation.mutate({
          id,
          status,
          remarks: result.value || "",
        }, {
          onSuccess: () => {
            toast.success(`Loan marked as ${status.toLowerCase()}!`)
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to process request")
          }
        })
      }
    })
  }

  // Disburse loan funds
  const handleDisburseLoan = (id: string) => {
    Swal.fire({
      title: "Disburse Loan Funds?",
      text: "This marks the loan as disbursed and initiates the amortization ledger.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Disburse",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled px-4 py-2 mr-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        disburseLoanMutation.mutate({ id }, {
          onSuccess: () => {
            toast.success("Loan disbursed successfully!")
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to disburse loan")
          }
        })
      }
    })
  }

  // Record manual installment payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    recordPaymentMutation.mutate({
      loanId: selectedLoanId,
      amount: Number(paymentAmount),
      paymentMethod,
      remarks: paymentRemarks,
    }, {
      onSuccess: (data) => {
        toast.success(`Payment recorded! Remaining balance: ${formatCurrency(data.remainingBalance)}`)
        setIsPaymentOpen(false)
        setPaymentAmount("")
        setPaymentRemarks("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to record payment")
      }
    })
  }

  // Open Details Modal
  const openDetails = (id: string) => {
    setSelectedLoanId(id)
    setIsDetailsOpen(true)
  }

  // Stats calculation
  const totalLoanedOut = loansList?.filter(l => l.status === "Disbursed" || l.status === "Repaid").reduce((sum, l) => sum + l.amount, 0) || 0
  const totalRemainingDebt = loansList?.filter(l => l.status === "Disbursed").reduce((sum, l) => sum + l.remainingBalance, 0) || 0
  const pendingRequestsCount = loansList?.filter(l => l.status === "Pending").length || 0

  const activeLoan = loansList?.find(l => l.status === "Disbursed")

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Loans & Salary Advances</h2>
          <p className="text-muted-foreground text-sm">Submit, approve, and track employee loan requests and repayment ledgers.</p>
        </div>
        {!isAdmin && (
          <Button size="sm" className="gap-2 text-xs" onClick={() => setIsApplyOpen(true)}>
            <Plus className="h-4 w-4" />
            Apply for Loan / Advance
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isAdmin ? (
          <>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Disbursed Principal</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{formatCurrency(totalLoanedOut)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Cumulative corporate capital lent out</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding Debt Pool</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalRemainingDebt)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Remaining uncollected balance</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Approval Requests</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">{pendingRequestsCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting manager/HR review</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Remaining Balance</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {activeLoan ? formatCurrency(activeLoan.remainingBalance) : formatCurrency(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total outstanding loan debt</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Installment (EMI)</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {activeLoan ? formatCurrency(activeLoan.monthlyInstallment) : formatCurrency(0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Deducted from salary monthly</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-none border-border/40">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Repayment Term</p>
                  <p className="text-2xl font-bold mt-1">
                    {activeLoan ? `${activeLoan.termMonths} months` : "0 months"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Repayment amortization term</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/5 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[350px] shadow-none border border-border/40">
          {isAdmin ? (
            <>
              <TabsTrigger value="requests" className="text-xs">Loan Requests</TabsTrigger>
              <TabsTrigger value="active" className="text-xs">Disbursed Loans</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="my-loans" className="text-xs">My Loan Log</TabsTrigger>
              <TabsTrigger value="faq" className="text-xs">Repayment Rules</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={isAdmin ? "requests" : "my-loans"} className="m-0 space-y-6">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold">Loans & Advances Ledger</CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin ? "Review, approve, and disburse corporate loans and advanced salaries." : "Your complete log of requested loans, approvals, and repayment progression."}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search ledger..."
                  className="pl-9 text-xs h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoansLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Date Requested</TableHead>
                      {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>}
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Loan Principal</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Term</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">EMI (Installment)</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.filter(l => isAdmin ? l.status === "Pending" || l.status === "Approved" || l.status === "Rejected" : true).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-12 text-muted-foreground text-xs">
                          No pending requests registered.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoans.filter(l => isAdmin ? l.status === "Pending" || l.status === "Approved" || l.status === "Rejected" : true).map((loan) => (
                        <tr key={loan.id} className="border-b border-border/20 hover:bg-muted/10">
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">
                            {new Date(loan.createdAt).toLocaleDateString()}
                          </td>
                          {isAdmin && (
                            <td className="p-3 font-semibold">
                              {loan.fullName} ({loan.employeeDisplayId})
                            </td>
                          )}
                          <td className="p-3 text-right font-bold text-foreground">{formatCurrency(loan.amount)}</td>
                          <td className="p-3 text-right font-medium text-muted-foreground">{loan.termMonths} months</td>
                          <td className="p-3 text-right font-medium text-muted-foreground">{formatCurrency(loan.monthlyInstallment)}</td>
                          <td className="p-3 text-right font-semibold text-foreground">{formatCurrency(loan.remainingBalance)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                              loan.status === "Disbursed" ? "bg-blue-500/5 text-blue-600 border border-blue-500/10" :
                              loan.status === "Approved" ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/10" :
                              loan.status === "Repaid" ? "bg-teal-500/5 text-teal-600 border border-teal-500/10" :
                              loan.status === "Rejected" ? "bg-rose-500/5 text-rose-600 border border-rose-500/10" :
                              "bg-amber-500/5 text-amber-600 border border-amber-500/10"
                            }`}>
                              {loan.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                              {loan.status === "Repaid" && <CheckCircle2 className="h-3 w-3" />}
                              {loan.status === "Rejected" && <XCircle className="h-3 w-3" />}
                              {loan.status === "Pending" && <Clock className="h-3 w-3" />}
                              {loan.status === "Disbursed" && <TrendingUp className="h-3 w-3" />}
                              {loan.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 text-[10px] cursor-pointer"
                                onClick={() => openDetails(loan.id)}
                              >
                                Ledger
                              </Button>
                              {isAdmin && loan.status === "Pending" && (
                                <>
                                  <Button
                                    size="xs"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] cursor-pointer"
                                    onClick={() => handleProcessLoan(loan.id, "Approved")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="border-rose-500 text-rose-600 hover:bg-rose-500/10 h-7 text-[10px] cursor-pointer"
                                    onClick={() => handleProcessLoan(loan.id, "Rejected")}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {isAdmin && loan.status === "Approved" && (
                                <Button
                                  size="xs"
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-[10px] cursor-pointer"
                                  onClick={() => handleDisburseLoan(loan.id)}
                                >
                                  Disburse Funds
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADMIN ONLY: active list --- */}
        {isAdmin && (
          <TabsContent value="active" className="m-0">
            <Card className="shadow-none border-border/40">
              <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-bold">Active Repayment Accounts</CardTitle>
                  <CardDescription className="text-xs">
                    List of all active disbursed corporate loan ledgers with outstanding balances.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search active..."
                    className="pl-9 text-xs h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Date Disbursed</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Original Principal</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Repayment Term</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Monthly Installment</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Unpaid Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.filter(l => l.status === "Disbursed" || l.status === "Repaid").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                          No active disbursed accounts.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLoans.filter(l => l.status === "Disbursed" || l.status === "Repaid").map((loan) => (
                        <tr key={loan.id} className="border-b border-border/20 hover:bg-muted/10">
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">
                            {loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3 font-semibold">
                            {loan.fullName} ({loan.employeeDisplayId})
                          </td>
                          <td className="p-3 text-right font-bold text-foreground">{formatCurrency(loan.amount)}</td>
                          <td className="p-3 text-right font-medium text-muted-foreground">{loan.termMonths} months</td>
                          <td className="p-3 text-right font-medium text-muted-foreground">{formatCurrency(loan.monthlyInstallment)}</td>
                          <td className="p-3 text-right font-semibold text-foreground">{formatCurrency(loan.remainingBalance)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 ${
                              loan.status === "Repaid" ? "bg-teal-500/5 text-teal-600 border border-teal-500/10" :
                              "bg-blue-500/5 text-blue-600 border border-blue-500/10"
                            }`}>
                              {loan.status === "Repaid" && <CheckCircle2 className="h-3 w-3" />}
                              {loan.status === "Disbursed" && <TrendingUp className="h-3 w-3" />}
                              {loan.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-7 text-[10px] cursor-pointer"
                                onClick={() => openDetails(loan.id)}
                              >
                                Ledger
                              </Button>
                              {loan.status === "Disbursed" && (
                                <Button
                                  size="xs"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[10px] cursor-pointer"
                                  onClick={() => {
                                    setSelectedLoanId(loan.id)
                                    setIsPaymentOpen(true)
                                  }}
                                >
                                  Collect Payment
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* --- FAQ/RULES TAB --- */}
        {!isAdmin && (
          <TabsContent value="faq" className="m-0">
            <Card className="shadow-none border-border/40 p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold border-b pb-2">Employee Loan & Advance Guidelines</h3>
                <p className="text-muted-foreground mt-1">Make sure you understand the following guidelines before applying for advances:</p>
              </div>
              <div className="space-y-3 bg-muted/10 p-4 border border-border/40 rounded-lg">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Maximum Limit:</strong> The maximum loan value you can request is 3 times your basic monthly salary.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Deduction:</strong> Loan installments (EMI) will be directly subtracted under "Loan Installment" in your payslip once disbursed.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Repayment Term:</strong> Advances must be repaid within a maximum period of 24 months.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Resignation:</strong> In case of separation, any outstanding loan balance will be recovered from your final settlement.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* --- Apply Loan Request Dialog --- */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-[420px] text-xs">
          <form onSubmit={handleApplyLoan}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Apply for Loan / Advance</DialogTitle>
              <DialogDescription className="text-[10px]">
                Submit a request for an interest-free salary advance or corporate loan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Requested Amount (BDT)</label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  className="text-xs h-9"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Repayment Period (Months)</label>
                <Input
                  type="number"
                  placeholder="Repayment term (e.g. 12)"
                  className="text-xs h-9"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(e.target.value)}
                  min="1"
                  max="24"
                />
                {loanAmount && loanTerm && (
                  <p className="text-[10px] text-muted-foreground italic mt-0.5">
                    Estimated monthly EMI: <strong>{formatCurrency(Math.round(Number(loanAmount) / Number(loanTerm)))}</strong> / month
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Justification / Purpose</label>
                <Textarea
                  placeholder="Provide an explanation for this advance request..."
                  className="text-xs resize-none h-24"
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={applyLoanMutation.isPending}>
                {applyLoanMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Submitting...
                  </>
                ) : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Loan Ledger Details Dialog --- */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[550px] text-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Loan Repayment Ledger</DialogTitle>
            <DialogDescription className="text-[10px]">
              Detailed logs of loan repayments, payroll deductions, and outstanding principal.
            </DialogDescription>
          </DialogHeader>

          {isDetailsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedLoan ? (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 border border-border/40 rounded-lg">
                <div>
                  <p className="text-[10px] text-muted-foreground">Original Principal</p>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(selectedLoan.amount)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Term: {selectedLoan.termMonths} months</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Remaining Balance</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedLoan.remainingBalance)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Installment: {formatCurrency(selectedLoan.monthlyInstallment)} / mo</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Amortization & Repayment History</h4>
                <div className="max-h-[220px] overflow-y-auto border border-border/40 rounded-md">
                  <Table>
                    <TableHeader className="bg-muted/10 border-b border-border/30">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="text-[10px] font-semibold p-2">Date</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2 text-right">Repayment Amount</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2">Method</TableHead>
                        <TableHead className="text-[10px] font-semibold p-2">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedLoan.payments || selectedLoan.payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-[10px]">
                            No payments recorded yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedLoan.payments.map((p) => (
                          <TableRow key={p.id} className="text-[10px] border-b border-border/10 hover:bg-transparent">
                            <TableCell className="p-2 font-mono text-[9px] text-muted-foreground">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="p-2 text-right font-bold text-emerald-600">
                              {formatCurrency(p.amount)}
                            </TableCell>
                            <TableCell className="p-2 font-medium">{p.paymentMethod}</TableCell>
                            <TableCell className="p-2 text-muted-foreground italic">{p.remarks || "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">Failed to load loan record.</p>
          )}

          <DialogFooter className="mt-4">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Collect Manual Payment Dialog --- */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[400px] text-xs">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Collect Manual Payment</DialogTitle>
              <DialogDescription className="text-[10px]">
                Manually record a cash, bank transfer, or cheque payment against this employee's outstanding loan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Payment Amount (BDT)</label>
                <Input
                  type="number"
                  placeholder="Enter amount collected..."
                  className="text-xs h-9"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Payment Method</label>
                <select
                  className="w-full border border-input bg-background px-3 py-2 text-xs rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Remarks / Transaction Reference</label>
                <Textarea
                  placeholder="e.g. Received via Bank Asia cheque #1283..."
                  className="text-xs resize-none h-16"
                  value={paymentRemarks}
                  onChange={(e) => setPaymentRemarks(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={recordPaymentMutation.isPending}>
                {recordPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </>
                ) : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
