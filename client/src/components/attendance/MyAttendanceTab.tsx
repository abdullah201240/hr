
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AttendanceCalendar } from "@/components/dashboard/attendance-calendar"
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
import { Spinner } from "@/components/ui/spinner"
import {
  BarChart3,
  Info,
  Laptop,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  Hours: {
    label: "Hours Logged",
    color: "hsl(var(--primary))",
  },
}

interface MyAttendanceTabProps {
  calMonth: number
  calYear: number
  setCalMonth: (m: number) => void
  setCalYear: (y: number) => void
  todayDate: Date
  selectedDayNumber: number
  setSelectedDayNumber: (day: number) => void
  setDayDetailMode: (mode: "leave" | "regular") => void
  setIsDayDetailOpen: (open: boolean) => void
  setIsLeaveDialogOpen: (open: boolean) => void
  finalAttendance: any[]
  mappedLeaveApplications: any[]
  balances: any[]
  dragOverDay: number | null
  setDragOverDay: (day: number | null) => void
  handleCancelLeaveById: (id: string) => Promise<void>
  chartData: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  isLoadingMyRange: boolean
  isFetchingMyRange: boolean
  processedMyRangeLogs: any[]
  selectedDay: any
  setSelectedDay: (log: any) => void
  handleRequestCorrection: (log: any) => void
  myRangeLogs: any[]
  myCursorHistory: string[]
  myCurrentPage: number
  myLimit: number
  setMyLimit: (limit: number) => void
  handleMyPrevPage: () => void
  handleMyNextPage: () => void
  myHasNextPage: boolean
}

export function MyAttendanceTab({
  calMonth,
  calYear,
  setCalMonth,
  setCalYear,
  todayDate,
  selectedDayNumber,
  setSelectedDayNumber,
  setDayDetailMode,
  setIsDayDetailOpen,
  setIsLeaveDialogOpen,
  finalAttendance,
  mappedLeaveApplications,
  balances,
  dragOverDay,
  setDragOverDay,
  handleCancelLeaveById,
  chartData,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  isLoadingMyRange,
  isFetchingMyRange,
  processedMyRangeLogs,
  selectedDay,
  setSelectedDay,
  handleRequestCorrection,
  myRangeLogs,
  myCursorHistory,
  myCurrentPage,
  myLimit,
  setMyLimit,
  handleMyPrevPage,
  handleMyNextPage,
  myHasNextPage,
}: MyAttendanceTabProps) {
  return (
    <div className="space-y-6">
      {/* ─── Interactive Calendar ─── */}
      <AttendanceCalendar
        calMonth={calMonth}
        calYear={calYear}
        onMonthChange={(month, year) => {
          setCalMonth(month)
          setCalYear(year)
        }}
        currentTime={todayDate}
        selectedDayNumber={selectedDayNumber}
        onSelectDay={setSelectedDayNumber}
        onOpenDayDetail={(mode) => {
          setDayDetailMode(mode)
          setIsDayDetailOpen(true)
        }}
        onOpenLeaveDialog={(day) => {
          setSelectedDayNumber(day)
          setIsLeaveDialogOpen(true)
        }}
        finalAttendance={finalAttendance}
        leaveApplications={mappedLeaveApplications as any}
        balances={balances}
        dragOverDay={dragOverDay}
        onDragOver={setDragOverDay}
        onCancelLeave={handleCancelLeaveById}
      />

      {/* ─── Hours Chart ─── */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-4 pt-5">
          <div className="pb-4 flex flex-row items-center justify-between">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Active Working Hours Trend
              </h3>
              <p className="text-xs text-muted-foreground">Hours logged per day against the standard 8-hour target.</p>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg">
              <Info className="h-3 w-3" /> Auto-synced
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, 12]} />
                  <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
                  <ReferenceLine y={8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Target: 8h", position: "top", fill: "#ef4444", fontSize: 10 }} />
                  <Bar dataKey="Hours" fill="url(#colorHours)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No working hours data available for this month yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Attendance History Table ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 text-xs h-9 bg-transparent border-border/60">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="leave">Leave</SelectItem>
              <SelectItem value="holiday">Holiday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-none border-border/40 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto relative">
              {isFetchingMyRange && !isLoadingMyRange && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all duration-300">
                  <Spinner className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Day</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check In</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Check Out</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Logged Hours</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Location</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingMyRange ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx} className="border-b border-border/20">
                        <TableCell className="py-4"><div className="h-4 w-24 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell className="py-4"><div className="h-6 w-16 bg-muted animate-pulse rounded-full" /></TableCell>
                        <TableCell className="py-4 text-right"><div className="h-7 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : processedMyRangeLogs.length > 0 ? (
                    processedMyRangeLogs.map((log) => (
                      <tr
                        key={log.day}
                        className={`border-b border-border/20 hover:bg-muted/10 transition-colors cursor-pointer ${selectedDay?.day === log.day ? "bg-muted/20" : ""}`}
                        onClick={() => setSelectedDay(log)}
                      >
                        <TableCell className="py-3 font-semibold">{log.dateStr}</TableCell>
                        <TableCell className="py-3 text-muted-foreground">{log.dayName}</TableCell>
                        <TableCell className="py-3">
                          {log.checkIn ? (
                            <span className="font-medium">{log.checkIn}</span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {log.checkOut ? (
                            <span className="font-medium">{log.checkOut}</span>
                          ) : log.checkIn ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Active</Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 font-semibold">
                          {log.hours ? `${log.hours} hrs` : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          {log.location ? (
                            <span className="flex items-center gap-1 text-xs">
                              {log.location === "Remote" ? <Laptop className="h-3 w-3 text-muted-foreground" /> : <MapPin className="h-3 w-3 text-muted-foreground" />}
                              {log.location}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {log.status === "leave" ? (() => {
                            const leaveName = log.notes || "Leave"
                            const leaveNameLower = leaveName.toLowerCase()
                            let badgeStyle = "bg-sky-500/10 text-sky-500 hover:bg-sky-500/10"
                            if (leaveNameLower.includes("early out")) {
                              badgeStyle = "bg-orange-500/10 text-orange-500 hover:bg-orange-500/10"
                            } else if (leaveNameLower.includes("movement")) {
                              badgeStyle = "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/10"
                            } else if (leaveNameLower.includes("travel") || leaveNameLower.includes("tour")) {
                              badgeStyle = "bg-teal-500/10 text-teal-500 hover:bg-teal-500/10"
                            }
                            return (
                              <Badge className={`text-[9px] font-bold capitalize border-none ${badgeStyle}`}>
                                {leaveName}
                              </Badge>
                            )
                          })() : (
                            <Badge className={`text-[9px] font-bold capitalize border-none ${
                              log.status === "present" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
                                : log.status === "late" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                                : log.status === "absent" ? "bg-red-500/10 text-red-500 hover:bg-red-500/10"
                                : log.status === "holiday" ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/10"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {log.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {log.correctionStatus === "pending" ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">Pending</Badge>
                          ) : log.correctionStatus === "approved" ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Corrected</Badge>
                          ) : (
                            (log.status !== "upcoming" && log.status !== "weekend" && log.status !== "holiday") && (
                              <div className="flex items-center justify-end gap-1">
                                {log.correctionStatus === "rejected" && (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">Rejected</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRequestCorrection(log)}
                                  className="h-7 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg px-2.5"
                                >
                                  {log.correctionStatus === "rejected" ? "Re-submit" : "Correct"}
                                </Button>
                              </div>
                            )
                          )}
                        </TableCell>
                      </tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No logs found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Cohesive Pagination Footer */}
          {!isLoadingMyRange && myRangeLogs.length > 0 && (
            <div className="px-5 py-4 border-t border-border/30 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground font-medium">
                Showing <span className="font-semibold text-foreground">{myRangeLogs.length}</span> logs
                {myCursorHistory.length > 0 && ` (Page ${myCurrentPage})`}
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Rows per page:</span>
                  <Select value={String(myLimit)} onValueChange={(val) => setMyLimit(Number(val))}>
                    <SelectTrigger className="w-16 h-8 text-[11px] bg-transparent border-border/60 font-semibold focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                      <SelectItem value="20" className="text-xs font-semibold">20</SelectItem>
                      <SelectItem value="50" className="text-xs font-semibold">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMyPrevPage}
                    disabled={myCursorHistory.length === 0}
                    className="h-8 text-xs font-semibold gap-1 hover:bg-muted/50 border-border/60"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMyNextPage}
                    disabled={!myHasNextPage}
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
      </div>
    </div>
  )
}
