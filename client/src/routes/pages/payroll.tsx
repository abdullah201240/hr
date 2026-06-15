import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Coins,
  FileSpreadsheet,
  Settings,
  Eye,
  CheckCircle,
  Printer,
  Gift,
  CreditCard,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"

interface EmployeeSalaryDef {
  email: string
  name: string
  role: string
  dept: string
  joinDate: string
  basicSalary: number
}

interface Payslip {
  employeeEmail: string
  name: string
  role: string
  dept: string
  basicSalary: number
  allowances: {
    hra: number
    transport: number
    medical: number
  }
  deductions: {
    tax: number
    pf: number
  }
  bonus: number
  bonusDescription: string
  netPay: number
  paymentStatus: "Unpaid" | "Paid"
  paymentMethod?: string
  paymentDate?: string
  paymentReference?: string
}

interface PayrollCycle {
  monthKey: string // e.g. "2026-06"
  status: "Draft" | "Processed" | "Distributed"
  payslips: Payslip[]
}

interface DisbursementRecord {
  monthKey: string
  disbursementDate: string
  paymentMethod: string
  referenceId: string
  totalDisbursed: number
  employeeCount: number
}

const getBasicSalary = (role: string): number => {
  switch (role) {
    case "Senior Engineer": return 65000
    case "Product Manager": return 62000
    case "HR Specialist": return 58000
    case "Finance Analyst": return 65000
    case "Marketing Lead": return 58000
    case "Sales Rep": return 55000
    default: return 50000
  }
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeSalaryDef[]>([])
  const [activeTab, setActiveTab] = useState("processing")
  
  // Selected payroll cycle month
  const [selectedMonth, setSelectedMonth] = useState("2026-06")

  // PF settings
  const [empPfRate, setEmpPfRate] = useState(10)
  const [employerPfRate, setEmployerPfRate] = useState(10)
  
  // Payroll database state
  const [payrolls, setPayrolls] = useState<PayrollCycle[]>([])
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(() => {
    const stored = localStorage.getItem("hr_disbursements")
    return stored ? JSON.parse(stored) : []
  })
  
  // Modal states
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [isPfConfigOpen, setIsPfConfigOpen] = useState(false)
  const [editingBonusEmail, setEditingBonusEmail] = useState("")
  const [isBonusOpen, setIsBonusOpen] = useState(false)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)

  // Edit bonus states
  const [bonusVal, setBonusVal] = useState(0)
  const [bonusReason, setBonusReason] = useState("")

  // Payout states
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  const [payoutDate, setPayoutDate] = useState("2026-06-30")
  const [payoutRef, setPayoutRef] = useState("")

  // Fetch employees from localStorage or fallback
  useEffect(() => {
    const stored = localStorage.getItem("employees_list")
    const list = stored ? JSON.parse(stored) : [
      { employeeId: "EMP-001", name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", role: "Senior Engineer", dept: "Engineering", joinDate: "2023-03-15", status: "Active" },
      { employeeId: "EMP-002", name: "James Cooper", email: "james.c@sadoshima.com", role: "Product Manager", dept: "Product", joinDate: "2022-08-01", status: "Active" },
      { employeeId: "EMP-003", name: "Emily Zhang", email: "emily.z@sadoshima.com", role: "HR Specialist", dept: "HR", joinDate: "2024-01-10", status: "Active" },
      { employeeId: "EMP-004", name: "David Kim", email: "david.k@sadoshima.com", role: "Finance Analyst", dept: "Finance", joinDate: "2023-06-20", status: "On Leave" },
      { employeeId: "EMP-005", name: "Lisa Johnson", email: "lisa.j@sadoshima.com", role: "Marketing Lead", dept: "Marketing", joinDate: "2021-11-05", status: "Active" },
      { employeeId: "EMP-006", name: "Marcus Brown", email: "marcus.b@sadoshima.com", role: "Sales Rep", dept: "Sales", joinDate: "2025-02-01", status: "Active" },
    ]

    setEmployees(list.map((emp: Record<string, string>) => ({
      email: emp.email,
      name: emp.name,
      role: emp.role,
      dept: emp.dept,
      joinDate: emp.joinDate || "2023-01-01",
      basicSalary: getBasicSalary(emp.role),
    })))
  }, [])

  // Load / Initialize payroll cycles
  useEffect(() => {
    const stored = localStorage.getItem("hr_payrolls")
    if (stored) {
      try {
        setPayrolls(JSON.parse(stored))
      } catch (e) {
        console.error("Failed parsing payrolls", e)
      }
    }
  }, [])

  // Load PF rates
  useEffect(() => {
    const rates = localStorage.getItem("hr_pf_settings")
    if (rates) {
      try {
        const parsed = JSON.parse(rates)
        setEmpPfRate(parsed.empPfRate)
        setEmployerPfRate(parsed.employerPfRate)
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const savePayrolls = (updatedPayrolls: PayrollCycle[]) => {
    setPayrolls(updatedPayrolls)
    localStorage.setItem("hr_payrolls", JSON.stringify(updatedPayrolls))
  }

  // Get current active cycle details or compile a default draft
  const currentCycle = payrolls.find(p => p.monthKey === selectedMonth) || (() => {
    // Generate draft slips
    const draftPayslips = employees.map(emp => {
      const basic = emp.basicSalary
      const hra = Math.round(basic * 0.20)
      const transport = Math.round(basic * 0.10)
      const medical = Math.round(basic * 0.05)
      
      const tax = Math.round(basic * 0.12)
      const pf = Math.round(basic * (empPfRate / 100))
      
      const netPay = (basic + hra + transport + medical) - (tax + pf)

      return {
        employeeEmail: emp.email,
        name: emp.name,
        role: emp.role,
        dept: emp.dept,
        basicSalary: basic,
        allowances: { hra, transport, medical },
        deductions: { tax, pf },
        bonus: 0,
        bonusDescription: "",
        netPay,
        paymentStatus: "Unpaid" as const,
      }
    })

    return {
      monthKey: selectedMonth,
      status: "Draft" as const,
      payslips: draftPayslips,
    }
  })()

  // Manage Bonus configuration
  const handleOpenBonus = (email: string) => {
    const slip = currentCycle.payslips.find(p => p.employeeEmail === email)
    if (slip) {
      setBonusVal(slip.bonus || 0)
      setBonusReason(slip.bonusDescription || "")
      setEditingBonusEmail(email)
      setIsBonusOpen(true)
    }
  }

  const handleSaveBonus = () => {
    const updatedPayslips = currentCycle.payslips.map(slip => {
      if (slip.employeeEmail === editingBonusEmail) {
        const basic = slip.basicSalary
        const hra = slip.allowances.hra
        const transport = slip.allowances.transport
        const medical = slip.allowances.medical
        const tax = slip.deductions.tax
        const pf = slip.deductions.pf
        
        // Net pay including new bonus
        const netPay = (basic + hra + transport + medical + bonusVal) - (tax + pf)
        return {
          ...slip,
          bonus: bonusVal,
          bonusDescription: bonusReason,
          netPay,
        }
      }
      return slip
    })

    const updatedCycle: PayrollCycle = {
      ...currentCycle,
      payslips: updatedPayslips,
    }

    const nextPayrolls = payrolls.filter(p => p.monthKey !== selectedMonth)
    savePayrolls([...nextPayrolls, updatedCycle])
    setIsBonusOpen(false)

    Swal.fire({
      title: "Bonus Saved!",
      text: "Bonus allocations and net payable amounts updated.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md"
      }
    })
  }

  const handleRunPayroll = () => {
    Swal.fire({
      title: "Lock and Process Payroll?",
      text: `Are you sure you want to finalize and lock the monthly payroll calculation ledger for ${selectedMonth}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Process",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then(result => {
      if (result.isConfirmed) {
        // Upsert processed cycle
        const nextPayrolls = payrolls.filter(p => p.monthKey !== selectedMonth)
        const lockedCycle: PayrollCycle = {
          ...currentCycle,
          status: "Processed"
        }
        const updated = [...nextPayrolls, lockedCycle]
        savePayrolls(updated)

        Swal.fire({
          title: "Payroll Processed!",
          text: `The payroll registers for ${selectedMonth} have been successfully calculated. You can now distribute salaries.`,
          icon: "success",
          confirmButtonText: "Done",
          buttonsStyling: false,
          customClass: {
            confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2"
          }
        })
      }
    })
  }

  // Execute Salary Disbursement
  const handleExecuteDisbursement = () => {
    if (!payoutRef.trim()) {
      Swal.fire("Error", "Please provide a transaction reference ID", "error")
      return
    }

    const totalDisbursed = currentCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)

    const updatedPayslips = currentCycle.payslips.map(slip => ({
      ...slip,
      paymentStatus: "Paid" as const,
      paymentMethod: payoutMethod,
      paymentDate: payoutDate,
      paymentReference: payoutRef.trim(),
    }))

    const distributedCycle: PayrollCycle = {
      ...currentCycle,
      status: "Distributed",
      payslips: updatedPayslips,
    }

    const nextPayrolls = payrolls.filter(p => p.monthKey !== selectedMonth)
    savePayrolls([...nextPayrolls, distributedCycle])

    // Log the disbursement
    const newRecord: DisbursementRecord = {
      monthKey: selectedMonth,
      disbursementDate: payoutDate,
      paymentMethod: payoutMethod,
      referenceId: payoutRef.trim(),
      totalDisbursed,
      employeeCount: updatedPayslips.length,
    }

    const updatedRecords = [newRecord, ...disbursements]
    setDisbursements(updatedRecords)
    localStorage.setItem("hr_disbursements", JSON.stringify(updatedRecords))

    setIsDisburseOpen(false)
    setPayoutRef("")

    Swal.fire({
      title: "Salaries Disbursed!",
      text: `Salaries for ${selectedMonth} have been successfully marked as PAID via ${payoutMethod}.`,
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md"
      }
    })
  }

  // Calculate PF balances based on historic payrolls & join duration seed
  const getEmployeePfStats = (emp: EmployeeSalaryDef) => {
    const joinDateObj = new Date(emp.joinDate)
    const today = new Date()
    const diffMonths = (today.getFullYear() - joinDateObj.getFullYear()) * 12 + today.getMonth() - joinDateObj.getMonth()
    const months = Math.max(1, diffMonths)

    const empContribution = Math.round(emp.basicSalary * (empPfRate / 100))
    const employerMatch = Math.round(emp.basicSalary * (employerPfRate / 100))
    const monthlyTotal = empContribution + employerMatch
    const cumulativeTotal = monthlyTotal * months

    return {
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: cumulativeTotal,
      monthsActive: months,
    }
  }

  const savePfSettings = () => {
    localStorage.setItem("hr_pf_settings", JSON.stringify({ empPfRate, employerPfRate }))
    setIsPfConfigOpen(false)
    Swal.fire({
      title: "PF Setup Updated!",
      text: "Provident Fund matching and deduction percentages updated globally.",
      icon: "success",
      confirmButtonText: "Close",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground px-4 py-2 font-semibold rounded-md"
      }
    })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(val)
  }

  // Calculate total monthly analytics
  const totalNetPay = currentCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)
  const totalAllowancesSum = currentCycle.payslips.reduce((sum, p) => sum + p.allowances.hra + p.allowances.transport + p.allowances.medical + p.bonus, 0)
  const totalDeductionsSum = currentCycle.payslips.reduce((sum, p) => sum + p.deductions.tax + p.deductions.pf, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Payroll & Benefits
          </h2>
          <p className="text-muted-foreground">Process monthly employee compensation, allocate bonuses, and disburse payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => setIsPfConfigOpen(true)}>
            <Settings className="h-4 w-4" />
            PF Configuration
          </Button>
          {currentCycle.status === "Draft" ? (
            <Button size="sm" className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleRunPayroll}>
              <CheckCircle className="h-4 w-4" />
              Finalize Payroll
            </Button>
          ) : currentCycle.status === "Processed" ? (
            <Button size="sm" className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsDisburseOpen(true)}>
              <CreditCard className="h-4 w-4" />
              Disburse Salaries
            </Button>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1 text-xs">
              <CheckCircle className="h-3.5 w-3.5" />
              Salaries Disbursed
            </Badge>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Month Net Payable</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalNetPay)}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">{currentCycle.payslips.length} employees compensated</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Cumulative PF Reserve</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(employees.reduce((acc, curr) => acc + getEmployeePfStats(curr).cumulative, 0))}
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">{empPfRate}% Employee + {employerPfRate}% Match</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Allowances + Bonuses</p>
              <div className="text-sm font-semibold mt-1">
                <span className="text-emerald-600">+{formatCurrency(totalAllowancesSum)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-rose-500">-{formatCurrency(totalDeductionsSum)}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">Taxes, medical, bonuses, HRA</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="processing" className="text-xs">Payroll Processing</TabsTrigger>
          <TabsTrigger value="pf" className="text-xs">Provident Fund (PF)</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Disbursement Logs</TabsTrigger>
        </TabsList>

        {/* TAB 1: PAYROLL PROCESSING */}
        <TabsContent value="processing" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Monthly Compensation Ledger</CardTitle>
                <CardDescription className="text-xs">Configure bonuses during draft status and view disbursement statuses.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
                >
                  <option value="2026-06">June 2026</option>
                  <option value="2026-05">May 2026</option>
                  <option value="2026-04">April 2026</option>
                </select>
                <Badge variant="outline" className={cn(
                  "text-[10px] font-bold py-1 px-2.5",
                  currentCycle.status === "Distributed" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                  currentCycle.status === "Processed" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                  currentCycle.status === "Draft" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                )}>
                  {currentCycle.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Basic Salary</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Bonus</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Allowances</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Deductions</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Net Payable</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Payout Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-36">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCycle.payslips.map(payslip => (
                    <TableRow key={payslip.employeeEmail} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{payslip.name}</p>
                          <p className="text-[10px] text-muted-foreground">{payslip.role} · {payslip.dept}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                        {formatCurrency(payslip.basicSalary)}
                      </TableCell>
                      <TableCell className="py-3 text-xs">
                        {payslip.bonus > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-600 font-bold">+{formatCurrency(payslip.bonus)}</span>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">{payslip.bonusDescription}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-emerald-600 font-semibold">
                        +{formatCurrency(payslip.allowances.hra + payslip.allowances.transport + payslip.allowances.medical)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-rose-500 font-semibold">
                        -{formatCurrency(payslip.deductions.tax + payslip.deductions.pf)}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-bold text-foreground">
                        {formatCurrency(payslip.netPay)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold py-0.5 px-2",
                          payslip.paymentStatus === "Paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}>
                          {payslip.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {currentCycle.status === "Draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] gap-1"
                              onClick={() => handleOpenBonus(payslip.employeeEmail)}
                            >
                              <Gift className="h-3 w-3" />
                              Configure Bonus
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-md"
                            onClick={() => setViewPayslip(payslip)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Payslip
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PF MANAGEMENT */}
        <TabsContent value="pf" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Provident Fund Ledger & Reserves</CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of statutory retirement reserves and accumulated balances.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Name</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Basic Salary</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employee Share ({empPfRate}%)</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employer Match ({employerPfRate}%)</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Tenure Seed</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Accrued PF Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(emp => {
                    const stats = getEmployeePfStats(emp)
                    return (
                      <TableRow key={emp.email} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{emp.name}</p>
                            <p className="text-[10px] text-muted-foreground">{emp.dept} · Joined {emp.joinDate}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-semibold">
                          {formatCurrency(emp.basicSalary)}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-foreground font-medium">
                          {formatCurrency(stats.monthlyEmp)}/mo
                        </TableCell>
                        <TableCell className="py-3 text-xs text-foreground font-medium">
                          {formatCurrency(stats.monthlyEmployer)}/mo
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {stats.monthsActive} months
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">
                          {formatCurrency(stats.cumulative)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DISBURSEMENT LOGS */}
        <TabsContent value="logs" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" />
                Salary Disbursement Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                Audit history of completed monthly payouts and distribution networks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {disbursements.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Payout Month</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Disbursement Date</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Method</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Transaction Reference</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Employees</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Total Disbursed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.map((rec) => (
                      <TableRow key={`${rec.monthKey}-${rec.referenceId}`} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3 text-xs font-semibold">{rec.monthKey}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{rec.disbursementDate}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="secondary" className="text-[10px] font-bold">{rec.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">{rec.referenceId}</TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{rec.employeeCount} officers</TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">{formatCurrency(rec.totalDisbursed)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No disbursement records logged yet</p>
                  <p className="text-xs">Once you process and execute payouts on a month cycle, they will be logged here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configure Employee Bonus Dialog */}
      <Dialog open={isBonusOpen} onOpenChange={setIsBonusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Configure Special Bonus</DialogTitle>
            <DialogDescription className="text-xs">Allocate performance or festival incentives for this employee's draft payslip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Bonus Amount (৳)</Label>
              <Input
                type="number"
                value={bonusVal}
                onChange={e => setBonusVal(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason / Description</Label>
              <Input
                placeholder="e.g. Q2 Performance Bonus, Festival Incentive"
                value={bonusReason}
                onChange={e => setBonusReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsBonusOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleSaveBonus} className="text-xs">Save Allocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Disbursement Dialog */}
      <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Distribute & Disburse Salaries</DialogTitle>
            <DialogDescription className="text-xs">Configure payout distribution parameters to mark ledger as PAID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Distribution Method</Label>
              <select
                value={payoutMethod}
                onChange={e => setPayoutMethod(e.target.value)}
                className="w-full bg-background border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                <option value="Bank Transfer">Bank Transfer (EFT/Wire)</option>
                <option value="Mobile Wallet">Mobile Wallet (bKash/Nagad)</option>
                <option value="Cash Payment">Cash Payment</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Disbursement Date</Label>
              <Input
                type="date"
                value={payoutDate}
                onChange={e => setPayoutDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Transaction Reference / Voucher ID</Label>
              <Input
                placeholder="e.g. TXN98724128"
                value={payoutRef}
                onChange={e => setPayoutRef(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsDisburseOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={handleExecuteDisbursement} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none">Execute Payout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global PF Configuration Dialog */}
      <Dialog open={isPfConfigOpen} onOpenChange={setIsPfConfigOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Global PF Setup</DialogTitle>
            <DialogDescription className="text-xs">Adjust percentage values for retirement Provident Fund allocations.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employee Contribution (%)</Label>
              <Input
                type="number"
                value={empPfRate}
                onChange={e => setEmpPfRate(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Employer Match Rate (%)</Label>
              <Input
                type="number"
                value={employerPfRate}
                onChange={e => setEmployerPfRate(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsPfConfigOpen(false)} className="text-xs">Cancel</Button>
            <Button size="sm" onClick={savePfSettings} className="text-xs">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Payslip View Dialog */}
      <Dialog open={viewPayslip !== null} onOpenChange={() => setViewPayslip(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {viewPayslip && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Pay Slip Ledger</span>
                  <span className="text-[10px] text-muted-foreground mr-4">Period: {selectedMonth}</span>
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold tracking-wider text-primary">Sadoshima Global Corp</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 border-t border-b border-border/40 py-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Employee Name</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Designation & Department</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.role} ({viewPayslip.dept})</p>
                  </div>
                </div>

                {/* Earnings and deductions lists */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">Earnings</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Basic Salary:</span><span className="font-semibold">{formatCurrency(viewPayslip.basicSalary)}</span></div>
                      <div className="flex justify-between"><span>HRA Allowance (20%):</span><span className="font-semibold">{formatCurrency(viewPayslip.allowances.hra)}</span></div>
                      <div className="flex justify-between"><span>Transport Allowance (10%):</span><span className="font-semibold">{formatCurrency(viewPayslip.allowances.transport)}</span></div>
                      <div className="flex justify-between"><span>Medical Allowance (5%):</span><span className="font-semibold">{formatCurrency(viewPayslip.allowances.medical)}</span></div>
                      {viewPayslip.bonus > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Bonus ({viewPayslip.bonusDescription}):</span>
                          <span>{formatCurrency(viewPayslip.bonus)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">Deductions</p>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span>Income Tax (12%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductions.tax)}</span></div>
                      <div className="flex justify-between"><span>PF Contribution ({empPfRate}%):</span><span className="font-semibold">{formatCurrency(viewPayslip.deductions.pf)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Disbursement info if paid */}
                {viewPayslip.paymentStatus === "Paid" && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
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
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setViewPayslip(null)} className="text-xs">Close</Button>
                <Button size="sm" className="gap-2 text-xs" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Payslip
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
