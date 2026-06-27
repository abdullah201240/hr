import { useState } from "react"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { usePermissions } from "@/hooks/usePermissions"
import { useAuthStore } from "@/store/useAuthStore"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { usePfBalancesQuery } from "@/hooks/usePayroll"
import { useEmployeeSalariesQuery } from "@/hooks/useSalary"
import {
  useProvidentFundSettingsQuery,
  usePfLedgerQuery,
  usePfWithdrawalsQuery,
  useApplyPfWithdrawalMutation,
  useProcessPfWithdrawalMutation,
} from "@/hooks/useProvidentFund"
import { ProvidentFundTab } from "@/components/payroll/ProvidentFundTab"
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
  TrendingUp,
  Coins,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Search,
} from "lucide-react"

export default function PayrollProvidentFundPage() {
  const { user } = useAuthStore()
  const { hasAnyPermission } = usePermissions()
  const isAdmin = hasAnyPermission(["salary:read", "payroll:read", "salary:view_all"])

  const [activeTab, setActiveTab] = useState(isAdmin ? "reserves" : "my-ledger")
  const [searchQuery, setSearchQuery] = useState("")
  const [isApplyOpen, setIsApplyOpen] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [withdrawalReason, setWithdrawalReason] = useState("")

  // API Queries
  const { data: pfSettings, isLoading: isPfLoading } = useProvidentFundSettingsQuery()
  const { data: pfBalances } = usePfBalancesQuery()
  const { data: employeesData } = useEmployeesQuery({ status: "active", limit: 100 })
  const { data: allSalariesData } = useEmployeeSalariesQuery({ limit: 1000, status: "active" })

  // New transactional queries
  const { data: ledgerData, isLoading: isLedgerLoading } = usePfLedgerQuery(isAdmin ? undefined : user?.id)
  const { data: withdrawalsData, isLoading: isWithdrawalsLoading } = usePfWithdrawalsQuery(isAdmin ? undefined : user?.id)

  const applyWithdrawalMutation = useApplyPfWithdrawalMutation()
  const processWithdrawalMutation = useProcessPfWithdrawalMutation()

  const empPfRate = pfSettings?.employeeContributionRate ?? 10
  const employerPfRate = pfSettings?.employerContributionRate ?? 10

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  // Calculate stats for reserves list (admin dashboard)
  const getEmployeePfStats = (empId: string) => {
    const salRecord = allSalariesData?.data?.find((s) => s.employeeId === empId)
    const basic = salRecord?.basicSalary ?? 50000

    const balanceRecord = pfBalances?.find((b: any) => b.employeeId === empId)
    const totalPfAccrued = balanceRecord ? Number(balanceRecord.totalPf) : 0
    const monthsContributed = balanceRecord ? Number(balanceRecord.monthsContributed) : 0

    const empContribution = Math.round(basic * (empPfRate / 100))
    const employerMatch = Math.round(basic * (employerPfRate / 100))
    
    return {
      basic,
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: totalPfAccrued,
      monthsActive: monthsContributed,
    }
  }

  // Handle employee applying for withdrawal
  const handleApplyWithdrawal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalAmount || Number(withdrawalAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!withdrawalReason.trim()) {
      toast.error("Please provide a reason for withdrawal")
      return
    }

    applyWithdrawalMutation.mutate({
      amount: Number(withdrawalAmount),
      reason: withdrawalReason,
    }, {
      onSuccess: () => {
        toast.success("Withdrawal request submitted successfully!")
        setIsApplyOpen(false)
        setWithdrawalAmount("")
        setWithdrawalReason("")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to submit request")
      }
    })
  }

  // Handle HR/Admin approving or rejecting request
  const handleProcessRequest = (id: string, status: "Approved" | "Rejected") => {
    Swal.fire({
      title: `${status === "Approved" ? "Approve" : "Reject"} PF Withdrawal?`,
      text: `Do you want to ${status.toLowerCase()} this withdrawal request? Provide any comments below:`,
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
        processWithdrawalMutation.mutate({
          id,
          status,
          remarks: result.value || "",
        }, {
          onSuccess: () => {
            toast.success(`Request marked as ${status.toLowerCase()} successfully!`)
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to process request")
          }
        })
      }
    })
  }

  // Filter ledgers by search query
  const filteredLedger = ledgerData?.filter((log) => {
    const q = searchQuery.toLowerCase()
    return (
      log.fullName.toLowerCase().includes(q) ||
      log.employeeDisplayId.toLowerCase().includes(q) ||
      (log.description && log.description.toLowerCase().includes(q)) ||
      (log.monthKey && log.monthKey.toLowerCase().includes(q))
    )
  }) || []

  // Filter withdrawals by search query
  const filteredWithdrawals = withdrawalsData?.filter((w) => {
    const q = searchQuery.toLowerCase()
    return (
      w.fullName.toLowerCase().includes(q) ||
      w.employeeDisplayId.toLowerCase().includes(q) ||
      w.reason.toLowerCase().includes(q) ||
      w.status.toLowerCase().includes(q)
    )
  }) || []

  // Employee-specific balance metrics
  const myBalanceRecord = pfBalances?.find((b: any) => b.employeeId === user?.id)
  const myTotalBalance = myBalanceRecord ? Number(myBalanceRecord.totalPf) : 0
  const myMonthsContributed = myBalanceRecord ? Number(myBalanceRecord.monthsContributed) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Provident Fund (PF) Management</h2>
          <p className="text-muted-foreground text-sm">Monitor cumulative employee retirement assets and employer contribution pools.</p>
        </div>
        {!isAdmin && (
          <Button size="sm" className="gap-2 text-xs" onClick={() => setIsApplyOpen(true)}>
            <Plus className="h-4 w-4" />
            Request Withdrawal
          </Button>
        )}
      </div>

      {/* KPI summaries */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isAdmin ? (
          <>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Reserves Pool</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">
                    {formatCurrency(pfBalances?.reduce((sum, b) => sum + Number(b.totalPf), 0) || 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accrued employee + employer shares</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Contributors</p>
                  <p className="text-2xl font-bold mt-1">
                    {pfBalances?.filter(b => Number(b.totalPf) > 0).length || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Employees currently on ledger</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600">
                    {withdrawalsData?.filter(w => w.status === "Pending").length || 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting review and approval</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">My Total Accrued Balance</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(myTotalBalance)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Accumulated employer & employee contributions</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Months Contributed</p>
                  <p className="text-2xl font-bold mt-1">{myMonthsContributed} months</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">PF contribution cycles completed</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="p-4 shadow-none border-border/40">
              <CardContent className="p-0 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Withdrawal Policies</p>
                  <p className="text-sm font-semibold mt-2.5 line-clamp-1">{pfSettings?.withdrawalRules || "Standard Trust Rules"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">As per global regulations</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-purple-500/5 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-[450px] shadow-none border border-border/40">
          {isAdmin ? (
            <>
              <TabsTrigger value="reserves" className="text-xs">PF Reserves</TabsTrigger>
              <TabsTrigger value="ledger" className="text-xs">Transaction Ledger</TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs">Withdrawal Requests</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="my-ledger" className="text-xs">My Ledger</TabsTrigger>
              <TabsTrigger value="my-withdrawals" className="text-xs">My Requests</TabsTrigger>
              <TabsTrigger value="rules" className="text-xs">Rules & Settings</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* --- ADMIN: reserves list --- */}
        {isAdmin && (
          <TabsContent value="reserves" className="m-0">
            <ProvidentFundTab
              empPfRate={empPfRate}
              employerPfRate={employerPfRate}
              activeEmployees={employeesData?.data || []}
              getEmployeePfStats={getEmployeePfStats}
              formatCurrency={formatCurrency}
              isLoading={isPfLoading}
            />
          </TabsContent>
        )}

        {/* --- COMMON: transaction ledger list --- */}
        <TabsContent value={isAdmin ? "ledger" : "my-ledger"} className="m-0">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold">Provident Fund Transaction Ledger</CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin ? "Audit trail of all employee deductions and matching corporate deposits." : "Your detailed history of monthly savings and withdrawals."}
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
              {isLedgerLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                      {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>}
                      <TableHead className="text-xs font-semibold text-muted-foreground">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Emp. Share</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Employer Share</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Net Value</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedger.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-muted-foreground text-xs">
                          No transactions found on ledger.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLedger.map((log) => (
                        <tr key={log.id} className="border-b border-border/20 text-xs hover:bg-muted/10">
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </td>
                          {isAdmin && (
                            <td className="p-3 font-semibold">
                              {log.fullName} ({log.employeeDisplayId})
                            </td>
                          )}
                          <td className="p-3 capitalize font-medium">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              log.type === "contribution" ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/10" :
                              log.type === "withdrawal" ? "bg-rose-500/5 text-rose-600 border border-rose-500/10" : "bg-muted text-muted-foreground"
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-muted-foreground">
                            {log.employeeContribution > 0 ? formatCurrency(log.employeeContribution) : "—"}
                          </td>
                          <td className="p-3 text-right font-medium text-muted-foreground">
                            {log.employerContribution > 0 ? formatCurrency(log.employerContribution) : "—"}
                          </td>
                          <td className={`p-3 text-right font-bold ${log.amount < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                            {log.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(log.amount))}
                          </td>
                          <td className="p-3 text-muted-foreground italic max-w-xs truncate">{log.description}</td>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- COMMON: withdrawal requests view --- */}
        <TabsContent value={isAdmin ? "withdrawals" : "my-withdrawals"} className="m-0">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold">PF Withdrawal Requests</CardTitle>
                <CardDescription className="text-xs">
                  {isAdmin ? "Review and approve/reject employee retirement fund withdrawal requests." : "Track the approval status of your withdrawal and loan requests."}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-9 text-xs h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isWithdrawalsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-muted-foreground">Date Requested</TableHead>
                      {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>}
                      <TableHead className="text-xs font-semibold text-muted-foreground text-right">Requested Amount</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Reason</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-muted-foreground">Remarks / Reviewer</TableHead>
                      {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground text-center">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-12 text-muted-foreground text-xs">
                          No withdrawal requests registered.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWithdrawals.map((w) => (
                        <tr key={w.id} className="border-b border-border/20 text-xs hover:bg-muted/10">
                          <td className="p-3 font-mono text-[10px] text-muted-foreground">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </td>
                          {isAdmin && (
                            <td className="p-3 font-semibold">
                              {w.fullName} ({w.employeeDisplayId})
                            </td>
                          )}
                          <td className="p-3 text-right font-bold text-foreground">
                            {formatCurrency(w.amount)}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">{w.reason}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 font-semibold ${
                              w.status === "Approved" ? "bg-emerald-500/5 text-emerald-600 border border-emerald-500/10" :
                              w.status === "Rejected" ? "bg-rose-500/5 text-rose-600 border border-rose-500/10" : 
                              "bg-amber-500/5 text-amber-600 border border-amber-500/10"
                            }`}>
                              {w.status === "Approved" && <CheckCircle2 className="h-3 w-3" />}
                              {w.status === "Rejected" && <XCircle className="h-3 w-3" />}
                              {w.status === "Pending" && <Clock className="h-3 w-3" />}
                              {w.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground max-w-xs truncate">
                            {w.status !== "Pending" ? (
                              <div>
                                <p className="font-medium text-foreground">{w.remarks || "No remarks"}</p>
                                <p className="text-[10px] text-muted-foreground">Reviewed by: {w.actionByName || "System"}</p>
                              </div>
                            ) : "Awaiting processing..."}
                          </td>
                          {isAdmin && (
                            <td className="p-3 text-center">
                              {w.status === "Pending" ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="xs"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7 cursor-pointer"
                                    onClick={() => handleProcessRequest(w.id, "Approved")}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    className="border-rose-500 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 text-[10px] h-7 cursor-pointer"
                                    onClick={() => handleProcessRequest(w.id, "Rejected")}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : "—"}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- EMPLOYEE ONLY: Rules tab --- */}
        {!isAdmin && (
          <TabsContent value="rules" className="m-0">
            <Card className="shadow-none border-border/40 p-6 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold border-b pb-2">Provident Fund Withdrawal Rules & Instructions</h3>
                <p className="text-muted-foreground mt-1">Make sure you comply with the following statutory guidelines before submitting a request:</p>
              </div>
              <div className="space-y-3 bg-muted/10 p-4 border border-border/40 rounded-lg">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Minimum Service:</strong> You must complete at least {pfSettings?.minServiceMonths ?? 12} months of continuous service to be eligible for Provident Fund benefits.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Withdrawal Limit:</strong> You cannot request an amount greater than your total accrued reserves ({formatCurrency(myTotalBalance)}).</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Approval Workflow:</strong> All requests are subject to internal audit and MD approval. The average processing time is 3–5 working days.</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Official Guidelines Clause:</h4>
                <p className="text-muted-foreground mt-1 italic">"{pfSettings?.withdrawalRules || "As per PF Trust Rules and Labour Law"}"</p>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* --- Apply Withdrawal Dialogue Modal --- */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-[420px] text-xs">
          <form onSubmit={handleApplyWithdrawal}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">Request PF Withdrawal</DialogTitle>
              <DialogDescription className="text-[10px]">
                Submit a withdrawal request. Please review your balance limit before applying.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 border-t border-b border-border/30 py-4 my-4">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatCurrency(myTotalBalance)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-600/30" />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Withdrawal Amount (BDT)</label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  className="text-xs h-9"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  max={myTotalBalance}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Justification / Reason</label>
                <Textarea
                  placeholder="Provide a detailed explanation for this withdrawal request..."
                  className="text-xs resize-none h-24"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={applyWithdrawalMutation.isPending}>
                {applyWithdrawalMutation.isPending ? (
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
    </div>
  )
}
