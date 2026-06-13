import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarOff, Plus } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { LeaveSummaryCards } from "@/components/leave/leave-summary-cards"
import { LeaveTypesList } from "@/components/leave/leave-types-list"
import { LeaveTypeDialog } from "@/components/leave/leave-type-dialog"
import { AttendanceSetup } from "@/components/settings/attendance-setup"
import { OfficeHours } from "@/components/settings/office-hours"
import { ThemeSettings } from "@/components/settings/theme-settings"

// ─── Leave Type Interface ─────────────────────────────────────────────────────
interface LeaveType {
  id: string
  name: string
  icon: any
  color: string
  days: number
  paid: boolean
  carryForward: boolean
  maxCarryOver: number
  requiresApproval: boolean
  requiresDocument: boolean
  description: string
}

export default function SettingsPage() {
  // Leave Management States
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([
    {
      id: "annual",
      name: "Annual Leave",
      icon: "Plane",
      color: "bg-sky-500",
      days: 18,
      paid: true,
      carryForward: true,
      maxCarryOver: 5,
      requiresApproval: true,
      requiresDocument: false,
      description: "Paid time off for vacation and personal rest"
    },
    {
      id: "sick",
      name: "Sick Leave",
      icon: "Heart",
      color: "bg-rose-500",
      days: 10,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: true,
      description: "Paid leave for illness or medical appointments"
    },
    {
      id: "casual",
      name: "Casual Leave",
      icon: "CalendarOff",
      color: "bg-amber-500",
      days: 5,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: false,
      description: "Short-term leave for personal matters"
    },
    {
      id: "maternity",
      name: "Maternity Leave",
      icon: "Baby",
      color: "bg-pink-500",
      days: 90,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: true,
      description: "Paid leave for new mothers (ILO standard)"
    },
    {
      id: "paternity",
      name: "Paternity Leave",
      icon: "Users",
      color: "bg-blue-500",
      days: 15,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: true,
      description: "Paid leave for new fathers"
    },
    {
      id: "training",
      name: "Training Leave",
      icon: "GraduationCap",
      color: "bg-violet-500",
      days: 3,
      paid: true,
      carryForward: true,
      maxCarryOver: 3,
      requiresApproval: true,
      requiresDocument: true,
      description: "Paid leave for professional development"
    },
    {
      id: "bereavement",
      name: "Bereavement Leave",
      icon: "AlertCircle",
      color: "bg-gray-500",
      days: 5,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: false,
      requiresDocument: false,
      description: "Paid leave for loss of immediate family member"
    },
    {
      id: "remote",
      name: "Work From Home",
      icon: "Home",
      color: "bg-emerald-500",
      days: 12,
      paid: true,
      carryForward: false,
      maxCarryOver: 0,
      requiresApproval: true,
      requiresDocument: false,
      description: "Remote work days per year"
    }
  ])

  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null)
  const [showAddLeave, setShowAddLeave] = useState(false)

  const handleSaveLeaveType = (leaveType: LeaveType) => {
    const exists = leaveTypes.find(l => l.id === leaveType.id)
    if (exists) {
      setLeaveTypes(leaveTypes.map(l => l.id === leaveType.id ? leaveType : l))
      toast.success("Leave type updated!", {
        description: `${leaveType.name} configuration saved.`
      })
    } else {
      setLeaveTypes([...leaveTypes, leaveType])
      toast.success("Leave type added!", {
        description: `${leaveType.name} is now available.`
      })
    }
    setEditingLeave(null)
    setShowAddLeave(false)
  }

  const handleOpenEdit = (leave: LeaveType) => {
    setEditingLeave(leave)
    setShowAddLeave(true)
  }

  const handleDeleteLeaveType = (id: string) => {
    const leaveType = leaveTypes.find(l => l.id === id)
    setLeaveTypes(leaveTypes.filter(l => l.id !== id))
    toast.success("Leave type removed", {
      description: `${leaveType?.name} has been deleted.`
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="leave" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 shadow-none border border-border/40">
          <TabsTrigger value="leave" className="text-xs">Leave Management</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance Setup</TabsTrigger>
          <TabsTrigger value="office" className="text-xs">Office Hours</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <CalendarOff className="h-5 w-5 text-primary" />
                  Leave Types & Policies
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure international-standard leave types with flexible policies
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingLeave(null)
                  setShowAddLeave(true)
                }}
                className="gap-2 h-9"
              >
                <Plus className="h-4 w-4" />
                Add Leave Type
              </Button>
            </div>

            {/* Use Leave Components */}
            <LeaveSummaryCards leaveTypes={leaveTypes} />
            <LeaveTypesList
              leaveTypes={leaveTypes}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteLeaveType}
            />

          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceSetup />
        </TabsContent>

        <TabsContent value="office">
          <OfficeHours />
        </TabsContent>

        <TabsContent value="appearance">
          <ThemeSettings />
        </TabsContent>
      </Tabs>

      {/* Leave Type Dialog */}
      <LeaveTypeDialog
        open={showAddLeave}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddLeave(false)
            setEditingLeave(null)
          }
        }}
        editingLeave={editingLeave}
        onSave={handleSaveLeaveType}
      />
    </div>
  )
}
