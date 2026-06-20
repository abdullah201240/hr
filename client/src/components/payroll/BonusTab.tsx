import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Gift, CalendarDays, AlertTriangle, ShieldCheck, ShieldAlert, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EmployeeSalary, FestivalBonusRule, Employee } from "@/types"
import { exportToCsv } from "@/lib/export"

interface BonusTabProps {
  festivalBonusRules: FestivalBonusRule[]
  employees: Employee[]
  employeeSalaries: EmployeeSalary[]
  formatCurrency: (val: number) => string
  monthsOptions: Array<{ key: string; label: string }>
}

const getTenureMonths = (joinDateStr: string | null | undefined, targetMonthKey: string) => {
  if (!joinDateStr) return 0
  const joinDate = new Date(joinDateStr)
  if (isNaN(joinDate.getTime())) return 0
  const [targetYear, targetMonth] = targetMonthKey.split("-").map(Number)
  const joinYear = joinDate.getFullYear()
  const joinMonth = joinDate.getMonth() + 1 // 1-indexed
  const diffMonths = (targetYear - joinYear) * 12 + (targetMonth - joinMonth)
  return Math.max(0, diffMonths)
}

export default function BonusTab({
  festivalBonusRules,
  employees,
  employeeSalaries,
  formatCurrency,
  monthsOptions,
}: BonusTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => monthsOptions[0]?.key || "2026-06")

  // Map employee salaries by employee ID
  const salariesMap = useMemo(() => {
    return new Map<string, EmployeeSalary>(employeeSalaries.map(s => [s.employeeId, s]))
  }, [employeeSalaries])

  // Calculate dynamic list of bonuses
  const bonusList = useMemo(() => {
    return employees.map((emp) => {
      const salary = salariesMap.get(emp.id)
      const basic = salary?.basicSalary || 0
      const isEligible = salary?.festivalBonusApplicable ?? false
      const tenureMonths = getTenureMonths(emp.joinDate, selectedMonth)

      let bonusAmount = 0
      let matchedRule: FestivalBonusRule | undefined = undefined
      let status: "eligible" | "nomatch" | "ineligible" = "ineligible"
      let description = "Festival Bonus (Not applicable)"
      let ruleInfo = "—"

      if (isEligible) {
        matchedRule = festivalBonusRules.find(
          (r) => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths
        )

        if (matchedRule) {
          status = "eligible"
          const pct = matchedRule.bonusPercentage
          ruleInfo = `${pct}%${matchedRule.isProRata ? " Pro-Rata" : ""}`
          if (matchedRule.isProRata) {
            bonusAmount = Math.round(basic * (pct / 100) * Math.min(1, tenureMonths / 12))
            description = `${matchedRule.description || "Festival Bonus"} (${pct}% Pro-Rata)`
          } else {
            bonusAmount = Math.round(basic * (pct / 100))
            description = `${matchedRule.description || "Festival Bonus"} (${pct}%)`
          }
        } else {
          status = "nomatch"
          bonusAmount = 0
          ruleInfo = "No matching rule"
          if (festivalBonusRules.length > 0) {
            const minRequired = Math.min(...festivalBonusRules.map((r) => r.minServiceMonths))
            if (tenureMonths < minRequired) {
              description = `Tenure of ${tenureMonths}m is below minimum required ${minRequired}m.`
            } else {
              description = `Tenure of ${tenureMonths}m does not match configured ranges.`
            }
          } else {
            description = "No rules configured in system."
          }
        }
      }

      return {
        employee: emp,
        basic,
        tenureMonths,
        isEligible,
        matchedRule,
        bonusAmount,
        status,
        description,
        ruleInfo,
      }
    })
  }, [employees, salariesMap, festivalBonusRules, selectedMonth])

  const exportPolicyRules = () => {
    const headers = ["Min Service Months", "Max Service Months", "Bonus Percentage", "Pro-Rata Scaling", "Description"]
    const rows = festivalBonusRules.map((rule) => [
      rule.minServiceMonths,
      rule.maxServiceMonths,
      rule.bonusPercentage,
      rule.isProRata ? "Enabled" : "Disabled",
      rule.description || ""
    ])
    exportToCsv("FestivalBonusPolicyRules", headers, rows)
  }

  const exportEligibilityLedger = () => {
    const headers = [
      "Employee Name",
      "Department",
      "Designation",
      "Basic Salary",
      "Join Date",
      "Tenure Months",
      "Eligibility Status",
      "Matched Rule",
      "Computed Bonus",
      "Alert/Description"
    ]
    const rows = bonusList.map((item) => [
      item.employee.fullNameEnglish,
      item.employee.departmentName || "",
      item.employee.designationName || "",
      item.basic,
      item.employee.joinDate || "",
      item.tenureMonths,
      item.status,
      item.ruleInfo,
      item.bonusAmount,
      item.description
    ])
    exportToCsv(`BonusEligibility-${selectedMonth}`, headers, rows)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Policy Rules Overview */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Gift className="h-4 w-4 text-primary" />
              Festival Bonus Policy Rules
            </CardTitle>
            <CardDescription className="text-xs">
              System-wide rules that determine festival bonus eligibility and percentages by service tenure.
            </CardDescription>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportPolicyRules}
              disabled={festivalBonusRules.length === 0}
              className="gap-1 text-xs h-9"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
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
                    Pro-Rata Scaling
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
                        {rule.isProRata ? "Enabled" : "Disabled"}
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
            <div className="p-8 text-center text-muted-foreground">
              <Gift className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-semibold">No festival bonus rules configured in Settings.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dynamic Ledger */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              Employee Bonus Eligibility Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Live calculation of festival bonuses showing matched policies and warnings for the selected cycle.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportEligibilityLedger}
              disabled={bonusList.length === 0}
              className="gap-1 text-xs h-9"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
            >
              {monthsOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
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
                  Join Date
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Tenure
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Eligibility Status
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Matched Rule
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Computed Bonus
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Formula / Alert Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bonusList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                    No employees found.
                  </TableCell>
                </TableRow>
              ) : (
                bonusList.map((item) => (
                  <TableRow
                    key={item.employee.id}
                    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {item.employee.fullNameEnglish}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {item.employee.designationName || "Staff"} · {item.employee.departmentName || "Management"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-muted-foreground">
                      {item.basic > 0 ? formatCurrency(item.basic) : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {item.employee.joinDate || "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center font-medium">
                      {item.tenureMonths} months
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {item.status === "eligible" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-bold py-0.5 px-2">
                          <ShieldCheck className="h-3 w-3 shrink-0 mr-1" />
                          Qualified
                        </Badge>
                      ) : item.status === "nomatch" ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-bold py-0.5 px-2">
                          <AlertTriangle className="h-3 w-3 shrink-0 mr-1" />
                          No Match
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground text-[9px] font-bold py-0.5 px-2">
                          <ShieldAlert className="h-3 w-3 shrink-0 mr-1" />
                          Not Eligible
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-medium text-muted-foreground">
                      {item.ruleInfo}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-bold text-foreground">
                      {item.bonusAmount > 0 ? formatCurrency(item.bonusAmount) : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {item.status === "nomatch" ? (
                        <span className="text-amber-600 font-medium">{item.description}</span>
                      ) : (
                        item.description
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
