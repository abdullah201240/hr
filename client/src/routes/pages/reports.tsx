import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  Search,
  Users,
  CalendarClock,
  FileCheck,
  ShieldCheck,
  Download,
  Printer,
  Loader2,
} from "lucide-react"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import {
  useReportsSummaryKpisQuery,
  useWorkforceHeadcountQuery,
  useAttendanceSummaryQuery,
  useLeaveUtilizationQuery,
  usePayrollCostQuery,
} from "@/hooks/useReports"

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"workforce" | "attendance" | "leaves" | "payroll">("workforce")
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")

  // Current year & month defaults
  const currentYear = new Date().getFullYear()
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0')
  
  const [startDate, setStartDate] = useState(`${currentYear}-${currentMonthStr}-01`)
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // API Queries
  const { data: kpiData, isLoading: isLoadingKpis } = useReportsSummaryKpisQuery()
  const { data: deptOptions } = useDepartmentOptionsQuery()

  // Workforce queries
  const { data: workforceData, isLoading: isLoadingWorkforce } = useWorkforceHeadcountQuery()

  // Attendance queries
  const { data: attendanceData, isLoading: isLoadingAttendance } = useAttendanceSummaryQuery({
    startDate,
    endDate,
    departmentId: deptFilter,
  })

  // Leaves queries
  const { data: leavesData, isLoading: isLoadingLeaves } = useLeaveUtilizationQuery({
    year: selectedYear,
    departmentId: deptFilter,
  })

  // Payroll queries
  const { data: payrollData, isLoading: isLoadingPayroll } = usePayrollCostQuery({
    year: selectedYear,
    departmentId: deptFilter,
  })

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 0,
    }).format(val)
  }

  // CSV Exporter helper
  const handleExportCSV = () => {
    let exportData: any[] = []
    let filename = `${reportType}_report.csv`

    if (reportType === "workforce" && workforceData) {
      exportData = workforceData.departmentBreakdown.map(d => ({
        "Department Name": d.departmentName,
        "Department Code": d.departmentCode,
        "Active Headcount": d.headcount,
        "Avg. Basic Salary": d.avgSalary,
      }))
    } else if (reportType === "attendance" && attendanceData) {
      exportData = attendanceData
        .filter(row => row.fullName.toLowerCase().includes(search.toLowerCase()) || row.employeeDisplayId.toLowerCase().includes(search.toLowerCase()))
        .map(row => ({
          "Employee ID": row.employeeDisplayId,
          "Full Name": row.fullName,
          "Department": row.departmentName,
          "Designation": row.designationName,
          "Total Logs": row.totalDays,
          "Present Days": row.presentDays,
          "Absent Days": row.absentDays,
          "Leave Days": row.leaveDays,
          "Late Days": row.lateDays,
          "Early Out Days": row.earlyOutDays,
          "Total Hours Worked": row.totalHours,
          "Avg. Hours Worked": row.avgHours,
        }))
    } else if (reportType === "leaves" && leavesData) {
      exportData = leavesData
        .filter(row => row.fullName.toLowerCase().includes(search.toLowerCase()) || row.employeeDisplayId.toLowerCase().includes(search.toLowerCase()))
        .map(row => {
          const rowObj: any = {
            "Employee ID": row.employeeDisplayId,
            "Full Name": row.fullName,
            "Department": row.departmentName,
            "Designation": row.designationName,
            "Total Allocated": row.totalAllocated,
            "Total Taken": row.totalTaken,
            "Total Remaining": row.totalRemaining,
          }
          row.breakdown.forEach(b => {
            rowObj[`${b.leaveTypeName} (Allocated)`] = b.allocated
            rowObj[`${b.leaveTypeName} (Taken)`] = b.taken
            rowObj[`${b.leaveTypeName} (Remaining)`] = b.remaining
          })
          return rowObj
        })
    } else if (reportType === "payroll" && payrollData) {
      exportData = payrollData.map(row => ({
        "Month": row.monthKey,
        "Department": row.departmentName,
        "Total Basic Salary": row.totalBasic,
        "Total Allowances": row.totalAllowances,
        "Total Tax Deductions": row.totalTax,
        "Total PF Deductions": row.totalPf,
        "Total Net Paid": row.totalNetPay,
        "Total Company Payroll Cost": row.totalCost,
      }))
    }

    if (exportData.length === 0) return

    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(","),
      ...exportData.map(row =>
        headers
          .map(header => {
            const val = row[header] ?? ""
            return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
          })
          .join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Browser Print trigger
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4 print:p-0">
      {/* Page Title - Hidden in print mode if needed, or styled specially */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">Monitor global HR metrics, labor costs, and regulatory compliance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
          <Button size="sm" className="gap-2 text-xs" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center space-y-1 pb-6 border-b border-border mb-6">
        <h1 className="text-2xl font-extrabold uppercase tracking-widest">Sadoshima Global Corp</h1>
        <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Enterprise HR Analytics Report Ledger</p>
        <p className="text-[10px] text-muted-foreground">
          Report: <span className="font-bold text-foreground capitalize">{reportType} Analytics</span> | Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* KPI Stats - Hidden in Print */}
      <div className="grid gap-4 sm:grid-cols-3 print:hidden">
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Compliance Rating</p>
                {isLoadingKpis ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{kpiData?.complianceRating || "—"}</p>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Standard regulatory rating</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/5 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Workforce Headcount</p>
                {isLoadingKpis ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{kpiData?.activeHeadcount || "—"}</p>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Active employees on ledger</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/5 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Attendance Audit</p>
                {isLoadingKpis ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <p className="text-2xl font-bold mt-1 text-amber-600">{kpiData?.avgAttendanceAudit || "—"}</p>
                )}
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Monthly daily check-in avg</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/5 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar - Hidden in Print */}
      <Card className="shadow-none border-border/40 print:hidden">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3">
          <div className="w-full lg:w-[200px]">
            <Select value={reportType} onValueChange={(val: any) => setReportType(val)}>
              <SelectTrigger className="w-full text-xs h-9 font-medium capitalize">
                <SelectValue placeholder="Select Report Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workforce" className="text-xs">Workforce Breakdown</SelectItem>
                <SelectItem value="attendance" className="text-xs">Attendance Summary</SelectItem>
                <SelectItem value="leaves" className="text-xs">Leave Utilization</SelectItem>
                <SelectItem value="payroll" className="text-xs">Payroll cost report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports by employee name or ID..."
              className="pl-9 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
              disabled={reportType === "workforce" || reportType === "payroll"}
            />
          </div>

          {/* Department Filter (Applicable for Attendance, Leaves, Payroll) */}
          {reportType !== "workforce" && (
            <div className="w-full lg:w-[200px]">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Departments</SelectItem>
                  {deptOptions?.map(dept => (
                    <SelectItem key={dept.id} value={dept.id} className="text-xs">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Picker Filters (Attendance specific) */}
          {reportType === "attendance" && (
            <div className="flex gap-2 w-full lg:w-auto">
              <Input
                type="date"
                className="text-xs h-9 w-[130px]"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span className="self-center text-muted-foreground text-xs">to</span>
              <Input
                type="date"
                className="text-xs h-9 w-[130px]"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Year selector (Leaves & Payroll specific) */}
          {(reportType === "leaves" || reportType === "payroll") && (
            <div className="w-full lg:w-[120px]">
              <Select value={String(selectedYear)} onValueChange={val => setSelectedYear(Number(val))}>
                <SelectTrigger className="w-full text-xs h-9">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(currentYear)} className="text-xs">{currentYear}</SelectItem>
                  <SelectItem value={String(currentYear - 1)} className="text-xs">{currentYear - 1}</SelectItem>
                  <SelectItem value={String(currentYear - 2)} className="text-xs">{currentYear - 2}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Report Render Area */}
      <Card className="shadow-none border-border/40 print:border-none print:shadow-none">
        <CardHeader className="pb-3 border-b border-border/30 print:px-0">
          <CardTitle className="text-base font-bold flex items-center justify-between">
            <span className="capitalize">{reportType} Audit Ledger</span>
            <span className="text-xs text-muted-foreground print:text-foreground font-normal">
              {reportType === "attendance" && `Period: ${startDate} to ${endDate}`}
              {(reportType === "leaves" || reportType === "payroll") && `Year: ${selectedYear}`}
            </span>
          </CardTitle>
          <CardDescription className="text-xs print:hidden">Report outputs aggregated dynamically from server repositories</CardDescription>
        </CardHeader>
        <CardContent className="p-0 print:p-0">
          {/* Workforce Breakdown */}
          {reportType === "workforce" && (
            <div className="p-6 space-y-8 print:p-0">
              {isLoadingWorkforce ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : workforceData ? (
                <div className="grid gap-6 md:grid-cols-2 print:grid-cols-1">
                  {/* Department headcount */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-2">Department Headcounts</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground text-left">
                            <th className="py-2 font-medium">Department</th>
                            <th className="py-2 font-medium text-right">Headcount</th>
                            <th className="py-2 font-medium text-right">Avg. Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workforceData.departmentBreakdown.map(d => (
                            <tr key={d.departmentId} className="border-b">
                              <td className="py-2.5 font-medium">{d.departmentName} ({d.departmentCode})</td>
                              <td className="py-2.5 text-right font-bold">{d.headcount}</td>
                              <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(d.avgSalary)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Designation Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-2">Designation Spread</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground text-left">
                            <th className="py-2 font-medium">Designation</th>
                            <th className="py-2 font-medium text-right">Headcount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workforceData.designationBreakdown.map(d => (
                            <tr key={d.designationId} className="border-b">
                              <td className="py-2.5 font-medium">{d.designationName}</td>
                              <td className="py-2.5 text-right font-bold">{d.headcount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Employee Type Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-2">Contract Distribution</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground text-left">
                            <th className="py-2 font-medium">Employment Type</th>
                            <th className="py-2 font-medium text-right">Headcount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workforceData.typeBreakdown.map(t => (
                            <tr key={t.employeeType} className="border-b">
                              <td className="py-2.5 font-medium capitalize">{t.employeeType}</td>
                              <td className="py-2.5 text-right font-bold">{t.headcount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Gender Diversity Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b pb-2">Gender Demographics</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b text-muted-foreground text-left">
                            <th className="py-2 font-medium">Gender</th>
                            <th className="py-2 font-medium text-right">Headcount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workforceData.genderBreakdown.map(g => (
                            <tr key={g.gender} className="border-b">
                              <td className="py-2.5 font-medium capitalize">{g.gender}</td>
                              <td className="py-2.5 text-right font-bold">{g.headcount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground text-xs">No workforce stats available.</p>
              )}
            </div>
          )}

          {/* Attendance Summary */}
          {reportType === "attendance" && (
            <div className="overflow-x-auto">
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : attendanceData ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground text-left font-medium">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-right">Logs</th>
                      <th className="p-3 text-right text-emerald-600">Present</th>
                      <th className="p-3 text-right text-rose-600">Absent</th>
                      <th className="p-3 text-right text-blue-600">Leaves</th>
                      <th className="p-3 text-right text-amber-600">Late</th>
                      <th className="p-3 text-right text-amber-700">Early Out</th>
                      <th className="p-3 text-right">Hours</th>
                      <th className="p-3 text-right">Avg Hrs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData
                      .filter(row => row.fullName.toLowerCase().includes(search.toLowerCase()) || row.employeeDisplayId.toLowerCase().includes(search.toLowerCase()))
                      .map(row => (
                        <tr key={row.employeeId} className="border-b hover:bg-muted/10">
                          <td className="p-3 font-semibold">{row.employeeDisplayId}</td>
                          <td className="p-3 font-medium">{row.fullName}</td>
                          <td className="p-3 text-muted-foreground">{row.departmentName}</td>
                          <td className="p-3 text-muted-foreground">{row.designationName}</td>
                          <td className="p-3 text-right font-bold">{row.totalDays}</td>
                          <td className="p-3 text-right font-semibold text-emerald-600">{row.presentDays}</td>
                          <td className="p-3 text-right font-semibold text-rose-600">{row.absentDays}</td>
                          <td className="p-3 text-right font-semibold text-blue-600">{row.leaveDays}</td>
                          <td className="p-3 text-right font-semibold text-amber-600">{row.lateDays}</td>
                          <td className="p-3 text-right font-semibold text-amber-700">{row.earlyOutDays}</td>
                          <td className="p-3 text-right font-medium">{row.totalHours}</td>
                          <td className="p-3 text-right font-medium text-muted-foreground">{row.avgHours}</td>
                        </tr>
                      ))}
                    {attendanceData.length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center p-8 text-muted-foreground">No attendance details found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-10 text-muted-foreground text-xs">No attendance summary available.</p>
              )}
            </div>
          )}

          {/* Leave Utilization */}
          {reportType === "leaves" && (
            <div className="overflow-x-auto">
              {isLoadingLeaves ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : leavesData ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground text-left font-medium">
                      <th className="p-3">Employee ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-right text-muted-foreground">Allocated</th>
                      <th className="p-3 text-right text-emerald-600">Approved</th>
                      <th className="p-3 text-right text-blue-600">Remaining</th>
                      <th className="p-3">Breakdown (Type: Taken/Allocated)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavesData
                      .filter(row => row.fullName.toLowerCase().includes(search.toLowerCase()) || row.employeeDisplayId.toLowerCase().includes(search.toLowerCase()))
                      .map(row => (
                        <tr key={row.id} className="border-b hover:bg-muted/10">
                          <td className="p-3 font-semibold">{row.employeeDisplayId}</td>
                          <td className="p-3 font-medium">{row.fullName}</td>
                          <td className="p-3 text-muted-foreground">{row.departmentName}</td>
                          <td className="p-3 text-muted-foreground">{row.designationName}</td>
                          <td className="p-3 text-right font-medium">{row.totalAllocated}d</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{row.totalTaken}d</td>
                          <td className="p-3 text-right font-bold text-blue-600">{row.totalRemaining}d</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              {row.breakdown.map(b => (
                                <span key={b.leaveTypeName} className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border/40">
                                  {b.leaveTypeName}: <strong className="text-foreground">{b.taken}</strong>/{b.allocated}d
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {leavesData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">No leave records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-10 text-muted-foreground text-xs">No leave utilization logs available.</p>
              )}
            </div>
          )}

          {/* Payroll & Cost report */}
          {reportType === "payroll" && (
            <div className="overflow-x-auto">
              {isLoadingPayroll ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : payrollData ? (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/20 text-muted-foreground text-left font-medium">
                      <th className="p-3">Billing Cycle (Month)</th>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-right">Sum Basic Salary</th>
                      <th className="p-3 text-right">Sum Allowances</th>
                      <th className="p-3 text-right text-rose-500">Tax Deducted</th>
                      <th className="p-3 text-right text-blue-500">PF Contributed</th>
                      <th className="p-3 text-right text-emerald-600">Net Distributed</th>
                      <th className="p-3 text-right">Total Company Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/10">
                        <td className="p-3 font-semibold">{row.monthKey}</td>
                        <td className="p-3 font-medium">{row.departmentName || "General / Administrative"}</td>
                        <td className="p-3 text-right font-medium text-muted-foreground">{formatCurrency(row.totalBasic)}</td>
                        <td className="p-3 text-right font-medium text-muted-foreground">{formatCurrency(row.totalAllowances)}</td>
                        <td className="p-3 text-right font-medium text-rose-500">{formatCurrency(row.totalTax)}</td>
                        <td className="p-3 text-right font-medium text-blue-500">{formatCurrency(row.totalPf)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(row.totalNetPay)}</td>
                        <td className="p-3 text-right font-extrabold text-primary">{formatCurrency(row.totalCost)}</td>
                      </tr>
                    ))}
                    {payrollData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-muted-foreground">No payroll disbursement costs found for the selected year. Only disbursed payrolls are reported.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-10 text-muted-foreground text-xs">No payroll summaries available.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
