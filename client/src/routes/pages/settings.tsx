import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarOff, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { useSearchParams } from "react-router"
import { LeaveSummaryCards } from "@/components/leave/leave-summary-cards"
import { LeaveTypesList } from "@/components/leave/leave-types-list"
import { LeaveTypeDialog } from "@/components/leave/leave-type-dialog"
import { AttendanceSetup } from "@/components/settings/attendance-setup"
import { OfficeHours } from "@/components/settings/office-hours"
import { ThemeSettings } from "@/components/settings/theme-settings"
import { SalarySetup } from "@/components/settings/salary-setup"
import { FestivalBonusSetup } from "@/components/settings/festival-bonus-setup"
import Swal from "sweetalert2"
import {
  useLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
} from "@/hooks/useLeaveTypes"
import type { LeaveType } from "@/types"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"
import { AccessControlTab } from "@/components/settings/access-control-tab"
import { usePermissions } from "@/hooks/usePermissions"

export default function SettingsPage() {
  const [editingLeave, setEditingLeave] = useState<LeaveType | null>(null)
  const [showAddLeave, setShowAddLeave] = useState(false)

  // TanStack Query
  const { data: leaveTypesData, isLoading: isLoadingLeaveTypes } = useLeaveTypesQuery({
    page: 1,
    limit: 100, // Fetch all leave types for listing
  })

  const createLeaveMutation = useCreateLeaveTypeMutation()
  const updateLeaveMutation = useUpdateLeaveTypeMutation()

  const leaveTypes = leaveTypesData?.data || []

  const handleSaveLeaveType = (leaveType: LeaveType) => {
    if (editingLeave) {
      // Update — strip id, createdAt, updatedAt before sending
      const { id, createdAt, updatedAt, ...updatePayload } = leaveType
      updateLeaveMutation.mutate({ id, payload: updatePayload }, {
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

  const handleToggleActive = (leave: LeaveType) => {
    const newIsActive = !leave.isActive
    const statusText = newIsActive ? "activated" : "deactivated"

    Swal.fire({
      title: `${newIsActive ? "Activate" : "Deactivate"} Leave Type?`,
      text: `"${leave.name}" will be ${statusText}. ${newIsActive ? "It will become available for leave applications." : "It will no longer be available for new leave applications."}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: newIsActive ? "Activate" : "Deactivate",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: `swal2-confirm swal2-styled ${newIsActive ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'} text-white font-semibold rounded-md px-4 py-2 mr-2`,
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        updateLeaveMutation.mutate(
          { id: leave.id, payload: { isActive: newIsActive } },
          {
            onSuccess: () => {
              toast.success(`Leave type ${statusText}!`)
            },
            onError: (err: any) => {
              toast.error(err.message || `Failed to ${statusText} leave type`)
            }
          }
        )
      }
    })
  }

  const { hasAnyPermission } = usePermissions()

  const tabsConfig = [
    {
      value: "leave",
      label: "Leave Management",
      permissions: ["leave:create", "leave:update", "leave:delete"],
    },
    {
      value: "attendance",
      label: "Attendance Setup",
      permissions: ["attendance:create", "attendance:update", "attendance:delete"],
    },
    {
      value: "office",
      label: "Office Hours",
      permissions: ["attendance:create", "attendance:update", "attendance:delete"],
    },
    {
      value: "salary",
      label: "Salary Structure",
      permissions: ["payroll:create", "payroll:process", "payroll:read"],
    },
    {
      value: "bonus",
      label: "Festival Bonus Settings",
      permissions: ["payroll:create", "payroll:process", "payroll:read"],
    },
    {
      value: "appearance",
      label: "Theme",
    },
    {
      value: "notifications",
      label: "Notification Settings",
    },
    {
      value: "access",
      label: "Access Control",
      permissions: ["settings:read", "settings:update"],
    },
  ]

  const visibleTabs = tabsConfig.filter(
    (t) => !t.permissions || hasAnyPermission(t.permissions)
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get("tab") || "leave"

  const isTabVisible = visibleTabs.some((t) => t.value === activeTab)
  const currentTab = isTabVisible ? activeTab : (visibleTabs[0]?.value || "")

  useEffect(() => {
    if (visibleTabs.length > 0 && !isTabVisible) {
      setSearchParams({ tab: visibleTabs[0].value }, { replace: true })
    }
  }, [visibleTabs, isTabVisible, setSearchParams])

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
  }[visibleTabs.length] || "grid-cols-7"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid w-full ${gridColsClass} shadow-none border border-border/40`}>
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleTabs.some((t) => t.value === "leave") && (
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
                    onToggleActive={handleToggleActive}
                  />
                </>
              )}
            </div>
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "attendance") && (
          <TabsContent value="attendance">
            <AttendanceSetup />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "office") && (
          <TabsContent value="office">
            <OfficeHours />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "salary") && (
          <TabsContent value="salary">
            <SalarySetup />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "bonus") && (
          <TabsContent value="bonus">
            <FestivalBonusSetup />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "appearance") && (
          <TabsContent value="appearance">
            <ThemeSettings />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "notifications") && (
          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>
        )}

        {visibleTabs.some((t) => t.value === "access") && (
          <TabsContent value="access">
            <AccessControlTab />
          </TabsContent>
        )}
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
