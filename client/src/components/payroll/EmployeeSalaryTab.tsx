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
import { Plus, Pencil, Search, Calculator, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { toast } from "sonner"
import type { SalaryTemplate, EmployeeSalary } from "@/types"

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
}: EmployeeSalaryTabProps) {
  const [searchQuery, setSearchQuery] = useState("")

  // Assign Salary Dialog State
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

  return (
    <div className="space-y-4">
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
              {salariesLoading || employeesDataLoading ? (
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
    </div>
  )
}
