import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Clock, Building2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export function OfficeHours() {
  const [officeStartTime, setOfficeStartTime] = useState("09:00")
  const [officeEndTime, setOfficeEndTime] = useState("18:00")
  const [lateThreshold, setLateThreshold] = useState("15")

  const handleSaveOfficeSettings = () => {
    toast.success("Office settings saved!", {
      description: `Office hours: ${officeStartTime} - ${officeEndTime}`
    })
  }

  return (
    <Card className="shadow-none border-border/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Office Hours & Attendance
        </CardTitle>
        <CardDescription>Configure work schedules and time tracking rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Office Hours */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Standard Office Hours
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={officeStartTime}
                onChange={(e) => setOfficeStartTime(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Time</Label>
              <Input
                type="time"
                value={officeEndTime}
                onChange={(e) => setOfficeEndTime(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Late Threshold */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            Late Arrival Policy
          </Label>
          <div className="space-y-2">
            <Label className="text-xs">Late Threshold (minutes after start time)</Label>
            <Input
              type="number"
              value={lateThreshold}
              onChange={(e) => setLateThreshold(e.target.value)}
              placeholder="15"
              className="h-10"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Employees arriving more than {lateThreshold} minutes after {officeStartTime} will be marked as late
            </p>
          </div>
        </div>

        <Button onClick={handleSaveOfficeSettings} className="w-full gap-2 h-10">
          Save Office Settings
        </Button>
      </CardContent>
    </Card>
  )
}
