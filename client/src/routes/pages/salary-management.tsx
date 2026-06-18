import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Coins,
  Eye,
  CheckCircle,
  Printer,
  Gift,
  CreditCard,
  History,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Calculator,
  Calendar,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  useSalaryTemplatesQuery,
  useCreateSalaryTemplateMutation,
  useUpdateSalaryTemplateMutation,
  useDeleteSalaryTemplateMutation,
  useEmployeeSalariesQuery,
  useAssignEmployeeSalaryMutation,
  useSalarySummaryQuery,
} from "@/hooks/useSalary"
import { useEmployeesQuery } from "@/hooks/useEmployees"
import { useFestivalBonusRulesQuery } from "@/hooks/useFestivalBonus"
import { useProvidentFundSettingsQuery } from "@/hooks/useProvidentFund"
import type {
  SalaryTemplate,
  EmployeeSalary,
  CreateSalaryTemplateComponentPayload,
} from "@/types"
import { toast } from "sonner"

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(val)

const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM"

// ─── Default template component for new templates ───────────────────────────

const defaultComponents: CreateSalaryTemplateComponentPayload[] = [
  { name: "House Rent Allowance", type: "earning", calculationType: "percentage", value: 20, isTaxable: false, sortOrder: 0 },
  { name: "Transport Allowance", type: "earning", calculationType: "percentage", value: 10, isTaxable: false, sortOrder: 1 },
  { name: "Medical Allowance", type: "earning", calculationType: "percentage", value: 5, isTaxable: false, sortOrder: 2 },
  { name: "Income Tax", type: "deduction", calculationType: "percentage", value: 12, isTaxable: false, sortOrder: 3 },
]

// ─── Payroll mock types (migrated from old payroll.tsx) ─────────────────────

interface Payslip {
  employeeEmail: string
  name: string
  role: string
  dept: string
  basicSalary: number
  allowances: { hra: number; transport: number; medical: number }
  deductions: { tax: number; pf: number }
  bonus: number
  bonusDescription: string
  netPay: number
  paymentStatus: "Unpaid" | "Paid"
  paymentMethod?: string
  paymentDate?: string
  paymentReference?: string
}

interface PayrollCycle {
  monthKey: string
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

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function SalaryManagementPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")

  // ─── API Hooks ──────────────────────────────────────────────────────────
  const { data: templates = [], isLoading: templatesLoading } = useSalaryTemplatesQuery()
  const { data: employeeSalaries = [], isLoading: salariesLoading } = useEmployeeSalariesQuery()
  const { data: summary } = useSalarySummaryQuery()
  const { data: employeesData } = useEmployeesQuery({ page: 1, limit: 500, status: "active" })
  const { data: pfSettings } = useProvidentFundSettingsQuery()
  const { data: festivalBonusRules = [] } = useFestivalBonusRulesQuery()

  const createTemplateMutation = useCreateSalaryTemplateMutation()
  const updateTemplateMutation = useUpdateSalaryTemplateMutation()
  const deleteTemplateMutation = useDeleteSalaryTemplateMutation()
  const assignSalaryMutation = useAssignEmployeeSalaryMutation()

  const employees = employeesData?.data || []

  // ─── Assign Salary Dialog State ─────────────────────────────────────────
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assignEmployeeId, setAssignEmployeeId] = useState("")
  const [assignBasicSalary, setAssignBasicSalary] = useState(0)
  const [assignTemplateId, setAssignTemplateId] = useState("")
  const [assignPfApplicable, setAssignPfApplicable] = useState(true)
  const [assignFestivalBonus, setAssignFestivalBonus] = useState(true)
  const [assignEffectiveDate, setAssignEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [assignNotes, setAssignNotes] = useState("")

  // ─── Template Dialog State ──────────────────────────────────────────────
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateComponents, setTemplateComponents] = useState<
    CreateSalaryTemplateComponentPayload[]
  >([])

  // ─── Payroll (Tab 3) State — Migrated from payroll.tsx ──────────────────
  const [selectedMonth, setSelectedMonth] = useState("2026-06")
  const [empPfRate] = useState(
    pfSettings ? Number((pfSettings as any).employeeContributionRate) : 10
  )
  const [employerPfRate] = useState(
    pfSettings ? Number((pfSettings as any).employerContributionRate) : 10
  )
  const [payrolls, setPayrolls] = useState<PayrollCycle[]>(() => {
    const stored = localStorage.getItem("hr_payrolls")
    return stored ? JSON.parse(stored) : []
  })
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>(() => {
    const stored = localStorage.getItem("hr_disbursements")
    return stored ? JSON.parse(stored) : []
  })
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [editingBonusEmail, setEditingBonusEmail] = useState("")
  const [isBonusOpen, setIsBonusOpen] = useState(false)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)
  const [bonusVal, setBonusVal] = useState(0)
  const [bonusReason, setBonusReason] = useState("")
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  const [payoutDate, setPayoutDate] = useState("2026-06-30")
  const [payoutRef, setPayoutRef] = useState("")

  // ─── Expanded template cards ────────────────────────────────────────────
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ─── Salary Assignment Helpers ──────────────────────────────────────────

  // Map employee salaries by employeeId for quick lookup
  const salaryByEmployee = useMemo(() => {
    const map = new Map<string, EmployeeSalary>()
    employeeSalaries.forEach((s) => {
      if (s.status === "active") map.set(s.employeeId, s)
    })
    return map
  }, [employeeSalaries])

  // Filter employees by search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees
    const q = searchQuery.toLowerCase()
    return employees.filter(
      (e) =>
        e.fullNameEnglish?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.departmentName?.toLowerCase().includes(q) ||
        e.designationName?.toLowerCase().includes(q)
    )
  }, [employees, searchQuery])

  // Calculate preview salary breakdown for assign dialog
  const selectedTemplate = templates.find((t) => t.id === assignTemplateId)

  const salaryPreview = useMemo(() => {
    if (assignBasicSalary <= 0) return null
    const basic = assignBasicSalary
    let totalEarnings = basic
    let totalDeductions = 0

    if (selectedTemplate) {
      selectedTemplate.components.forEach((comp) => {
        const amount =
          comp.calculationType === "percentage"
            ? Math.round(basic * (comp.value / 100))
            : comp.value
        if (comp.type === "earning") totalEarnings += amount
        else totalDeductions += amount
      })
    }

    // PF deduction if applicable
    if (assignPfApplicable && pfSettings) {
      const pfRate = Number((pfSettings as any).employeeContributionRate) || 10
      totalDeductions += Math.round(basic * (pfRate / 100))
    }

    return {
      gross: totalEarnings,
      deductions: totalDeductions,
      net: totalEarnings - totalDeductions,
    }
  }, [assignBasicSalary, selectedTemplate, assignPfApplicable, pfSettings])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleOpenAssign = (employeeId: string) => {
    const existing = salaryByEmployee.get(employeeId)
    setAssignEmployeeId(employeeId)
    setAssignBasicSalary(existing?.basicSalary || 0)
    setAssignTemplateId(existing?.templateId || "")
    setAssignPfApplicable(existing?.pfApplicable ?? true)
    setAssignFestivalBonus(existing?.festivalBonusApplicable ?? true)
    setAssignEffectiveDate(
      existing?.effectiveDate || new Date().toISOString().split("T")[0]
    )
    setAssignNotes(existing?.notes || "")
    setIsAssignOpen(true)
  }

  const handleSaveAssign = () => {
    if (assignBasicSalary <= 0) {
      toast.error("Please enter a valid basic salary amount")
      return
    }
    if (!assignEffectiveDate) {
      toast.error("Please select an effective date")
      return
    }

    assignSalaryMutation.mutate(
      {
        employeeId: assignEmployeeId,
        templateId: assignTemplateId || undefined,
        basicSalary: assignBasicSalary,
        effectiveDate: assignEffectiveDate,
        pfApplicable: assignPfApplicable,
        festivalBonusApplicable: assignFestivalBonus,
        notes: assignNotes,
      },
      {
        onSuccess: () => {
          setIsAssignOpen(false)
          Swal.fire({
            title: "Salary Assigned!",
            text: "Employee salary has been successfully configured.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton:
                "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
            },
          })
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to assign salary")
        },
      }
    )
  }

  // ─── Template CRUD Handlers ─────────────────────────────────────────────

  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null)
    setTemplateName("")
    setTemplateDescription("")
    setTemplateComponents([...defaultComponents])
    setIsTemplateDialogOpen(true)
  }

  const handleOpenEditTemplate = (template: SalaryTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateComponents(
      template.components.map((c) => ({
        name: c.name,
        type: c.type,
        calculationType: c.calculationType,
        value: c.value,
        isTaxable: c.isTaxable,
        sortOrder: c.sortOrder,
      }))
    )
    setIsTemplateDialogOpen(true)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Template name is required")
      return
    }

    const payload = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      components: templateComponents,
    }

    if (editingTemplateId) {
      updateTemplateMutation.mutate(
        { id: editingTemplateId, payload },
        {
          onSuccess: () => {
            setIsTemplateDialogOpen(false)
            toast.success("Template updated successfully")
          },
          onError: (err: any) =>
            toast.error(err?.message || "Failed to update template"),
        }
      )
    } else {
      createTemplateMutation.mutate(payload, {
        onSuccess: () => {
          setIsTemplateDialogOpen(false)
          toast.success("Template created successfully")
        },
        onError: (err: any) =>
          toast.error(err?.message || "Failed to create template"),
      })
    }
  }

  const handleDeleteTemplate = (id: string, name: string) => {
    Swal.fire({
      title: `Delete "${name}"?`,
      text: "This will permanently remove the template and all its components.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton:
          "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        deleteTemplateMutation.mutate(id, {
          onSuccess: () => toast.success("Template deleted"),
          onError: (err: any) =>
            toast.error(err?.message || "Failed to delete template"),
        })
      }
    })
  }

  const addComponent = () => {
    setTemplateComponents((prev) => [
      ...prev,
      {
        name: "",
        type: "earning",
        calculationType: "percentage",
        value: 0,
        isTaxable: false,
        sortOrder: prev.length,
      },
    ])
  }

  const removeComponent = (idx: number) => {
    setTemplateComponents((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateComponent = (
    idx: number,
    field: string,
    value: string | number | boolean
  ) => {
    setTemplateComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    )
  }

  // ─── Payroll (Tab 3) Handlers — Migrated from payroll.tsx ───────────────

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

  const payrollEmployees = useMemo(() => {
    const stored = localStorage.getItem("employees_list")
    const list = stored
      ? JSON.parse(stored)
      : [
          { employeeId: "EMP-001", name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", role: "Senior Engineer", dept: "Engineering", joinDate: "2023-03-15", status: "Active" },
          { employeeId: "EMP-002", name: "James Cooper", email: "james.c@sadoshima.com", role: "Product Manager", dept: "Product", joinDate: "2022-08-01", status: "Active" },
          { employeeId: "EMP-003", name: "Emily Zhang", email: "emily.z@sadoshima.com", role: "HR Specialist", dept: "HR", joinDate: "2024-01-10", status: "Active" },
          { employeeId: "EMP-004", name: "David Kim", email: "david.k@sadoshima.com", role: "Finance Analyst", dept: "Finance", joinDate: "2023-06-20", status: "On Leave" },
          { employeeId: "EMP-005", name: "Lisa Johnson", email: "lisa.j@sadoshima.com", role: "Marketing Lead", dept: "Marketing", joinDate: "2021-11-05", status: "Active" },
          { employeeId: "EMP-006", name: "Marcus Brown", email: "marcus.b@sadoshima.com", role: "Sales Rep", dept: "Sales", joinDate: "2025-02-01", status: "Active" },
        ]

    return list.map((emp: Record<string, string>) => ({
      email: emp.email,
      name: emp.name,
      role: emp.role,
      dept: emp.dept,
      joinDate: emp.joinDate || "2023-01-01",
      basicSalary: getBasicSalary(emp.role),
    }))
  }, [])

  const savePayrolls = (updatedPayrolls: PayrollCycle[]) => {
    setPayrolls(updatedPayrolls)
    localStorage.setItem("hr_payrolls", JSON.stringify(updatedPayrolls))
  }

  const currentCycle =
    payrolls.find((p) => p.monthKey === selectedMonth) ||
    (() => {
      const draftPayslips = payrollEmployees.map(
        (emp: { email: string; name: string; role: string; dept: string; basicSalary: number }) => {
          const basic = emp.basicSalary
          const hra = Math.round(basic * 0.2)
          const transport = Math.round(basic * 0.1)
          const medical = Math.round(basic * 0.05)
          const tax = Math.round(basic * 0.12)
          const pf = Math.round(basic * (empPfRate / 100))
          const netPay = basic + hra + transport + medical - (tax + pf)
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
        }
      )
      return { monthKey: selectedMonth, status: "Draft" as const, payslips: draftPayslips } as PayrollCycle
    })()

  const handleOpenBonus = (email: string) => {
    const slip = currentCycle.payslips.find((p) => p.employeeEmail === email)
    if (slip) {
      setBonusVal(slip.bonus || 0)
      setBonusReason(slip.bonusDescription || "")
      setEditingBonusEmail(email)
      setIsBonusOpen(true)
    }
  }

  const handleSaveBonus = () => {
    const updatedPayslips = currentCycle.payslips.map((slip) => {
      if (slip.employeeEmail === editingBonusEmail) {
        const netPay =
          slip.basicSalary +
          slip.allowances.hra +
          slip.allowances.transport +
          slip.allowances.medical +
          bonusVal -
          (slip.deductions.tax + slip.deductions.pf)
        return { ...slip, bonus: bonusVal, bonusDescription: bonusReason, netPay }
      }
      return slip
    })
    const updatedCycle: PayrollCycle = { ...currentCycle, payslips: updatedPayslips }
    const nextPayrolls = payrolls.filter((p) => p.monthKey !== selectedMonth)
    savePayrolls([...nextPayrolls, updatedCycle])
    setIsBonusOpen(false)
    Swal.fire({
      title: "Bonus Saved!",
      text: "Bonus allocations and net payable amounts updated.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
      },
    })
  }

  const handleRunPayroll = () => {
    Swal.fire({
      title: "Lock and Process Payroll?",
      text: `Are you sure you want to finalize the payroll for ${selectedMonth}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Process",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton:
          "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const nextPayrolls = payrolls.filter((p) => p.monthKey !== selectedMonth)
        savePayrolls([...nextPayrolls, { ...currentCycle, status: "Processed" }])
        Swal.fire({
          title: "Payroll Processed!",
          text: `Payroll for ${selectedMonth} has been finalized.`,
          icon: "success",
          confirmButtonText: "Done",
          buttonsStyling: false,
          customClass: {
            confirmButton:
              "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold rounded-md px-4 py-2",
          },
        })
      }
    })
  }

  const handleExecuteDisbursement = () => {
    if (!payoutRef.trim()) {
      Swal.fire("Error", "Please provide a transaction reference ID", "error")
      return
    }
    const totalDisbursed = currentCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)
    const updatedPayslips = currentCycle.payslips.map((slip) => ({
      ...slip,
      paymentStatus: "Paid" as const,
      paymentMethod: payoutMethod,
      paymentDate: payoutDate,
      paymentReference: payoutRef.trim(),
    }))
    const nextPayrolls = payrolls.filter((p) => p.monthKey !== selectedMonth)
    savePayrolls([
      ...nextPayrolls,
      { ...currentCycle, status: "Distributed", payslips: updatedPayslips },
    ])
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
      text: `Salaries for ${selectedMonth} have been marked as PAID.`,
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-md",
      },
    })
  }

  const totalNetPay = currentCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)

  // ─── PF helpers ─────────────────────────────────────────────────────────
  const getEmployeePfStats = (emp: {
    joinDate: string
    basicSalary: number
  }) => {
    const joinDateObj = new Date(emp.joinDate)
    const today = new Date()
    const diffMonths =
      (today.getFullYear() - joinDateObj.getFullYear()) * 12 +
      today.getMonth() -
      joinDateObj.getMonth()
    const months = Math.max(1, diffMonths)
    const empContribution = Math.round(emp.basicSalary * (empPfRate / 100))
    const employerMatch = Math.round(emp.basicSalary * (employerPfRate / 100))
    return {
      monthlyEmp: empContribution,
      monthlyEmployer: employerMatch,
      cumulative: (empContribution + employerMatch) * months,
      monthsActive: months,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            Salary & Payroll Management
          </h2>
          <p className="text-muted-foreground">
            Configure salaries, manage templates, process payroll and disburse
            payments
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Total Salary Budget
              </p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.totalBudget || 0)}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Active monthly commitments
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Salary Assigned</p>
              <p className="text-2xl font-bold mt-1">
                {summary?.assignedCount || 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {summary?.totalEmployees || 0}
                </span>
              </p>
              <span className="text-[10px] text-emerald-500 font-semibold">
                Employees with active salary
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Average Salary</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(summary?.avgSalary || 0)}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Across all active records
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40 bg-muted/20">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">PF Contributors</p>
              <p className="text-2xl font-bold mt-1">
                {summary?.pfContributors || 0}
              </p>
              <span className="text-[10px] text-amber-500 font-semibold">
                Provident fund enrolled
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[640px] grid-cols-4 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="overview" className="text-xs">
            Employee Salary
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">
            Salary Templates
          </TabsTrigger>
          <TabsTrigger value="processing" className="text-xs">
            Payroll Processing
          </TabsTrigger>
          <TabsTrigger value="pf" className="text-xs">
            PF & Benefits
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: EMPLOYEE SALARY OVERVIEW                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">
                  Employee Salary Directory
                </CardTitle>
                <CardDescription className="text-xs">
                  Assign basic salaries, select templates, configure PF &amp;
                  festival bonus, and set effective dates.
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-9 text-xs bg-transparent border-border/60"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Department
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Basic Salary
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Template
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      PF
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Festival Bonus
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Effective Date
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-right w-32">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salariesLoading || !employeesData ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-48 text-center border-b-0">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <p className="text-xs text-muted-foreground">
                            Loading salary records...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center border-b-0">
                        <p className="text-sm text-muted-foreground">
                          No employees found.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const salary = salaryByEmployee.get(emp.id)
                      return (
                        <TableRow
                          key={emp.id}
                          className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                {emp.employeePhotoUrl ? (
                                  <img
                                    src={emp.employeePhotoUrl}
                                    alt={emp.fullNameEnglish}
                                    className="object-cover h-full w-full"
                                  />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                    {getInitials(emp.fullNameEnglish)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground">
                                  {emp.fullNameEnglish}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {emp.employeeId} · {emp.designationName || "—"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-semibold"
                            >
                              {emp.departmentName || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-xs font-bold text-foreground">
                            {salary
                              ? formatCurrency(salary.basicSalary)
                              : "—"}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {salary?.templateName || (
                              <span className="text-muted-foreground/50 italic">
                                No template
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {salary ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-bold py-0.5 px-2",
                                  salary.pfApplicable
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}
                              >
                                {salary.pfApplicable ? "Yes" : "No"}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3">
                            {salary ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px] font-bold py-0.5 px-2",
                                  salary.festivalBonusApplicable
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}
                              >
                                {salary.festivalBonusApplicable ? "Yes" : "No"}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {salary?.effectiveDate || "—"}
                          </TableCell>
                          <TableCell className="py-3">
                            {salary ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold py-0.5 px-2"
                              >
                                Configured
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-bold py-0.5 px-2"
                              >
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] gap-1"
                              onClick={() => handleOpenAssign(emp.id)}
                            >
                              {salary ? (
                                <>
                                  <Pencil className="h-3 w-3" /> Edit
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" /> Assign
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SALARY TEMPLATES                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="templates" className="space-y-4 outline-none">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Salary Structure Templates</h3>
              <p className="text-xs text-muted-foreground">
                Create reusable salary packages with earnings and deductions.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2 text-xs"
              onClick={handleOpenCreateTemplate}
            >
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          {templatesLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : templates.length === 0 ? (
            <Card className="shadow-none border-border/40">
              <CardContent className="p-12 text-center">
                <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No salary templates created yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Create your first template to standardize salary structures.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map((template) => {
                const isExpanded = expandedTemplates.has(template.id)
                const earnings = template.components.filter(
                  (c) => c.type === "earning"
                )
                const deductions = template.components.filter(
                  (c) => c.type === "deduction"
                )
                return (
                  <Card
                    key={template.id}
                    className="shadow-none border-border/40 overflow-hidden"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-bold">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="text-[10px]">
                              {template.components.length} components ·{" "}
                              {earnings.length} earnings · {deductions.length}{" "}
                              deductions
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold py-0.5 px-2",
                              template.isActive
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            )}
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEditTemplate(template)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() =>
                              handleDeleteTemplate(template.id, template.name)
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {template.description && (
                        <p className="text-[10px] text-muted-foreground mt-1 ml-10">
                          {template.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <button
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold"
                        onClick={() => toggleExpand(template.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {isExpanded ? "Hide" : "Show"} Components
                      </button>
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {template.components.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic">
                              No components defined
                            </p>
                          ) : (
                            <div className="grid gap-1.5">
                              {template.components.map((comp) => (
                                <div
                                  key={comp.id}
                                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        comp.type === "earning"
                                          ? "bg-emerald-500"
                                          : "bg-rose-500"
                                      )}
                                    />
                                    <span className="font-medium">
                                      {comp.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground text-[10px]">
                                      {comp.calculationType === "percentage"
                                        ? `${comp.value}% of Basic`
                                        : formatCurrency(comp.value)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[8px] font-bold py-0 px-1.5",
                                        comp.type === "earning"
                                          ? "text-emerald-600 border-emerald-500/20"
                                          : "text-rose-500 border-rose-500/20"
                                      )}
                                    >
                                      {comp.type}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: PAYROLL PROCESSING                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="processing" className="space-y-4 outline-none">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold">Monthly Payroll Processing</h3>
              <p className="text-xs text-muted-foreground">
                Calculate, finalize, and disburse monthly employee compensation.
              </p>
            </div>
            <div className="flex gap-2">
              {currentCycle.status === "Draft" ? (
                <Button
                  size="sm"
                  className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleRunPayroll}
                >
                  <CheckCircle className="h-4 w-4" />
                  Finalize Payroll
                </Button>
              ) : currentCycle.status === "Processed" ? (
                <Button
                  size="sm"
                  className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setIsDisburseOpen(true)}
                >
                  <CreditCard className="h-4 w-4" />
                  Disburse Salaries
                </Button>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1 text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Salaries Disbursed
                </Badge>
              )}
            </div>
          </div>

          <Card className="shadow-none border-border/40">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">
                  Monthly Compensation Ledger
                </CardTitle>
                <CardDescription className="text-xs">
                  Net payable:{" "}
                  <span className="font-bold text-foreground">
                    {formatCurrency(totalNetPay)}
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
                >
                  <option value="2026-06">June 2026</option>
                  <option value="2026-05">May 2026</option>
                  <option value="2026-04">April 2026</option>
                </select>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold py-1 px-2.5",
                    currentCycle.status === "Distributed" &&
                      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                    currentCycle.status === "Processed" &&
                      "bg-blue-500/10 text-blue-600 border-blue-500/20",
                    currentCycle.status === "Draft" &&
                      "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}
                >
                  {currentCycle.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Basic Salary
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Bonus
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Allowances
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Deductions
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Net Payable
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-right w-36">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentCycle.payslips.map((payslip) => (
                    <TableRow
                      key={payslip.employeeEmail}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {payslip.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {payslip.role} · {payslip.dept}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                        {formatCurrency(payslip.basicSalary)}
                      </TableCell>
                      <TableCell className="py-3 text-xs">
                        {payslip.bonus > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-600 font-bold">
                              +{formatCurrency(payslip.bonus)}
                            </span>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                              {payslip.bonusDescription}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-emerald-600 font-semibold">
                        +
                        {formatCurrency(
                          payslip.allowances.hra +
                            payslip.allowances.transport +
                            payslip.allowances.medical
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-rose-500 font-semibold">
                        -
                        {formatCurrency(
                          payslip.deductions.tax + payslip.deductions.pf
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-xs font-bold text-foreground">
                        {formatCurrency(payslip.netPay)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold py-0.5 px-2",
                            payslip.paymentStatus === "Paid"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          )}
                        >
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
                              onClick={() =>
                                handleOpenBonus(payslip.employeeEmail)
                              }
                            >
                              <Gift className="h-3 w-3" />
                              Bonus
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: PF & BENEFITS                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="pf" className="space-y-6 outline-none">
          {/* PF Ledger */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold">
                Provident Fund Ledger &amp; Reserves
              </CardTitle>
              <CardDescription className="text-xs">
                Tracking of statutory retirement reserves. Employee{" "}
                {empPfRate}% + Employer {employerPfRate}% matching.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Employee
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Basic Salary
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Employee Share ({empPfRate}%)
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Employer Match ({employerPfRate}%)
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Tenure
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                      Accrued PF Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollEmployees.map(
                    (emp: {
                      email: string
                      name: string
                      dept: string
                      joinDate: string
                      basicSalary: number
                    }) => {
                      const stats = getEmployeePfStats(emp)
                      return (
                        <TableRow
                          key={emp.email}
                          className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                        >
                          <TableCell className="py-3">
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {emp.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {emp.dept} · Joined {emp.joinDate}
                              </p>
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
                    }
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Festival Bonus Rules */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-primary" />
                Festival Bonus Rules
              </CardTitle>
              <CardDescription className="text-xs">
                Configured bonus eligibility based on service duration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {festivalBonusRules.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Min Service
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Max Service
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Bonus %
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Pro-Rata
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Description
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {festivalBonusRules.map((rule) => (
                      <TableRow
                        key={rule.id}
                        className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="py-3 text-xs font-semibold">
                          {rule.minServiceMonths} months
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {rule.maxServiceMonths} months
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">
                          {rule.bonusPercentage}%
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-bold py-0.5 px-2",
                              rule.isProRata
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {rule.isProRata ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {rule.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold">
                    No festival bonus rules configured
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disbursement Logs */}
          <Card className="shadow-none border-border/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" />
                Salary Disbursement Transactions
              </CardTitle>
              <CardDescription className="text-xs">
                Audit history of completed monthly payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {disbursements.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Month
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Date
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Method
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Reference
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Employees
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                        Total Disbursed
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.map((rec) => (
                      <TableRow
                        key={`${rec.monthKey}-${rec.referenceId}`}
                        className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                      >
                        <TableCell className="py-3 text-xs font-semibold">
                          {rec.monthKey}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {rec.disbursementDate}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold"
                          >
                            {rec.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono text-muted-foreground">
                          {rec.referenceId}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">
                          {rec.employeeCount} officers
                        </TableCell>
                        <TableCell className="py-3 text-xs font-bold text-emerald-600">
                          {formatCurrency(rec.totalDisbursed)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold">
                    No disbursement records yet
                  </p>
                  <p className="text-xs">
                    Process and execute payouts to log them here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Assign/Edit Salary Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              {salaryByEmployee.has(assignEmployeeId)
                ? "Edit Employee Salary"
                : "Assign Employee Salary"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure the salary structure, PF deductions, and festival bonus
              eligibility.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Employee info */}
            {assignEmployeeId && (
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs font-semibold">
                  {employees.find((e) => e.id === assignEmployeeId)
                    ?.fullNameEnglish || ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {employees.find((e) => e.id === assignEmployeeId)
                    ?.designationName || ""}{" "}
                  ·{" "}
                  {employees.find((e) => e.id === assignEmployeeId)
                    ?.departmentName || ""}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Basic Salary */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Basic Salary (৳)
                </Label>
                <Input
                  type="number"
                  value={assignBasicSalary || ""}
                  onChange={(e) =>
                    setAssignBasicSalary(Number(e.target.value))
                  }
                  placeholder="e.g. 65000"
                  className="text-xs"
                />
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Salary Template
                </Label>
                <Select
                  value={assignTemplateId || "none"}
                  onValueChange={(val) =>
                    setAssignTemplateId(val === "none" ? "" : val)
                  }
                >
                  <SelectTrigger className="text-xs bg-transparent border-border/60">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {templates
                      .filter((t) => t.isActive)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template preview */}
            {selectedTemplate && (
              <div className="p-3 rounded-lg border border-border/30 bg-muted/10 space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Template Components Preview
                </p>
                <div className="grid gap-1">
                  {selectedTemplate.components.map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            comp.type === "earning"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          )}
                        />
                        <span>{comp.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {comp.calculationType === "percentage"
                          ? `${comp.value}%`
                          : formatCurrency(comp.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkboxes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pf-applicable"
                  checked={assignPfApplicable}
                  onCheckedChange={(checked) =>
                    setAssignPfApplicable(checked === true)
                  }
                />
                <Label
                  htmlFor="pf-applicable"
                  className="text-xs font-medium cursor-pointer"
                >
                  PF Applicable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="festival-bonus"
                  checked={assignFestivalBonus}
                  onCheckedChange={(checked) =>
                    setAssignFestivalBonus(checked === true)
                  }
                />
                <Label
                  htmlFor="festival-bonus"
                  className="text-xs font-medium cursor-pointer"
                >
                  Festival Bonus Applicable
                </Label>
              </div>
            </div>

            {/* Effective Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Effective Date
              </Label>
              <Input
                type="date"
                value={assignEffectiveDate}
                onChange={(e) => setAssignEffectiveDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (Optional)</Label>
              <Input
                placeholder="e.g. Initial hiring salary, Performance revision..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Salary Preview */}
            {salaryPreview && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  Salary Breakdown Preview
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Gross
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(salaryPreview.gross)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Deductions
                    </p>
                    <p className="text-sm font-bold text-rose-500">
                      -{formatCurrency(salaryPreview.deductions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Net Pay
                    </p>
                    <p className="text-sm font-extrabold text-primary">
                      {formatCurrency(salaryPreview.net)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAssign}
              disabled={assignSalaryMutation.isPending}
              className="text-xs"
            >
              {assignSalaryMutation.isPending
                ? "Saving..."
                : salaryByEmployee.has(assignEmployeeId)
                ? "Update Salary"
                : "Assign Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {editingTemplateId ? "Edit Template" : "Create Salary Template"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the earning and deduction components for this salary
              structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard Full-Time Package"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Optional description"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Components */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Salary Components
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={addComponent}
                >
                  <Plus className="h-3 w-3" />
                  Add Component
                </Button>
              </div>

              {templateComponents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No components. Click "Add Component" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {templateComponents.map((comp, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_100px_100px_80px_32px] gap-2 items-end p-3 rounded-lg border border-border/30 bg-muted/10"
                    >
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Name
                        </Label>
                        <Input
                          value={comp.name}
                          onChange={(e) =>
                            updateComponent(idx, "name", e.target.value)
                          }
                          placeholder="Component name"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Type
                        </Label>
                        <select
                          value={comp.type}
                          onChange={(e) =>
                            updateComponent(idx, "type", e.target.value)
                          }
                          className="w-full bg-background border border-border/60 text-xs h-8 rounded-md px-2"
                        >
                          <option value="earning">Earning</option>
                          <option value="deduction">Deduction</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Calc
                        </Label>
                        <select
                          value={comp.calculationType}
                          onChange={(e) =>
                            updateComponent(
                              idx,
                              "calculationType",
                              e.target.value
                            )
                          }
                          className="w-full bg-background border border-border/60 text-xs h-8 rounded-md px-2"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Value
                        </Label>
                        <Input
                          type="number"
                          value={comp.value || ""}
                          onChange={(e) =>
                            updateComponent(
                              idx,
                              "value",
                              Number(e.target.value)
                            )
                          }
                          className="text-xs h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => removeComponent(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTemplate}
              disabled={
                createTemplateMutation.isPending ||
                updateTemplateMutation.isPending
              }
              className="text-xs"
            >
              {createTemplateMutation.isPending ||
              updateTemplateMutation.isPending
                ? "Saving..."
                : editingTemplateId
                ? "Update Template"
                : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Bonus Dialog */}
      <Dialog open={isBonusOpen} onOpenChange={setIsBonusOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Configure Special Bonus
            </DialogTitle>
            <DialogDescription className="text-xs">
              Allocate performance or festival incentives for this employee's
              draft payslip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Bonus Amount (৳)
              </Label>
              <Input
                type="number"
                value={bonusVal}
                onChange={(e) => setBonusVal(Number(e.target.value))}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Reason / Description
              </Label>
              <Input
                placeholder="e.g. Q2 Performance Bonus, Festival Incentive"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBonusOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveBonus} className="text-xs">
              Save Allocation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Disbursement Dialog */}
      <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Distribute &amp; Disburse Salaries
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure payout distribution parameters to mark ledger as PAID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Distribution Method
              </Label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full bg-background border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                <option value="Bank Transfer">
                  Bank Transfer (EFT/Wire)
                </option>
                <option value="Mobile Wallet">
                  Mobile Wallet (bKash/Nagad)
                </option>
                <option value="Cash Payment">Cash Payment</option>
                <option value="Corporate Cheque">Corporate Cheque</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Disbursement Date
              </Label>
              <Input
                type="date"
                value={payoutDate}
                onChange={(e) => setPayoutDate(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Transaction Reference / Voucher ID
              </Label>
              <Input
                placeholder="e.g. TXN98724128"
                value={payoutRef}
                onChange={(e) => setPayoutRef(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDisburseOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteDisbursement}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            >
              Execute Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip View Dialog */}
      <Dialog
        open={viewPayslip !== null}
        onOpenChange={() => setViewPayslip(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          {viewPayslip && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Pay Slip Ledger</span>
                  <span className="text-[10px] text-muted-foreground mr-4">
                    Period: {selectedMonth}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Sadoshima Global Corp
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 border-t border-b border-border/40 py-4 text-xs">
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Employee Name
                    </p>
                    <p className="font-semibold mt-0.5">{viewPayslip.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Designation &amp; Department
                    </p>
                    <p className="font-semibold mt-0.5">
                      {viewPayslip.role} ({viewPayslip.dept})
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">
                      Earnings
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.basicSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>HRA (20%):</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.allowances.hra)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transport (10%):</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.allowances.transport)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medical (5%):</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.allowances.medical)}
                        </span>
                      </div>
                      {viewPayslip.bonus > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>
                            Bonus ({viewPayslip.bonusDescription}):
                          </span>
                          <span>
                            {formatCurrency(viewPayslip.bonus)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">
                      Deductions
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Income Tax (12%):</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.deductions.tax)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>PF ({empPfRate}%):</span>
                        <span className="font-semibold">
                          {formatCurrency(viewPayslip.deductions.pf)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {viewPayslip.paymentStatus === "Paid" && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wide">
                      Payout Disbursement Info
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          Date:
                        </span>{" "}
                        {viewPayslip.paymentDate}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">
                          Method:
                        </span>{" "}
                        {viewPayslip.paymentMethod}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-foreground">
                          Reference:
                        </span>{" "}
                        <span className="font-mono">
                          {viewPayslip.paymentReference}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t border-border/40 flex justify-between items-center text-sm">
                  <span className="font-bold text-foreground">
                    Net Pay Distribution:
                  </span>
                  <span className="text-xl font-extrabold text-primary">
                    {formatCurrency(viewPayslip.netPay)}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewPayslip(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => window.print()}
                >
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
