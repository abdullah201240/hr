import type { AttendanceRecord as DashAttendanceRecord } from "@/components/dashboard/types"

export function mapBalances(dbBalances: any[], DEFAULT_LEAVE_BALANCES: any[], resolveLeaveIcon: any) {
  const normalized = dbBalances && dbBalances.length > 0
    ? dbBalances.map(b => ({
        id: b.id,
        key: b.key,
        label: b.label,
        total: b.total,
        used: b.used,
        color: b.color || "bg-sky-500",
        icon: b.icon || "coffee",
        requiresDocument: b.requiresDocument
      }))
    : DEFAULT_LEAVE_BALANCES.map(db => ({
        id: db.key,
        key: db.key,
        label: db.label,
        total: db.total,
        used: db.used,
        color: db.color,
        icon: db.key,
        requiresDocument: false
      }))

  return normalized.map(item => {
    const resolvedIcon = resolveLeaveIcon(item.icon)

    return {
      id: item.id,
      label: item.label,
      used: item.used,
      total: item.total,
      color: item.color,
      light: item.color.replace("bg-", "text-"),
      icon: resolvedIcon,
      key: item.key,
      requiresDocument: item.requiresDocument
    }
  })
}

export function mapRegularHolidays(holidaysData: any[]) {
  return holidaysData.map((h: any) => ({
    id: h.id,
    name: h.name,
    startDate: h.startDate,
    endDate: h.endDate,
    startDay: h.startDate ? new Date(h.startDate + "T00:00:00").getDate() : 1,
    endDay: h.endDate ? new Date(h.endDate + "T00:00:00").getDate() : 1
  }))
}

export function mapLeaveApplications(leaveApplications: any[], calYear: number, calMonth: number) {
  return leaveApplications
    .filter((la) => {
      const startStr = typeof la.startDate === 'string' ? la.startDate.split('T')[0] : new Date(la.startDate).toISOString().split('T')[0]
      const endStr = typeof la.endDate === 'string' ? la.endDate.split('T')[0] : new Date(la.endDate).toISOString().split('T')[0]
      const firstDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
      const lastDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(new Date(calYear, calMonth + 1, 0).getDate()).padStart(2, '0')}`
      return startStr <= lastDayStr && endStr >= firstDayStr
    })
    .map((la) => {
      const startStr = typeof la.startDate === 'string' ? la.startDate.split('T')[0] : new Date(la.startDate).toISOString().split('T')[0]
      const endStr = typeof la.endDate === 'string' ? la.endDate.split('T')[0] : new Date(la.endDate).toISOString().split('T')[0]
      const [startYear, startMonth, startDayVal] = startStr.split('-').map(Number)
      const [endYear, endMonth, endDayVal] = endStr.split('-').map(Number)

      let startDay = 1
      if (startYear === calYear && (startMonth - 1) === calMonth) {
        startDay = startDayVal
      }
      let endDay = new Date(calYear, calMonth + 1, 0).getDate()
      if (endYear === calYear && (endMonth - 1) === calMonth) {
        endDay = endDayVal
      }

      return {
        id: la.id,
        startDay,
        endDay,
        leaveType: la.leaveTypeName.toLowerCase().replace(" leave", "").replace(" ", ""),
        reason: la.reason,
        attachments: la.attachments,
        status: la.status,
        rawLeave: la,
      }
    })
}

export function computeFinalAttendance(
  attendanceRecords: any[],
  mappedLeaveApplications: any[],
  balances: any[],
  regularHolidays: any[],
  weeklyHolidays: string[],
  calYear: number,
  calMonth: number
) {
  return attendanceRecords.map((record): DashAttendanceRecord => {
    const matchingLeave = mappedLeaveApplications.find(la => record.day >= la.startDay && record.day <= la.endDay)
    if (matchingLeave) {
      const selectedTypeObj = balances.find(b => b.key === matchingLeave.leaveType)
      const typeLabel = selectedTypeObj?.label || "Leave"
      return {
        ...record,
        status: "leave" as const,
        notes: `${matchingLeave.status} ${typeLabel}: ${matchingLeave.reason}`,
        attachments: matchingLeave.attachments as any,
        breakHours: record.breakHours || 0
      }
    }

    const matchingRegularHoliday = regularHolidays.find((h: any) => {
      if (h.startDate && h.endDate) {
        const recordDate = new Date(calYear, calMonth, record.day)
        const start = new Date(h.startDate + "T00:00:00")
        const end = new Date(h.endDate + "T00:00:00")
        recordDate.setHours(0, 0, 0, 0)
        start.setHours(0, 0, 0, 0)
        end.setHours(0, 0, 0, 0)
        return recordDate >= start && recordDate <= end
      }
      return record.day >= h.startDay && record.day <= h.endDay
    })
    if (matchingRegularHoliday) {
      return { ...record, status: "holiday" as const, notes: matchingRegularHoliday.name, checkIn: null, checkOut: null, hours: null, breakHours: record.breakHours || 0 }
    }

    const isWeeklyHoliday = weeklyHolidays.includes(record.dayName)
    if (isWeeklyHoliday) {
      if (!record.checkIn) {
        return { ...record, status: "weekend" as const, checkIn: null, checkOut: null, hours: null, breakHours: record.breakHours || 0 }
      }
    }

    if (record.status === "upcoming") return { ...record, breakHours: record.breakHours || 0 }

    if (!record.checkIn && record.status !== "leave" && record.status !== "weekend" && record.status !== "holiday") {
      return { ...record, status: "absent" as const, breakHours: record.breakHours || 0 }
    }

    return { ...record, breakHours: record.breakHours || 0 }
  })
}

export function exportAttendanceCSV(processedLogs: any[], queryStartDate: string, queryEndDate: string) {
  const headers = "Date,Employee Name,Employee ID,Department,Check In,Check Out,Hours,Status,Notes\n"
  const rows = processedLogs
    .map(
      (log) =>
        `"${log.date}","${log.employeeName}","${log.employeeIdCode}","${log.departmentName}","${log.checkIn || "—"}","${
          log.checkOut || "—"
        }",${log.hours || 0},"${log.status}","${log.notes || ""}"`
    )
    .join("\n")
  const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.setAttribute("download", `company_attendance_${queryStartDate}_to_${queryEndDate}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
