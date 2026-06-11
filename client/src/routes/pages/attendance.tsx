import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, CheckCircle2, XCircle, Clock } from "lucide-react"

const attendanceData = [
  { name: "Sarah Mitchell", checkIn: "8:52 AM", checkOut: "—", status: "Present", hours: "—" },
  { name: "James Cooper", checkIn: "9:01 AM", checkOut: "—", status: "Present", hours: "—" },
  { name: "Emily Zhang", checkIn: "8:45 AM", checkOut: "—", status: "Present", hours: "—" },
  { name: "David Kim", checkIn: "—", checkOut: "—", status: "On Leave", hours: "—" },
  { name: "Lisa Johnson", checkIn: "—", checkOut: "—", status: "Absent", hours: "—" },
  { name: "Marcus Brown", checkIn: "9:15 AM", checkOut: "—", status: "Late", hours: "—" },
]

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance</h2>
        <p className="text-muted-foreground">Track daily attendance and time records</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Present", value: "221", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Absent", value: "13", icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Late", value: "8", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "On Leave", value: "14", icon: CalendarClock, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
          <CardDescription>Real-time attendance log for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceData.map((record) => (
              <div key={record.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {record.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{record.name}</p>
                    <p className="text-xs text-muted-foreground">Check-in: {record.checkIn}</p>
                  </div>
                </div>
                <Badge
                  variant={record.status === "Present" ? "default" : record.status === "Late" ? "secondary" : "outline"}
                  className={record.status === "Present" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                >
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
