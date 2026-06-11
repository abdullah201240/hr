import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarOff, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

const leaveRequests = [
  { name: "Sarah Mitchell", type: "Vacation", from: "Jun 15", to: "Jun 17", days: 3, status: "Pending" },
  { name: "David Kim", type: "Sick Leave", from: "Jun 10", to: "Jun 12", days: 3, status: "Approved" },
  { name: "Marcus Brown", type: "Personal", from: "Jun 20", to: "Jun 20", days: 1, status: "Pending" },
  { name: "Emily Zhang", type: "Vacation", from: "Jun 25", to: "Jun 30", days: 5, status: "Pending" },
  { name: "Lisa Johnson", type: "Maternity", from: "Jul 1", to: "Sep 30", days: 90, status: "Approved" },
]

export default function LeavePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Leave Management</h2>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <Button className="gap-2">
          <CalendarOff className="h-4 w-4" />
          New Request
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">3</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">8</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" /> Rejected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">1</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Recent leave requests across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaveRequests.map((req, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{req.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{req.type}</Badge>
                    <span>{req.from} — {req.to}</span>
                    <span>({req.days} day{req.days > 1 ? "s" : ""})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "Pending" ? (
                    <>
                      <Button variant="default" size="sm" className="h-7 text-xs">Approve</Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs">Reject</Button>
                    </>
                  ) : (
                    <Badge
                      variant={req.status === "Approved" ? "default" : "destructive"}
                      className={req.status === "Approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                    >
                      {req.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
