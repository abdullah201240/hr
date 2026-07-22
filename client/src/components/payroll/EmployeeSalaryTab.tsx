import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Pencil, Search, Calculator, Calendar, FileSpreadsheet, History, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { toast } from "sonner"
import type { SalaryTemplate, EmployeeSalary } from "@/types/salary"
import { exportToCsv } from "@/lib/export"
import { useEmployeeSalaryHistoryQuery, useBulkSalaryRevisionMutation } from "@/hooks/useSalary"

interface EmployeeSalaryTabProps {
  templates: SalaryTemplate[]
  employeeSalaries: EmployeeSalary[]
  employees: any[]
  salariesLoading: boolean
  employeesDataLoading: boolean
  assignSalaryMutation: any
  pfSettings: any
  formatCurrency: (val: number) => string
  getInitials: (name: string) => string

  salaryPage: number
  setSalaryPage: (page: number) => void
  salaryLimit: number
  setSalaryLimit: (limit: number) => void
  salarySearch: string
  setSalarySearch: (search: string) => void
  salaryDeptId: string
  setSalaryDeptId: (deptId: string) => void
  salaryTemplateId: string
  setSalaryTemplateId: (templateId: string) => void
  salariesMeta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  departmentOptions: Array<{ id: string; name: string }>
}

export default function EmployeeSalaryTab({
  templates,
  employeeSalaries,
  employees,
  salariesLoading,
  employeesDataLoading,
  assignSalaryMutation,
  pfSettings,
  formatCurrency,
  getInitials,

  salaryPage,
  setSalaryPage,
  salaryLimit,
  setSalaryLimit,
  salarySearch,
  setSalarySearch,
  salaryDeptId,
  setSalaryDeptId,
  salaryTemplateId,
  setSalaryTemplateId,
  salariesMeta,
  departmentOptions,
}: EmployeeSalaryTabProps) {
  // Assign Salary Dialog State
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assignEmployeeId, setAssignEmployeeId] = useState("")
  const [selectedNewEmpId, setSelectedNewEmpId] = useState("")
  const [assignBasicSalary, setAssignBasicSalary] = useState(0)
  const [assignTemplateId, setAssignTemplateId] = useState("")
  const [assignPfApplicable, setAssignPfApplicable] = useState(true)
  const [assignEffectiveDate, setAssignEffectiveDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [assignNotes, setAssignNotes] = useState("")

  // Bulk Revision & History Modals State
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [historyEmpId, setHistoryEmpId] = useState("")
  const [historyEmpName, setHistoryEmpName] = useState("")

  // Calculate preview salary breakdown for assign dialog
  const selectedTemplate = templates.find((t) => t.id === assignTemplateId)

  const salaryPreview = useMemo(() => {
    if (assignBasicSalary <= 0) return null
    const basic = assignBasicSalary
    let totalEarnings = basic
    let totalDeductions = 0
    let hasPfInTemplate = false

    if (selectedTemplate) {
      selectedTemplate.components.forEach((comp) => {
        const amount =
          comp.calculationType === "percentage"
            ? Math.round(basic * (comp.value / 100))
            : comp.value
        if (comp.type === "earning") {
          totalEarnings += amount
        } else {
          totalDeductions += amount
          const nameLower = comp.name.toLowerCase()
          if (nameLower.includes("pf") || nameLower.includes("provident")) {
            hasPfInTemplate = true
          }
        }
      })
    }

    // PF deduction if applicable and not already explicitly configured in template components
    if (assignPfApplicable && !hasPfInTemplate && pfSettings) {
      const pfRate = Number((pfSettings as any).employeeContributionRate) || 10
      totalDeductions += Math.round(basic * (pfRate / 100))
    }

    return {
      gross: totalEarnings,
      deductions: totalDeductions,
      net: totalEarnings - totalDeductions,
    }
  }, [assignBasicSalary, selectedTemplate, assignPfApplicable, pfSettings])

  const handleOpenAssign = (employeeId: string, salaryRecord?: EmployeeSalary) => {
    setAssignEmployeeId(employeeId)
    setSelectedNewEmpId("")
    setAssignBasicSalary(salaryRecord?.basicSalary || 0)
    setAssignTemplateId(salaryRecord?.templateId || "")
    setAssignPfApplicable(salaryRecord?.pfApplicable ?? true)
    setAssignEffectiveDate(
      salaryRecord?.effectiveDate || new Date().toISOString().split("T")[0]
    )
    setAssignNotes(salaryRecord?.notes || "")
    setIsAssignOpen(true)
  }

  const handleSaveAssign = () => {
    const targetEmpId = assignEmployeeId || selectedNewEmpId
    if (!targetEmpId) {
      toast.error("Please select an employee")
      return
    }
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
        employeeId: targetEmpId,
        templateId: assignTemplateId || undefined,
        basicSalary: assignBasicSalary,
        effectiveDate: assignEffectiveDate,
        pfApplicable: assignPfApplicable,
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

  const handleExport = () => {
    const headers = [
      "Employee Name",
      "Employee ID",
      "Department",
      "Designation",
      "Basic Salary",
      "Template Name",
      "PF Applicable",
      "Effective Date",
      "Status"
    ]
    const rows = employeeSalaries.map((s) => [
      s.employeeName || "",
      s.employeeEmployeeId || "",
      s.departmentName || "",
      s.designationName || "",
      s.basicSalary,
      s.templateName || "No Template",
      s.pfApplicable ? "Yes" : "No",
      s.effectiveDate,
      s.status
    ])
    exportToCsv("EmployeeSalaryDirectory", headers, rows)
  }

  const openHistory = (employeeId: string, name: string) => {
    setHistoryEmpId(employeeId)
    setHistoryEmpName(name)
    setIsHistoryOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-bold">
                Employee Salary Directory
              </CardTitle>
              <CardDescription className="text-xs">
                Assign basic salaries, select templates, configure PF, and set effective dates.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAssign("")}
                className="gap-1 text-xs h-9"
              >
                <Plus className="h-3.5 w-3.5" />
                Assign Salary
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkOpen(true)}
                className="gap-1 text-xs h-9"
              >
                Batch Operations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={employeeSalaries.length === 0}
                className="gap-1 text-xs h-9"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-9 text-xs bg-transparent border-border/60 h-9"
                value={salarySearch}
                onChange={(e) => setSalarySearch(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={salaryDeptId}
                onChange={(e) => {
                  setSalaryDeptId(e.target.value)
                  setSalaryPage(1)
                }}
                className="w-full bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                <option value="">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Template Filter */}
            <div>
              <select
                value={salaryTemplateId}
                onChange={(e) => {
                  setSalaryTemplateId(e.target.value)
                  setSalaryPage(1)
                }}
                className="w-full bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
              >
                <option value="">All Templates</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground shrink-0">Show:</span>
              <select
                value={salaryLimit}
                onChange={(e) => {
                  setSalaryLimit(Number(e.target.value))
                  setSalaryPage(1)
                }}
                className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2 w-16"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
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
                  Effective Date
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
              {salariesLoading || employeesDataLoading ? (
                <TableRow>
	                  <TableCell colSpan={8} className="h-48 text-center border-b-0">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">
                        Loading salary records...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : employeeSalaries.length === 0 ? (
                <TableRow>
	                  <TableCell colSpan={8} className="h-32 text-center border-b-0">
                    <p className="text-sm text-muted-foreground">
                      No configured employee salaries found matching these filters.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                employeeSalaries.map((salary) => {
                  return (
                    <TableRow
                      key={salary.id}
                      className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {salary.employeePhotoUrl ? (
                              <img
                                src={salary.employeePhotoUrl}
                                alt={salary.employeeName}
                                className="object-cover h-full w-full"
                              />
                            ) : (
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                {getInitials(salary.employeeName || "")}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold text-foreground">
                              {salary.employeeName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {salary.employeeEmployeeId} · {salary.designationName || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold"
                        >
                          {salary.departmentName || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-bold text-foreground">
                        {formatCurrency(salary.basicSalary)}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {salary.templateName || (
                          <span className="text-muted-foreground/50 italic">
                            No template
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
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
                      </TableCell>
	                      <TableCell className="py-3 text-xs text-muted-foreground">
                        {salary.effectiveDate}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-bold py-0.5 px-2",
                            salary.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {salary.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 text-muted-foreground hover:text-primary"
                            onClick={() => openHistory(salary.employeeId, salary.employeeName || "")}
                            title="View Revision History"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] gap-1 px-2.5"
                            onClick={() => handleOpenAssign(salary.employeeId, salary)}
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {salariesMeta && salariesMeta.totalPages > 1 && (
            <div className="p-3 border-t border-border/30 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Showing page {salariesMeta.page} of {salariesMeta.totalPages} ({salariesMeta.total} records)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSalaryPage(Math.max(1, salaryPage - 1))}
                  disabled={salaryPage === 1}
                  className="h-8 text-[10px]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSalaryPage(Math.min(salariesMeta.totalPages, salaryPage + 1))}
                  disabled={salaryPage === salariesMeta.totalPages}
                  className="h-8 text-[10px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign/Edit Salary Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              {assignEmployeeId ? "Edit Employee Salary" : "Assign Employee Salary"}
            </DialogTitle>
            <DialogDescription className="text-xs">
	              Configure the salary structure, PF deductions, and effective date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Employee info/select */}
            {assignEmployeeId ? (
              <div className="p-3 bg-muted/20 rounded-lg">
                <p className="text-xs font-semibold">
                  {employees.find((e) => e.id === assignEmployeeId)
                    ?.fullNameEnglish || employeeSalaries.find((s) => s.employeeId === assignEmployeeId)?.employeeName || ""}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {employees.find((e) => e.id === assignEmployeeId)
                    ?.designationName || ""} · {employees.find((e) => e.id === assignEmployeeId)
                    ?.departmentName || ""}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Employee</Label>
                <select
                  value={selectedNewEmpId}
                  onChange={(e) => setSelectedNewEmpId(e.target.value)}
                  className="w-full bg-transparent border border-border/60 text-xs h-9 rounded-md px-2"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullNameEnglish} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            )}

	            <div className="grid grid-cols-1 gap-4">
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
                  className="text-xs h-9"
                />
              </div>

              {/* Template Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Salary Template
                </Label>
                <Select
                  value={assignTemplateId || "none"}
                  onOpenChange={() => {}}
                  onValueChange={(val) =>
                    setAssignTemplateId(val === "none" ? "" : val)
                  }
                >
                  <SelectTrigger className="text-xs bg-transparent border-border/60 h-9">
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
                className="text-xs h-9"
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
                : assignEmployeeId
                ? "Update Salary"
                : "Assign Salary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary history dialog */}
      <SalaryHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        employeeId={historyEmpId}
        employeeName={historyEmpName}
        formatCurrency={formatCurrency}
      />

      {/* Bulk raises dialog */}
      <BulkSalaryRevisionDialog
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        departmentOptions={departmentOptions}
        templates={templates}
      />
    </div>
  )
}

// ─── Timeline History Dialog ───
interface SalaryHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string
  employeeName: string
  formatCurrency: (val: number) => string
}

function SalaryHistoryDialog({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  formatCurrency,
}: SalaryHistoryDialogProps) {
  const { data: history = [], isLoading } = useEmployeeSalaryHistoryQuery(employeeId)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Salary Progression Timeline</DialogTitle>
          <DialogDescription className="text-[11px]">
            Historical progression and salary updates for {employeeName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading salary history...</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">No historical revisions found.</p>
          ) : (
            <div className="relative border-l border-border/80 pl-5 ml-3 space-y-4">
              {history.map((record) => (
                <div key={record.id} className="relative">
                  <div
                    className={cn(
                      "absolute -left-[26px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center",
                      record.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/30"
                    )}
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-sm">
                        {formatCurrency(record.basicSalary)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Eff: {record.effectiveDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[8px] font-bold px-1.5 py-0">
                        {record.templateName || "No Template"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[8px] font-bold px-1.5 py-0",
                          record.status === "active" ? "bg-emerald-500/15 text-emerald-600 border-none" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {record.status}
                      </Badge>
                    </div>
                    {record.notes && (
                      <p className="text-[10px] text-muted-foreground italic mt-1">
                        "{record.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Bulk Raise Dialog ───
interface BulkSalaryRevisionDialogProps {
  isOpen: boolean
  onClose: () => void
  departmentOptions: Array<{ id: string; name: string }>
  templates: SalaryTemplate[]
}

function BulkSalaryRevisionDialog({
  isOpen,
  onClose,
  departmentOptions,
  templates,
}: BulkSalaryRevisionDialogProps) {
  const [departmentId, setDepartmentId] = useState("all")
  const [templateId, setTemplateId] = useState("all")
  const [percentageIncrease, setPercentageIncrease] = useState(0)
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  const bulkRevisionMutation = useBulkSalaryRevisionMutation()

  const handleApply = () => {
    if (percentageIncrease <= 0) {
      toast.error("Please enter a valid raise percentage")
      return
    }
    if (!effectiveDate) {
      toast.error("Please select an effective date")
      return
    }

    bulkRevisionMutation.mutate(
      {
        departmentId: departmentId === "all" ? undefined : departmentId,
        templateId: templateId === "all" ? undefined : templateId,
        percentageIncrease,
        effectiveDate,
        notes,
      },
      {
        onSuccess: () => {
          onClose()
          Swal.fire({
            title: "Bulk Revision Queued!",
            text: "The department raises are being processed in the background. Check backend console / dashboard for job progress.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary text-primary-foreground px-4 py-2 font-semibold rounded-md",
            },
          })
        },
        onError: (err: any) => {
          toast.error(err?.message || "Failed to trigger bulk revision")
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] text-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold">Batch Salary Revision</DialogTitle>
          <DialogDescription className="text-xs">
            Queue a percentage basic salary raise for matching employees in the background.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Filter Department</Label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-transparent border border-border/60 text-xs h-9 rounded-md px-2"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Filter Template</Label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-transparent border border-border/60 text-xs h-9 rounded-md px-2"
              >
                <option value="all">All Templates</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Raise Percentage (%)</Label>
              <Input
                type="number"
                value={percentageIncrease || ""}
                onChange={(e) => setPercentageIncrease(Number(e.target.value))}
                placeholder="e.g. 10"
                className="text-xs h-9 bg-transparent border-border/60"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold">Effective Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="text-xs h-9 bg-transparent border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-semibold">Revision Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. FY 2026 Annual Increments"
              className="text-xs h-9 bg-transparent border-border/60"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={bulkRevisionMutation.isPending}
            className="text-xs"
          >
            {bulkRevisionMutation.isPending ? "Queuing..." : "Queue Raises"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
