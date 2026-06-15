import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarOff, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"
import { useSearchParams } from "react-router"
import { LeaveSummaryCards } from "@/components/leave/leave-summary-cards"
import { LeaveTypesList } from "@/components/leave/leave-types-list"
import { LeaveTypeDialog } from "@/components/leave/leave-type-dialog"
import { AttendanceSetup } from "@/components/settings/attendance-setup"
import { OfficeHours } from "@/components/settings/office-hours"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { SalarySetup } from "@/components/settings/salary-setup"
import Swal from "sweetalert2"
import {
  useLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
} from "@/hooks/useLeaveTypes"
import type { LeaveType } from "@/types"

export default function SettingsPage() {
  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null)
  const [showAddLeave, setShowAddLeave] = useState(false)

  // TanStack Query
  const { data: leaveTypesData, isLoading: isLoadingLeaveTypes } = useLeaveTypesQuery({
    page: 1,
    limit: 100, // Fetch all leave types for listing
  })

  const createLeaveMutation = useCreateLeaveTypeMutation()
  const updateLeaveMutation = useUpdateLeaveTypeMutation(editingLeave?.id || "")
  const deleteLeaveMutation = useDeleteLeaveTypeMutation()

  const leaveTypes = leaveTypesData?.data || []

  const handleSaveLeaveType = (leaveType: LeaveType) => {
    if (editingLeave) {
      // Update — strip id, createdAt, updatedAt before sending
      const { id, createdAt, updatedAt, ...updatePayload } = leaveType
      updateLeaveMutation.mutate(updatePayload, {
        onSuccess: () => {
          toast.success("Leave type updated!", {
            description: `${leaveType.name} configuration saved.`
          })
          setEditingLeave(null)
          setShowAddLeave(false)
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update leave type")
        }
      })
    } else {
      // Create
      const { id, ...createPayload } = leaveType
      createLeaveMutation.mutate(createPayload, {
        onSuccess: () => {
          toast.success("Leave type added!", {
            description: `${leaveType.name} is now available.`
          })
          setEditingLeave(null)
          setShowAddLeave(false)
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to add leave type")
        }
      })
    }
  }

  const handleOpenEdit = (leave: LeaveType) => {
    setEditingLeave(leave)
    setShowAddLeave(true)
  }

  const handleDeleteLeaveType = (id: string) => {
    const leaveType = leaveTypes.find(l => l.id === id)
    if (!leaveType) return

    Swal.fire({
      title: "Are you sure?",
      text: `Deactivate leave type "${leaveType.name}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, deactivate",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteLeaveMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire("Deactivated!", "Leave type has been deactivated.", "success")
          },
          onError: (err: any) => {
            Swal.fire("Error", err.message || "Failed to deactivate leave type", "error")
          }
        })
      }
    })
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "leave"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 shadow-none border border-border/40">
          <TabsTrigger value="leave" className="text-xs">Leave Management</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance Setup</TabsTrigger>
          <TabsTrigger value="office" className="text-xs">Office Hours</TabsTrigger>
          <TabsTrigger value="salary" className="text-xs">Salary Structure</TabsTrigger>
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

            {isLoadingLeaveTypes ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Use Leave Components */}
                <LeaveSummaryCards leaveTypes={leaveTypes} />
                <LeaveTypesList
                  leaveTypes={leaveTypes}
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteLeaveType}
                />
              </>
            )}

          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceSetup />
        </TabsContent>

        <TabsContent value="office">
          <OfficeHours />
        </TabsContent>

        <TabsContent value="salary">
          <SalarySetup />
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
