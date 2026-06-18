
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import {
  CalendarCheck,
  Clock,
  CalendarX,
  Palmtree,
  CalendarDays,
  FileWarning,
  Search,
  Plus,
  Users,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface EmployeeAttendanceTabProps {
  dailyCounts: {
    present: number
    late: number
    absent: number
    leave: number
    holiday: number
    weekend: number
  }
  pendingCorrections: any[]
  adminSubTab: "logs" | "corrections"
  setAdminSubTab: (tab: "logs" | "corrections") => void
  selectedDate: string
  setSelectedDate: (date: string) => void
  adminFilterStatus: string
  setAdminFilterStatus: (status: string) => void
  adminSearch: string
  setAdminSearch: (search: string) => void
  handleOpenOverride: (log?: any) => void
  filteredDailyLogs: any[]
  paginatedDailyLogs: any[]
  isLoadingDaily: boolean
  isLoadingCorrections: boolean
  adminCurrentPage: number
  setAdminCurrentPage: (updater: number | ((prev: number) => number)) => void
  adminPageSize: number
  setAdminPageSize: (size: number) => void
  handleApproveCorrection: (id: string, name: string, date: string) => Promise<void>
  handleRejectCorrection: (id: string, name: string, date: string) => Promise<void>
}

export function EmployeeAttendanceTab({
  dailyCounts,
  pendingCorrections,
  adminSubTab,
  setAdminSubTab,
  selectedDate,
  setSelectedDate,
  adminFilterStatus,
  setAdminFilterStatus,
  adminSearch,
  setAdminSearch,
  handleOpenOverride,
  filteredDailyLogs,
  paginatedDailyLogs,
  isLoadingDaily,
  isLoadingCorrections,
  adminCurrentPage,
  setAdminCurrentPage,
  adminPageSize,
  setAdminPageSize,
  handleApproveCorrection,
  handleRejectCorrection,
}: EmployeeAttendanceTabProps) {
  return (
    <div className="space-y-6">
      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Present</span>
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{dailyCounts.present}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Late</span>
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-500">{dailyCounts.late}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Absent</span>
            <p className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">{dailyCounts.absent}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
            <CalendarX className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leave</span>
            <p className="text-3xl font-bold tracking-tight text-sky-600 dark:text-sky-500">{dailyCounts.leave}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center">
            <Palmtree className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Holiday / Off</span>
            <p className="text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-500">{dailyCounts.holiday + dailyCounts.weekend}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corrections</span>
            <p className="text-3xl font-bold tracking-tight text-primary">{pendingCorrections.length}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileWarning className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ─── Admin Sub-tabs ─── */}
      <Tabs value={adminSubTab} onValueChange={(v) => setAdminSubTab(v as "logs" | "corrections")} className="space-y-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2 shadow-none border border-border/40 bg-muted/20 rounded-xl">
          <TabsTrigger value="logs" className="text-xs font-semibold rounded-lg">Workforce Daily Logs</TabsTrigger>
          <TabsTrigger value="corrections" className="text-xs font-semibold rounded-lg">Pending Corrections ({pendingCorrections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4 outline-none">
          {/* ─── Controls ─── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-44 bg-transparent border-border/60 text-xs font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status Filter</label>
              <Select value={adminFilterStatus} onValueChange={setAdminFilterStatus}>
                <SelectTrigger className="w-36 h-9 bg-transparent border-border/60 text-xs">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="weekend">Weekend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="pl-9 h-9 bg-transparent border-border/60 text-xs font-semibold"
                />
              </div>
            </div>
            <Button onClick={() => handleOpenOverride()} className="h-9 gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              Manual Entry
            </Button>
          </div>

          <Card className="shadow-none border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Daily Workforce Logs</h3>
                  <p className="text-[11px] text-muted-foreground">Employee check-ins, check-outs, and hours logged</p>
                </div>
                <Badge variant="outline" className="text-[10px] bg-muted/20 border-border/30">{filteredDailyLogs.length} entries</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/30">
                    <TableRow className="border-b-0 hover:bg-transparent">
                      <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">ID Code</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">Check In</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">Check Out</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">Logged Hours</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground">Notes</TableHead>
                      <TableHead className="font-semibold text-xs text-muted-foreground text-right w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingDaily ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx} className="border-b border-border/20">
                          <TableCell className="py-4"><div className="h-4 w-28 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4"><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4"><div className="h-6 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
                          <TableCell className="py-4"><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell className="py-4 text-right"><div className="h-7 w-16 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedDailyLogs.length > 0 ? (
                      paginatedDailyLogs.map((log) => (
                        <TableRow key={log.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          <TableCell className="py-3 font-semibold">{log.employeeName}</TableCell>
                          <TableCell className="py-3 text-muted-foreground text-xs">{log.employeeIdCode}</TableCell>
                          <TableCell className="py-3">
                            {log.checkIn ? <span className="font-semibold text-emerald-600 dark:text-emerald-400">{log.checkIn}</span> : <span className="text-muted-foreground/30">—</span>}
                          </TableCell>
                          <TableCell className="py-3">
                            {log.checkOut ? <span className="font-semibold text-amber-600 dark:text-amber-400">{log.checkOut}</span> : <span className="text-muted-foreground/30">—</span>}
                          </TableCell>
                          <TableCell className="py-3 font-bold">{log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/30">—</span>}</TableCell>
                          <TableCell className="py-3">
                            <Badge className={`text-[9px] font-bold capitalize border-none ${
                              log.status === "present" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                : log.status === "late" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                : log.status === "absent" ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                : log.status === "leave" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                                : log.status === "holiday" ? "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground italic max-w-[160px] truncate text-xs">{log.notes || "—"}</TableCell>
                          <TableCell className="py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenOverride(log)} className="h-7 text-[10px] font-semibold text-primary hover:text-primary/95 hover:bg-primary/5 rounded-lg px-2.5">
                              Override
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm font-semibold">No attendance records found</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Try selecting a different date</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {/* Cohesive Pagination Footer */}
            {!isLoadingDaily && filteredDailyLogs.length > 0 && (
              <div className="px-5 py-4 border-t border-border/30 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground font-medium">
                  Showing <span className="font-semibold text-foreground">
                    {Math.min(filteredDailyLogs.length, (adminCurrentPage - 1) * adminPageSize + 1)}
                  </span> to <span className="font-semibold text-foreground">
                    {Math.min(filteredDailyLogs.length, adminCurrentPage * adminPageSize)}
                  </span> of <span className="font-semibold text-foreground">{filteredDailyLogs.length}</span> entries
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Rows per page:</span>
                    <Select value={String(adminPageSize)} onValueChange={(val) => setAdminPageSize(Number(val))}>
                      <SelectTrigger className="w-16 h-8 text-[11px] bg-transparent border-border/60 font-semibold focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                        <SelectItem value="20" className="text-xs font-semibold">20</SelectItem>
                        <SelectItem value="50" className="text-xs font-semibold">50</SelectItem>
                        <SelectItem value="100" className="text-xs font-semibold">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdminCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={adminCurrentPage === 1}
                      className="h-8 text-xs font-semibold gap-1 hover:bg-muted/50 border-border/60"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAdminCurrentPage((p) => Math.min(Math.ceil(filteredDailyLogs.length / adminPageSize), p + 1))}
                      disabled={adminCurrentPage >= Math.ceil(filteredDailyLogs.length / adminPageSize)}
                      className="h-8 text-xs font-semibold gap-1 hover:bg-muted/50 border-border/60"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="corrections" className="outline-none">
          <Card className="shadow-none border-border/40">
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Pending Attendance Corrections</h3>
                  <p className="text-[11px] text-muted-foreground">Approve or reject employee correction requests</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-none text-[10px]">{pendingCorrections.length} pending</Badge>
              </div>
              <div className="overflow-x-auto">
                {isLoadingCorrections ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/10 border-b border-border/30">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                        <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-xs text-muted-foreground">Current Log</TableHead>
                        <TableHead className="font-semibold text-xs text-muted-foreground">Proposed</TableHead>
                        <TableHead className="font-semibold text-xs text-muted-foreground">Reason</TableHead>
                        <TableHead className="font-semibold text-xs text-muted-foreground text-right w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCorrections.length > 0 ? (
                        pendingCorrections.map((corr) => (
                          <TableRow key={corr.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                            <TableCell className="py-3">
                              <div className="font-semibold">{corr.employeeName}</div>
                              <div className="text-[10px] text-muted-foreground">{corr.employeeIdCode}</div>
                            </TableCell>
                            <TableCell className="py-3 font-semibold">{corr.date}</TableCell>
                            <TableCell className="py-3">
                              <div className="text-xs text-muted-foreground">In: {corr.checkIn || "—"}</div>
                              <div className="text-xs text-muted-foreground">Out: {corr.checkOut || "—"}</div>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">In: {corr.proposedCheckIn}</div>
                              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Out: {corr.proposedCheckOut}</div>
                            </TableCell>
                            <TableCell className="py-3 max-w-xs truncate text-xs text-muted-foreground" title={corr.correctionReason}>
                              {corr.correctionReason}
                            </TableCell>
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleApproveCorrection(corr.id, corr.employeeName, corr.date)}
                                  className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground"
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRejectCorrection(corr.id, corr.employeeName, corr.date)}
                                  className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                                  title="Reject"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                            <FileWarning className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm font-semibold">No pending corrections</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">All correction requests have been processed</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
