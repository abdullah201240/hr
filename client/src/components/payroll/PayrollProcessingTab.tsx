import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  CheckCircle,
  CreditCard,
  Printer,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"

import { useRangeAttendanceQuery } from "@/hooks/useAttendance"
import type { DailyAttendanceLog } from "@/hooks/useAttendance"
import { useLeaveApplicationsQuery } from "@/hooks/useLeaveApplications"
import { useAttendanceSettingsQuery, useHolidaysQuery } from "@/hooks/useAttendanceSettings"
import type { SalaryTemplate, EmployeeSalary, Payslip, PayrollCycle, DisbursementRecord, FestivalBonusRule, ProvidentFundSettings, Employee, LeaveApplication } from "@/types"

interface PayrollProcessingTabProps {
  payrolls: PayrollCycle[]
  savePayrolls: (updatedPayrolls: PayrollCycle[]) => void
  disbursements: DisbursementRecord[]
  saveDisbursements: (updatedRecords: DisbursementRecord[]) => void
  pfSettings: ProvidentFundSettings | null | undefined
  formatCurrency: (val: number) => string
  templates: SalaryTemplate[]
  employeeSalaries: EmployeeSalary[]
  employees: Employee[]
  isLoading: boolean
  festivalBonusRules: FestivalBonusRule[]
}

// Date helpers
const getMonthDateRange = (monthKey: string, fromDay = 1, toDay?: number) => {
  const [year, month] = monthKey.split("-").map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const effectiveToDay = Math.min(toDay ?? daysInMonth, daysInMonth)
  const effectiveFromDay = Math.max(fromDay, 1)
  const startDateStr = `${year}-${String(month).padStart(2, "0")}-${String(effectiveFromDay).padStart(2, "0")}`
  const endDateStr   = `${year}-${String(month).padStart(2, "0")}-${String(effectiveToDay).padStart(2, "0")}`
  return { startDateStr, endDateStr, daysInMonth, effectiveFromDay, effectiveToDay }
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

export default function PayrollProcessingTab({
  payrolls,
  savePayrolls,
  disbursements,
  saveDisbursements,
  pfSettings,
  formatCurrency,
  templates,
  employeeSalaries,
  employees,
  isLoading: parentLoading,
  festivalBonusRules,
}: PayrollProcessingTabProps) {
  const [selectedMonth, setSelectedMonth] = useState("2026-06")
  const [salaryMode, setSalaryMode] = useState<"full" | "partial">("full")
  const [partialFromDay, setPartialFromDay] = useState(1)
  const [partialToDay, setPartialToDay]   = useState(30)

  const { startDateStr, endDateStr, daysInMonth, effectiveFromDay, effectiveToDay } = useMemo(() => {
    if (salaryMode === "partial") {
      return getMonthDateRange(selectedMonth, partialFromDay, partialToDay)
    }
    return getMonthDateRange(selectedMonth)
  }, [selectedMonth, salaryMode, partialFromDay, partialToDay])

  // Fetch API dependencies
  const { data: attendancePage, isLoading: attendanceLoading } = useRangeAttendanceQuery(startDateStr, endDateStr, 1000)
  const { data: leavesPage, isLoading: leavesLoading } = useLeaveApplicationsQuery({ page: 1, limit: 100, status: "Approved" })
  const { data: attendanceSettings, isLoading: settingsLoading } = useAttendanceSettingsQuery()
  const { data: holidays = [], isLoading: holidaysLoading } = useHolidaysQuery()

  // PF settings Rates
  const empPfRate = pfSettings ? Number(pfSettings.employeeContributionRate) : 10

  const attendanceLogs = useMemo(() => attendancePage?.data || [], [attendancePage])
  const leaves = useMemo(() => leavesPage?.data || [], [leavesPage])

  // Check if any API query is loading
  const isLoading = parentLoading || attendanceLoading || leavesLoading || settingsLoading || holidaysLoading

  // Setup weekly holiday lookup
  const weeklyHolidays = useMemo(() => {
    if (attendanceSettings?.weeklyHolidays) {
      return attendanceSettings.weeklyHolidays.map(d => d.toLowerCase())
    }
    return ["friday", "saturday"]
  }, [attendanceSettings])

  // Map employee salaries by employee ID
  const salariesMap = useMemo(() => {
    const map = new Map<string, EmployeeSalary>()
    employeeSalaries.forEach(s => {
      if (s.status === "active") map.set(s.employeeId, s)
    })
    return map
  }, [employeeSalaries])

  // Match salary templates
  const templatesMap = useMemo(() => {
    return new Map<string, SalaryTemplate>(templates.map(t => [t.id, t]))
  }, [templates])

  // Calculation engine: compile payroll cycles dynamically
  const computedCycle = useMemo(() => {
    // If a completed/finalized cycle already exists in localStorage, return it
    const existing = payrolls.find(p => p.monthKey === selectedMonth)
    if (existing && existing.status !== "Draft") {
      return existing
    }

    const compiledPayslips = employees.map((emp): Payslip => {
      const salary = salariesMap.get(emp.id)
      const basic = salary?.basicSalary || 0
      const template = salary?.templateId ? templatesMap.get(salary.templateId) : null

      // Allowances & Deductions maps
      const allowances: Record<string, number> = {}
      const deductions: Record<string, number> = {}

      if (template) {
        template.components.forEach(comp => {
          const amount = comp.calculationType === "percentage"
            ? Math.round(basic * (comp.value / 100))
            : comp.value

          if (comp.type === "earning") {
            allowances[comp.name] = amount
          } else {
            deductions[comp.name] = amount
          }
        })
      }

      // Standard PF Contribution if applicable
      if (salary?.pfApplicable) {
        deductions["Provident Fund"] = Math.round(basic * (empPfRate / 100))
      }

      // Check attendance logs for LOP, leaves & movements
      let lopDays = 0
      let lateDays = 0
      let presentDays = 0
      let leaveDays = 0
      let movementDays = 0
      let travelDays = 0
      let earlyOutDays = 0

      // Map range check-ins by date
      const empLogs = attendanceLogs.filter(log => log.employeeId === emp.id)
      const empLogsMap = new Map<string, DailyAttendanceLog>(empLogs.map(log => {
        // Strip out timestamp if present to compare just YYYY-MM-DD
        const logDateStr = log.date.split("T")[0]
        return [logDateStr, log]
      }))

      // Filter leaves that apply to this employee and overlap this month
      const empLeaves = leaves.filter((l: LeaveApplication) => {
        const empMatch = l.employeeEmail === emp.email || l.employeeId === emp.id
        if (!empMatch) return false
        
        // Ensure overlap
        return !(l.endDate < startDateStr || l.startDate > endDateStr)
      })

      // Loop through every day of the selected month
      const [year, monthVal] = selectedMonth.split("-").map(Number)
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthVal).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        
        const dateObj = new Date(dateStr)
        const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
        const isWeekend = weeklyHolidays.includes(dayName)
        const isPublicHoliday = holidays.some(h => dateStr >= h.startDate && dateStr <= h.endDate)
        
        // Match attendance log
        const log = empLogsMap.get(dateStr)
        
        // Match leave applications
        const activeLeave = empLeaves.find(l => dateStr >= l.startDate && dateStr <= l.endDate)

        if (log) {
          presentDays++
          if (log.status?.toLowerCase() === "late") {
            lateDays++
          }
        } else if (activeLeave) {
          const typeName = activeLeave.leaveTypeName?.toLowerCase() || ""
          
          if (typeName.includes("early out")) {
            earlyOutDays++
          } else if (typeName.includes("movement")) {
            movementDays++
          } else if (typeName.includes("travel")) {
            travelDays++
          } else {
            leaveDays++
            if (activeLeave.leaveTypePaid === false) {
              lopDays++
            }
          }
        } else {
          // Weekend or holiday are paid off
          if (!isWeekend && !isPublicHoliday) {
            // Unexcused absence
            lopDays++
          }
        }
      }

      // Partial salary: scale basic by effective window vs full month
      const effectiveDays = effectiveToDay - effectiveFromDay + 1
      const partialBasic = salaryMode === "partial"
        ? Math.round(basic * (effectiveDays / daysInMonth))
        : basic

      // Calculate deductions (use effectiveDays as denominator for partial mode)
      const lopDeduction = partialBasic > 0 ? Math.round((partialBasic / effectiveDays) * lopDays) : 0
      
      // Every 3 late entries deducts 0.5 days of salary
      const latePenaltyDays = Math.floor(lateDays / 3) * 0.5
      const lateDeduction = partialBasic > 0 ? Math.round((partialBasic / effectiveDays) * latePenaltyDays) : 0

      if (lopDeduction > 0) deductions["Loss of Pay (LOP)"] = lopDeduction
      if (lateDeduction > 0) deductions["Late Entry Penalty"] = lateDeduction

      // Sum values
      const sumAllowances = Object.values(allowances).reduce((a, b) => a + b, 0)
      const sumDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)

      // Get bonus from existing draft if any exists
      const existingDraft = existing?.payslips.find(p => p.employeeEmail === emp.email)
      const specialBonus = existingDraft?.specialBonus ?? (existingDraft?.bonus !== undefined && existingDraft?.festivalBonus === undefined ? existingDraft.bonus : 0)
      const specialBonusDescription = existingDraft?.specialBonusDescription ?? (existingDraft?.bonusDescription !== undefined && existingDraft?.festivalBonus === undefined ? existingDraft.bonusDescription : "")

      // Dynamic festival bonus calculation
      let festivalBonus: number
      let festivalBonusDescription: string
      let bonusWarning = ""

      if (salary?.festivalBonusApplicable) {
        const tenureMonths = getTenureMonths(emp.joinDate, selectedMonth)
        const matchedRule = festivalBonusRules.find(
          r => tenureMonths >= r.minServiceMonths && tenureMonths <= r.maxServiceMonths
        )

        if (matchedRule) {
          const pct = matchedRule.bonusPercentage
          if (matchedRule.isProRata) {
            festivalBonus = Math.round(basic * (pct / 100) * Math.min(1, tenureMonths / 12))
            festivalBonusDescription = `${matchedRule.description || "Festival Bonus"} (${pct}% Pro-Rata)`
          } else {
            festivalBonus = Math.round(basic * (pct / 100))
            festivalBonusDescription = `${matchedRule.description || "Festival Bonus"} (${pct}%)`
          }
        } else {
          festivalBonus = 0
          festivalBonusDescription = "Festival Bonus (No matching rule)"
          if (festivalBonusRules && festivalBonusRules.length > 0) {
            const minRequired = Math.min(...festivalBonusRules.map(r => r.minServiceMonths))
            if (tenureMonths < minRequired) {
              bonusWarning = `Tenure of ${tenureMonths}m is below the minimum required ${minRequired}m for festival bonus.`
            } else {
              bonusWarning = `Tenure of ${tenureMonths}m does not match any configured festival bonus rule range.`
            }
          } else {
            bonusWarning = "No festival bonus rules configured in database."
          }
        }
      } else {
        festivalBonus = 0
        festivalBonusDescription = "Festival Bonus (Not applicable)"
      }

      const totalBonus = festivalBonus + specialBonus
      const netPay = (partialBasic + sumAllowances + totalBonus) - sumDeductions

      return {
        employeeEmail: emp.email,
        name: emp.fullNameEnglish,
        role: emp.designationName || "Staff",
        dept: emp.departmentName || "Management",
        basicSalary: partialBasic,
        allowances,
        deductions,
        bonus: totalBonus,
        bonusDescription: specialBonusDescription || festivalBonusDescription || "",
        netPay: Math.max(0, netPay),
        paymentStatus: existingDraft?.paymentStatus || "Unpaid",
        paymentMethod: existingDraft?.paymentMethod,
        paymentDate: existingDraft?.paymentDate,
        paymentReference: existingDraft?.paymentReference,
        lopDays,
        lopDeduction,
        lateDays,
        lateDeduction,
        presentDays,
        leaveDays,
        movementDays,
        travelDays,
        earlyOutDays,
        festivalBonus,
        specialBonus,
        festivalBonusDescription,
        specialBonusDescription,
        bonusWarning,
      }
    })

    return {
      monthKey: selectedMonth,
      status: existing?.status || "Draft",
      payslips: compiledPayslips,
    } as PayrollCycle
  }, [selectedMonth, salaryMode, effectiveFromDay, effectiveToDay, employees, salariesMap, templatesMap, payrolls, attendanceLogs, leaves, weeklyHolidays, holidays, daysInMonth, empPfRate, festivalBonusRules, startDateStr, endDateStr])

  // Count employees lacking salary setups
  const pendingConfigCount = useMemo(() => {
    return employees.filter(emp => !salariesMap.has(emp.id)).length
  }, [employees, salariesMap])

  // Audit detail view state
  const [auditEmployeeEmail, setAuditEmployeeEmail] = useState<string | null>(null)
  
  // Find current employee audited stats
  const auditDetails = useMemo(() => {
    if (!auditEmployeeEmail) return null
    const payslip = computedCycle.payslips.find(p => p.employeeEmail === auditEmployeeEmail)
    const emp = employees.find(e => e.email === auditEmployeeEmail)
    if (!payslip || !emp) return null

    // Generate daily logs mapping
    const empLogs = attendanceLogs.filter(log => log.employeeId === emp.id)
    const empLogsMap = new Map<string, DailyAttendanceLog>(empLogs.map(log => [log.date.split("T")[0], log]))
    
    const empLeaves = leaves.filter((l: LeaveApplication) => {
      const empMatch = l.employeeEmail === emp.email || l.employeeId === emp.id
      return empMatch && !(l.endDate < startDateStr || l.startDate > endDateStr)
    })

    // Create month calendar mapping
    const [year, monthVal] = selectedMonth.split("-").map(Number)
    const calendarDays = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthVal).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dateObj = new Date(dateStr)
      const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" })
      const isWeekend = weeklyHolidays.includes(dateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase())
      const isPublicHoliday = holidays.find(h => dateStr >= h.startDate && dateStr <= h.endDate)
      
      const log = empLogsMap.get(dateStr)
      const activeLeave = empLeaves.find(l => dateStr >= l.startDate && dateStr <= l.endDate)
      
      let dayStatus = "Absent"
      let badgeStyle = "bg-rose-500/10 text-rose-500 border-rose-500/20"
      
      if (log) {
        dayStatus = log.status || "Present"
        badgeStyle = dayStatus.toLowerCase() === "late" 
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      } else if (activeLeave) {
        dayStatus = activeLeave.leaveTypeName
        badgeStyle = activeLeave.leaveTypePaid === false 
          ? "bg-orange-500/15 text-orange-600 border-orange-500/30" 
          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
      } else if (isWeekend) {
        dayStatus = "Weekend"
        badgeStyle = "bg-muted text-muted-foreground"
      } else if (isPublicHoliday) {
        dayStatus = `Holiday: ${isPublicHoliday.name}`
        badgeStyle = "bg-purple-500/10 text-purple-600 border-purple-500/20"
      }

      calendarDays.push({
        dayNumber: day,
        dayName,
        dateStr,
        status: dayStatus,
        badgeStyle,
        checkIn: log?.checkIn || "—",
        checkOut: log?.checkOut || "—",
      })
    }

    return { payslip, calendarDays }
  }, [auditEmployeeEmail, computedCycle, employees, attendanceLogs, leaves, selectedMonth, daysInMonth, weeklyHolidays, holidays, startDateStr, endDateStr])

  // Modals view states
  const [viewPayslip, setViewPayslip] = useState<Payslip | null>(null)
  const [isDisburseOpen, setIsDisburseOpen] = useState(false)
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer")
  const [payoutDate, setPayoutDate] = useState("2026-06-30")
  const [payoutRef, setPayoutRef] = useState("")

  const handleRunPayroll = () => {
    if (pendingConfigCount > 0) {
      Swal.fire("Incomplete Setup", `Please assign salaries to all ${pendingConfigCount} pending employees before processing payroll.`, "warning")
      return
    }

    Swal.fire({
      title: "Lock and Process Payroll?",
      text: `Are you sure you want to finalize payroll registers for ${selectedMonth}? This locks the ledger.`,
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
        savePayrolls([...nextPayrolls, { ...computedCycle, status: "Processed" }])
        Swal.fire({
          title: "Payroll Processed!",
          text: `Payroll calculations for ${selectedMonth} have been successfully computed.`,
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
    const totalDisbursed = computedCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)
    const updatedPayslips = computedCycle.payslips.map((slip) => ({
      ...slip,
      paymentStatus: "Paid" as const,
      paymentMethod: payoutMethod,
      paymentDate: payoutDate,
      paymentReference: payoutRef.trim(),
    }))
    const nextPayrolls = payrolls.filter((p) => p.monthKey !== selectedMonth)
    savePayrolls([
      ...nextPayrolls,
      { ...computedCycle, status: "Distributed", payslips: updatedPayslips },
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
    saveDisbursements(updatedRecords)
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

  const totalNetPay = computedCycle.payslips.reduce((sum, p) => sum + p.netPay, 0)

  return (
    <div className="space-y-4">
      {/* Configuration Status Alert */}
      {pendingConfigCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>
            {pendingConfigCount} employee(s) do not have basic salaries assigned. You must complete their configuration in the <strong>Employee Salary</strong> tab before finalizing this month's payroll.
          </span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Monthly Payroll Processing</h3>
          <p className="text-xs text-muted-foreground">
            Calculate, finalize, and disburse monthly employee compensation based on attendance.
            {salaryMode === "partial" && (
              <span className="ml-1.5 font-bold text-violet-600">
                (Partial: Day {effectiveFromDay}–{effectiveToDay} of {daysInMonth})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {computedCycle.status === "Draft" ? (
            <Button
              size="sm"
              className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleRunPayroll}
              disabled={pendingConfigCount > 0}
            >
              <CheckCircle className="h-4 w-4" />
              Finalize Payroll
            </Button>
          ) : computedCycle.status === "Processed" ? (
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
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              {salaryMode === "partial" ? "Partial" : "Monthly"} Compensation Ledger
              {salaryMode === "partial" && (
                <span className="text-[10px] font-bold text-violet-600 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                  Day {effectiveFromDay}–{effectiveToDay} / {daysInMonth}d
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Net payable:{" "}
              <span className="font-bold text-foreground">
                {formatCurrency(totalNetPay)}
              </span>
              {salaryMode === "partial" && (
                <span className="ml-2 text-violet-600 font-medium">
                  · {effectiveToDay - effectiveFromDay + 1} working days
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value)
                // Reset partial days to fit new month
                const newLastDay = new Date(Number(e.target.value.split("-")[0]), Number(e.target.value.split("-")[1]), 0).getDate()
                setPartialToDay(newLastDay)
                setPartialFromDay(1)
              }}
              className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2"
            >
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
              <option value="2026-04">April 2026</option>
            </select>

            {/* Salary Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border/60 overflow-hidden h-9">
              <button
                type="button"
                onClick={() => setSalaryMode("full")}
                className={cn(
                  "px-3 text-xs font-semibold h-full transition-colors",
                  salaryMode === "full"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                Full Month
              </button>
              <button
                type="button"
                onClick={() => setSalaryMode("partial")}
                className={cn(
                  "px-3 text-xs font-semibold h-full transition-colors",
                  salaryMode === "partial"
                    ? "bg-violet-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                Partial
              </button>
            </div>

            {/* Partial day range inputs */}
            {salaryMode === "partial" && (
              <div className="flex items-center gap-1.5 border border-violet-500/30 bg-violet-500/5 rounded-lg px-2.5 py-1">
                <span className="text-[10px] font-semibold text-violet-600">Day</span>
                <input
                  type="number"
                  min={1}
                  max={effectiveToDay}
                  value={partialFromDay}
                  onChange={e => setPartialFromDay(Math.min(Number(e.target.value), partialToDay))}
                  className="w-10 h-7 text-xs text-center bg-background border border-border/60 rounded px-1"
                />
                <span className="text-[10px] text-muted-foreground">to</span>
                <input
                  type="number"
                  min={partialFromDay}
                  max={daysInMonth}
                  value={partialToDay}
                  onChange={e => setPartialToDay(Math.max(Number(e.target.value), partialFromDay))}
                  className="w-10 h-7 text-xs text-center bg-background border border-border/60 rounded px-1"
                />
                <span className="text-[10px] font-semibold text-violet-600">
                  ({effectiveToDay - effectiveFromDay + 1}d)
                </span>
              </div>
            )}

            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold py-1 px-2.5",
                computedCycle.status === "Distributed" &&
                  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                computedCycle.status === "Processed" &&
                  "bg-blue-500/10 text-blue-600 border-blue-500/20",
                computedCycle.status === "Draft" &&
                  "bg-amber-500/10 text-amber-600 border-amber-500/20"
              )}
            >
              {computedCycle.status}
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
                  Basic
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Total
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Present
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Absent (LOP)
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Late
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-center">
                  Leave
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  PF Ded.
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  LOP Ded.
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Late Penalty
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Net Payable
                </TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-48 text-center border-b-0">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-xs text-muted-foreground">
                        Calculating payroll and fetching logs...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : computedCycle.payslips.map((payslip) => {
                const pfDeduction = payslip.deductions["Provident Fund"] || 0

                return (
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
                      {payslip.basicSalary > 0 ? formatCurrency(payslip.basicSalary) : (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px]">
                          Pending Setup
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center font-medium text-muted-foreground">
                      {salaryMode === "partial" ? (
                        <span className="text-violet-600 font-semibold">{effectiveToDay - effectiveFromDay + 1}d</span>
                      ) : (
                        <span>{daysInMonth}d</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center">
                      <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15">
                        {payslip.presentDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold py-0.5 px-2",
                        payslip.lopDays > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {payslip.lopDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold py-0.5 px-2",
                        payslip.lateDays > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {payslip.lateDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-bold py-0.5 px-2",
                        payslip.leaveDays > 0 ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {payslip.leaveDays}d
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-rose-500">
                      {pfDeduction > 0 ? `-${formatCurrency(pfDeduction)}` : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-rose-500">
                      {payslip.lopDeduction > 0 ? `-${formatCurrency(payslip.lopDeduction)}` : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-rose-500">
                      {payslip.lateDeduction > 0 ? `-${formatCurrency(payslip.lateDeduction)}` : "—"}
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
                    
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Attendance Audit Dialog */}
      <Dialog open={auditEmployeeEmail !== null} onOpenChange={() => setAuditEmployeeEmail(null)}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          {auditDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Monthly Attendance & Leave Audit</span>
                  <span className="text-[10px] text-muted-foreground mr-4">Period: {selectedMonth}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Reviewing daily records for <strong>{auditDetails.payslip.name}</strong> to verify LOP and Late entry counts.
                </DialogDescription>
              </DialogHeader>

              {/* Stats overview */}
              <div className="grid grid-cols-5 gap-2.5 py-1 text-center">
                <div className="p-2 border border-border/40 rounded-xl bg-muted/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Present</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">{auditDetails.payslip.presentDays}d</p>
                </div>
                <div className="p-2 border border-border/40 rounded-xl bg-muted/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Unpaid/LOP</p>
                  <p className="text-base font-bold text-rose-500 mt-0.5">{auditDetails.payslip.lopDays}d</p>
                </div>
                <div className="p-2 border border-border/40 rounded-xl bg-muted/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Late Entries</p>
                  <p className="text-base font-bold text-amber-500 mt-0.5">{auditDetails.payslip.lateDays}d</p>
                </div>
                <div className="p-2 border border-border/40 rounded-xl bg-muted/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Leaves</p>
                  <p className="text-base font-bold text-blue-500 mt-0.5">{auditDetails.payslip.leaveDays}d</p>
                </div>
                <div className="p-2 border border-border/40 rounded-xl bg-muted/20">
                  <p className="text-[10px] text-muted-foreground font-semibold">Official/Out</p>
                  <p className="text-base font-bold text-indigo-500 mt-0.5">
                    {auditDetails.payslip.movementDays + auditDetails.payslip.travelDays + auditDetails.payslip.earlyOutDays}d
                  </p>
                </div>
              </div>

              {/* LOP and penalty logs warnings */}
              {(auditDetails.payslip.lopDeduction > 0 || auditDetails.payslip.lateDeduction > 0) && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Salary Deduction Triggers:
                  </p>
                  <ul className="list-disc pl-4 text-amber-600 space-y-0.5">
                    {auditDetails.payslip.lopDays > 0 && (
                      <li>{auditDetails.payslip.lopDays} LOP / unpaid days subtracted: <strong>-{formatCurrency(auditDetails.payslip.lopDeduction)}</strong></li>
                    )}
                    {auditDetails.payslip.lateDays >= 3 && (
                      <li>{auditDetails.payslip.lateDays} late entries penalty applied (1/6 day pay deducted per 3 lates): <strong>-{formatCurrency(auditDetails.payslip.lateDeduction)}</strong></li>
                    )}
                  </ul>
                </div>
              )}

              {/* Calendar list */}
              <div className="border border-border/40 rounded-xl overflow-hidden text-xs">
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="h-8 py-1 font-semibold w-16">Day</TableHead>
                      <TableHead className="h-8 py-1 font-semibold w-24">Date</TableHead>
                      <TableHead className="h-8 py-1 font-semibold">Status / Leave Type</TableHead>
                      <TableHead className="h-8 py-1 font-semibold text-center w-20">In</TableHead>
                      <TableHead className="h-8 py-1 font-semibold text-center w-20">Out</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditDetails.calendarDays.map(day => (
                      <TableRow key={day.dayNumber} className="border-b border-border/20 py-1 hover:bg-muted/10">
                        <TableCell className="py-1.5 font-medium">{day.dayNumber} ({day.dayName})</TableCell>
                        <TableCell className="py-1.5 text-muted-foreground">{day.dateStr}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className={cn("text-[9px] font-bold py-0 px-2.5", day.badgeStyle)}>
                            {day.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5 text-center text-muted-foreground">{day.checkIn}</TableCell>
                        <TableCell className="py-1.5 text-center text-muted-foreground">{day.checkOut}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter className="pt-2 border-t border-border/40">
                <Button variant="outline" size="sm" onClick={() => setAuditEmployeeEmail(null)} className="text-xs">
                  Done Reviewing
                </Button>
              </DialogFooter>
            </>
          )}
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
              Execute PayoutMonthly Compensation Ledger

            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detailed Payslip View Dialog */}
      <Dialog
        open={viewPayslip !== null}
        onOpenChange={() => setViewPayslip(null)}
      >
        <DialogContent className="sm:max-w-[520px]">
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
              <div className="space-y-4 border-t border-b border-border/40 py-3 text-xs">
                {/* Employee Info Block */}
                <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Employee Name</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Designation &amp; Department</p>
                    <p className="font-semibold mt-0.5">{viewPayslip.role} ({viewPayslip.dept})</p>
                  </div>
                </div>

                {viewPayslip.bonusWarning && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-600 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span>{viewPayslip.bonusWarning}</span>
                  </div>
                )}
                
                {/* Earnings & Deductions Audit */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Earnings list */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wider">
                      Earnings
                    </p>
                    <div className="space-y-1 bg-emerald-500/[0.02] p-2 rounded-lg border border-emerald-500/10">
                      <div className="flex justify-between">
                        <span>Basic Salary:</span>
                        <span className="font-semibold">{formatCurrency(viewPayslip.basicSalary)}</span>
                      </div>
                      
                      {Object.entries(viewPayslip.allowances).map(([name, val]) => (
                        <div key={name} className="flex justify-between">
                          <span>{name}:</span>
                          <span className="font-semibold">{formatCurrency(val)}</span>
                        </div>
                      ))}

                      {viewPayslip.festivalBonus && viewPayslip.festivalBonus > 0 ? (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span className="truncate max-w-[150px]">{viewPayslip.festivalBonusDescription || "Festival Bonus"}:</span>
                          <span>{formatCurrency(viewPayslip.festivalBonus)}</span>
                        </div>
                      ) : null}

                      {viewPayslip.specialBonus && viewPayslip.specialBonus > 0 ? (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span className="truncate max-w-[150px]">{viewPayslip.specialBonusDescription || "Special Bonus"}:</span>
                          <span>{formatCurrency(viewPayslip.specialBonus)}</span>
                        </div>
                      ) : null}

                      {(!viewPayslip.festivalBonus && !viewPayslip.specialBonus && viewPayslip.bonus > 0) ? (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span className="truncate max-w-[150px]">{viewPayslip.bonusDescription || "Bonus"}:</span>
                          <span>{formatCurrency(viewPayslip.bonus)}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Deductions list */}
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] uppercase text-rose-500 tracking-wider">
                      Deductions
                    </p>
                    <div className="space-y-1 bg-rose-500/[0.02] p-2 rounded-lg border border-rose-500/10">
                      {Object.entries(viewPayslip.deductions).map(([name, val]) => (
                        <div key={name} className={cn(
                          "flex justify-between",
                          (name.includes("LOP") || name.includes("Penalty")) && "text-amber-600 font-medium"
                        )}>
                          <span>{name}:</span>
                          <span className="font-semibold">-{formatCurrency(val)}</span>
                        </div>
                      ))}
                      
                      {Object.keys(viewPayslip.deductions).length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">No deductions applied</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Disbursement info block */}
                {viewPayslip.paymentStatus === "Paid" && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-1">
                    <p className="font-bold text-[10px] uppercase text-emerald-600 tracking-wide">
                      Payout Disbursement Info
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">Date:</span> {viewPayslip.paymentDate}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Method:</span> {viewPayslip.paymentMethod}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-foreground">Reference:</span>{" "}
                        <span className="font-mono text-foreground">{viewPayslip.paymentReference}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Totals Summary */}
                <div className="pt-2 border-t border-border/40 flex justify-between items-center text-sm">
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
