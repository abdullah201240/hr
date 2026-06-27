import { useState, useEffect } from "react"
import { Shield, ShieldAlert, Plus, Trash2, Edit3, UserCheck, CheckSquare, Square, Search, Loader2, Save, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Swal from "sweetalert2"
import { usePermissionsQuery, useRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation } from "@/hooks/useRoles"
import type { Role, Permission } from "@/hooks/useRoles"
import { useEmployeesQuery, useUpdateEmployeeMutation } from "@/hooks/useEmployees"

// Helpers to format resource and action names beautifully
const formatResourceName = (resource: string) => {
  const customMap: Record<string, string> = {
    employees: "Employees Directory",
    recruitment: "Recruitment & Hiring",
    letters: "Letters & Document Templates",
    performance: "Performance Reviews",
    disciplinary: "Disciplinary Actions",
    separation: "Separation & Resignations",
    attendance: "Attendance Tracking",
    tasks: "Tasks & Projects",
    payroll: "Payroll",
    salary: "Salary Structure",
    claims: "Expense Claims",
    leaves: "Leave Management",
    leave: "Leave Management",
    departments: "Departments",
    announcements: "Announcements",
    notifications: "Notifications",
    "attendance-settings": "Attendance Settings",
    "leave-settings": "Leave Settings",
    settings: "System Settings",
    roles: "Access Roles",
    "provident-fund-settings": "Provident Fund",
    dashboard: "Executive Dashboard",
    regulations: "Office Regulations",
    bonus: "Festival Bonus",
    loans: "Employee Loans",
    assets: "IT Asset Inventory",
  };
  const key = resource.toLowerCase();
  if (customMap[key]) return customMap[key];
  return resource
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const formatActionName = (action: string, resource?: string) => {
  const resKey = resource?.toLowerCase() || "";
  const actKey = action.toLowerCase();

  if (resKey === "regulations") {
    const regMap: Record<string, string> = {
      create: "Create Regulation Policies",
      read: "View Regulation Policies",
      update: "Edit Regulation Policies",
      delete: "Delete Regulation Policies",
      apply: "Submit Regulation Requests (Employee)",
      view_own: "View Own Requests (Employee View)",
      view_team: "Line Manager Approval (1st Step - View & Approve Team Requests)",
      view_all: "View All Requests (Admin / HR View)",
      approve: "2nd Step Final Approval (Approve / Reject)",
    };
    if (regMap[actKey]) return regMap[actKey];
  }

  // Custom formatting for leave resource actions to make them clear
  if (resKey === "leave") {
    const leaveMap: Record<string, string> = {
      apply: "Apply for Leaves",
      cancel: "Cancel Leaves",
      create: "Configure Leave Types (Create)",
      update: "Edit Leave Configurations (Update)",
      delete: "Delete Leave Configurations",
      view_own: "View Own Leaves (Employee View)",
      view_team: "Line Manager Approval (View & Approve Team Leaves - 1st Step)",
      approve: "2nd Step Approval (Final Approval / Reject)",
      view_all: "View All Leaves (Admin / HR View)",
    };
    if (leaveMap[actKey]) return leaveMap[actKey];
  }

  // Custom formatting for attendance resource actions to make them clear
  if (resKey === "attendance") {
    const attMap: Record<string, string> = {
      create: "Setup Attendance Rules & Policies (Create)",
      update: "Edit Attendance Configurations (Update)",
      delete: "Delete Attendance Configurations",
      read: "View Own Attendance Logs",
      view_all: "View All Employee Attendance Logs (HR View)",
      approve: "Approve Attendance Corrections",
    };
    if (attMap[actKey]) return attMap[actKey];
  }

  // Custom formatting for payroll resource actions to make them clear
  if (resKey === "payroll") {
    const payMap: Record<string, string> = {
      create: "Setup Salary Structures & Payroll Cycles (Create)",
      read: "View Payroll Reports & Structures",
      process: "Process & Run Payroll Payouts",
      disburse: "Disburse Payroll Funds",
      view_own: "View Own Payslips (Employee View)",
      view_all: "View Company Payroll Details (Admin / HR View)",
    };
    if (payMap[actKey]) return payMap[actKey];
  }

  // Custom formatting for bonus resource actions to make them clear
  if (resKey === "bonus") {
    const bonusMap: Record<string, string> = {
      create: "Setup Festival Bonus settings and cycles (Create)",
      read: "View Festival Bonus sheets and details",
      process: "Process calculations and overrides for Festival Bonus",
      approve_lm: "Line Manager approval for subordinates bonus",
      approve_md: "MD final approval for festival bonus",
      disburse: "Disburse festival bonus funds",
    };
    if (bonusMap[actKey]) return bonusMap[actKey];
  }

  // Custom formatting for settings resource actions to make them clear
  if (resKey === "settings") {
    const setMap: Record<string, string> = {
      read: "View Access Control & System Settings (Read)",
      update: "Modify Access Roles, Permissions, & System Settings (Update)",
    };
    if (setMap[actKey]) return setMap[actKey];
  }

  // Custom formatting for executive dashboard resource actions
  if (resKey === "dashboard") {
    const dashMap: Record<string, string> = {
      view_executive: "View CEO Executive Dashboard (Cross-Module Analytics)",
    };
    if (dashMap[actKey]) return dashMap[actKey];
  }

  const customMap: Record<string, string> = {
    read: "View / Read",
    create: "Create / Add",
    update: "Edit / Update",
    delete: "Delete",
    approve: "Approve / Reject",
    manage: "Full Control (Manage)",
    "read:me": "View Self Details",
  };
  if (customMap[actKey]) return customMap[actKey];
  return action
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

export function AccessControlTab() {
  const { data: rawPermissions = [], isLoading: loadingPerms } = usePermissionsQuery()
  const { data: roles = [], isLoading: loadingRoles } = useRolesQuery()

  // Filter out redundant leave:reject permission from Settings screen since leave:approve handles both actions
  const permissions = rawPermissions.filter(p => !(p.resource === "leave" && p.action === "reject"))
  
  const systemRoles = roles.filter(r => r.isSystem)
  const customRoles = roles.filter(r => !r.isSystem)
  
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [permissionSearch, setPermissionSearch] = useState("")
  const [dialogPermissionSearch, setDialogPermissionSearch] = useState("")

  // Default to first role (either system or custom) if none is selected
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      // Prefer Admin or System role, or just first available
      const adminRole = roles.find(r => r.name.toLowerCase() === "admin") || roles[0]
      setSelectedRoleId(adminRole.id)
    }
  }, [roles, selectedRoleId])

  // Clear search query when switching roles
  useEffect(() => {
    setPermissionSearch("")
  }, [selectedRoleId])
  
  // Dialog state for adding/editing custom roles
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({ name: "", description: "" })
  const [formPermissions, setFormPermissions] = useState<string[]>([])
  
  // Mutations
  const createRoleMutation = useCreateRoleMutation()
  const updateRoleMutation = useUpdateRoleMutation(editingRole?.id || "")
  const deleteRoleMutation = useDeleteRoleMutation()
  
  // Employees list for assignment
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [assigningEmployeeId, setAssigningEmployeeId] = useState<string | null>(null)
  const [assignedRole, setAssignedRole] = useState<{ customRoleId: string }>({ customRoleId: "none" })
  
  const { data: employeesData, isLoading: loadingEmployees } = useEmployeesQuery({
    page: 1,
    limit: 100,
    search: employeeSearch,
  })
  const updateEmployeeMutation = useUpdateEmployeeMutation(assigningEmployeeId || "")

  const employees = employeesData?.data || []
  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  // Local state for interactive editing of permissions
  const [activePermissions, setActivePermissions] = useState<string[]>([])
  
  useEffect(() => {
    if (selectedRole) {
      setActivePermissions(selectedRole.permissions || [])
    }
  }, [selectedRoleId, roles])

  const savePermissionsMutation = useUpdateRoleMutation(selectedRoleId)

  const handleToggleActivePermission = (id: string) => {
    if (selectedRole?.isSystem) return
    setActivePermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleResetChanges = () => {
    if (selectedRole) {
      setActivePermissions(selectedRole.permissions || [])
    }
  }

  const handleSaveChanges = () => {
    if (!selectedRole) return
    savePermissionsMutation.mutate({
      name: selectedRole.name,
      description: selectedRole.description,
      permissionIds: activePermissions,
    }, {
      onSuccess: () => {
        toast.success("Permissions updated successfully")
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update permissions")
      }
    })
  }

  const hasChanges = selectedRole && !selectedRole.isSystem && (
    activePermissions.length !== (selectedRole.permissions || []).length ||
    !activePermissions.every(p => (selectedRole.permissions || []).includes(p))
  )

  // Group permissions by resource category for cleaner presentation
  const getCategory = (resource: string) => {
    const resLower = resource.toLowerCase();
    if (['employees', 'recruitment', 'letters', 'performance', 'disciplinary', 'separation', 'attendance', 'tasks', 'leave'].includes(resLower)) {
      return 'Workforce & Operations';
    }
    if (['payroll', 'salary', 'claims', 'provident-fund-settings', 'bonus'].includes(resLower)) {
      return 'Finance & Compensation';
    }
    if (['dashboard'].includes(resLower)) {
      return 'Executive & Analytics';
    }
    return 'Organization & System';
  };

  // Helper to group, filter, and sort permissions
  const getGroupedSortedPermissions = (perms: Permission[], query: string) => {
    const filtered = perms.filter(p => {
      if (!query) return true;
      const q = query.toLowerCase();
      const formattedRes = formatResourceName(p.resource).toLowerCase();
      const formattedAct = formatActionName(p.action, p.resource).toLowerCase();
      const rawRes = p.resource.toLowerCase();
      const rawAct = p.action.toLowerCase();
      const desc = p.description.toLowerCase();
      return (
        formattedRes.includes(q) ||
        formattedAct.includes(q) ||
        rawRes.includes(q) ||
        rawAct.includes(q) ||
        desc.includes(q)
      );
    });

    const categories: Record<string, Record<string, Permission[]>> = {};

    filtered.forEach(p => {
      const cat = getCategory(p.resource);
      if (!categories[cat]) {
        categories[cat] = {};
      }
      const res = p.resource;
      if (!categories[cat][res]) {
        categories[cat][res] = [];
      }
      categories[cat][res].push(p);
    });

    const result: Record<string, Array<{ resource: string; permissions: Permission[] }>> = {};

    // Sort order for categories
    const categoryOrder = ['Workforce & Operations', 'Finance & Compensation', 'Executive & Analytics', 'Organization & System'];
    
    categoryOrder.forEach(cat => {
      if (!categories[cat]) return;
      
      const resourceGroups = categories[cat];
      const sortedResources = Object.keys(resourceGroups).sort((a, b) => 
        formatResourceName(a).localeCompare(formatResourceName(b))
      );

      result[cat] = sortedResources.map(res => {
        const sortedPerms = [...resourceGroups[res]].sort((a, b) =>
          formatActionName(a.action, a.resource).localeCompare(formatActionName(b.action, b.resource))
        );
        return {
          resource: res,
          permissions: sortedPerms
        };
      });
    });

    return result;
  };

  const handleOpenCreateRole = () => {
    setEditingRole(null)
    setRoleForm({ name: "", description: "" })
    setFormPermissions([])
    setDialogPermissionSearch("")
    setShowRoleDialog(true)
  }

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description })
    setFormPermissions(role.permissions)
    setDialogPermissionSearch("")
    setShowRoleDialog(true)
  }

  const handleSaveRole = () => {
    if (!roleForm.name.trim()) {
      toast.error("Role Name is required")
      return
    }

    if (editingRole) {
      updateRoleMutation.mutate({
        name: roleForm.name,
        description: roleForm.description,
        permissionIds: formPermissions,
      }, {
        onSuccess: () => {
          toast.success("Role updated successfully")
          setShowRoleDialog(false)
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to update role")
        }
      })
    } else {
      createRoleMutation.mutate({
        name: roleForm.name,
        description: roleForm.description,
        permissionIds: formPermissions,
      }, {
        onSuccess: () => {
          toast.success("Custom role created successfully")
          setShowRoleDialog(false)
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create role")
        }
      })
    }
  }

  const handleDeleteRole = (role: Role) => {
    Swal.fire({
      title: "Delete Custom Role?",
      text: `Are you sure you want to delete the "${role.name}" role? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteRoleMutation.mutate(role.id, {
          onSuccess: () => {
            toast.success("Role deleted successfully")
            if (selectedRoleId === role.id) {
              setSelectedRoleId("")
            }
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to delete role")
          }
        })
      }
    })
  }

  const togglePermission = (id: string) => {
    setFormPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleAllInResourceForm = (permIds: string[], checked: boolean) => {
    if (checked) {
      setFormPermissions(prev => Array.from(new Set([...prev, ...permIds])));
    } else {
      setFormPermissions(prev => prev.filter(p => !permIds.includes(p)));
    }
  }

  const handleOpenAssignRole = (emp: any) => {
    setAssigningEmployeeId(emp.id)
    setAssignedRole({
      customRoleId: emp.customRoleId || "none"
    })
  }

  const handleSaveRoleAssignment = () => {
    if (!assigningEmployeeId) return

    updateEmployeeMutation.mutate({
      customRoleId: assignedRole.customRoleId && assignedRole.customRoleId !== "none" ? assignedRole.customRoleId : null,
    }, {
      onSuccess: () => {
        toast.success("Employee role updated successfully")
        setAssigningEmployeeId(null)
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to update employee role")
      }
    })
  }

  if (loadingPerms || loadingRoles) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const groupedPermissions = getGroupedSortedPermissions(permissions, permissionSearch);
  const groupedDialogPermissions = getGroupedSortedPermissions(permissions, dialogPermissionSearch);

  // Render a role list item (for left panel)
  const renderRoleItem = (role: Role) => {
    const isActive = role.id === selectedRoleId
    return (
      <div
        key={role.id}
        onClick={() => setSelectedRoleId(role.id)}
        className={`flex flex-col p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
          isActive
            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
            : "border-border/40 hover:bg-muted/40 hover:border-border/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
            <Shield className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            {role.name}
          </span>
          {role.isSystem ? (
            <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
              System
            </span>
          ) : (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => handleOpenEditRole(role)}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteRole(role)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1 line-clamp-1">{role.description}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Roles List */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Access Roles</h3>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handleOpenCreateRole}>
              <Plus className="h-3.5 w-3.5" />
              New Role
            </Button>
          </div>
          
          <div className="space-y-4">
            {systemRoles.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">System Default Roles</span>
                <div className="space-y-2">
                  {systemRoles.map(renderRoleItem)}
                </div>
              </div>
            )}
            
            {customRoles.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">Custom Roles</span>
                <div className="space-y-2">
                  {customRoles.map(renderRoleItem)}
                </div>
              </div>
            )}
          </div>
        </div>
 
        {/* Permissions details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRole && (
            <Card className="border border-border/40 shadow-sm bg-card">
              <CardHeader className="pb-4 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                      {selectedRole.name} Permissions
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedRole.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRole.isSystem && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-medium">
                        READ ONLY SYSTEM ROLE
                      </span>
                    )}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search permissions..."
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        className="pl-8 h-9 text-xs w-48 md:w-60"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-8">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No permissions match your search query.
                  </div>
                ) : (
                  Object.keys(groupedPermissions).map((categoryName) => {
                    const resourceGroups = groupedPermissions[categoryName]
                    
                    return (
                      <div key={categoryName} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                            {categoryName}
                          </h4>
                        </div>
                        
                        <div className="space-y-4">
                          {resourceGroups.map(({ resource, permissions: resourcePerms }) => {
                            const permIds = resourcePerms.map(p => p.id)
                            const allSelected = permIds.every(id => activePermissions.includes(id))
                            const formattedResource = formatResourceName(resource)

                            return (
                              <div key={resource} className="border border-border/40 rounded-lg overflow-hidden bg-muted/10">
                                <div className="bg-muted/30 px-4 py-2.5 flex items-center justify-between border-b border-border/40">
                                  <span className="text-xs font-bold text-foreground/90 flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    {formattedResource}
                                  </span>
                                  {!selectedRole.isSystem && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-[10px] hover:bg-muted font-medium text-primary hover:text-primary"
                                      onClick={() => {
                                        if (allSelected) {
                                          setActivePermissions(prev => prev.filter(p => !permIds.includes(p)))
                                        } else {
                                          setActivePermissions(prev => Array.from(new Set([...prev, ...permIds])))
                                        }
                                      }}
                                    >
                                      {allSelected ? "Clear Resource" : "Grant All"}
                                    </Button>
                                  )}
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  {resourcePerms.map((perm) => {
                                    const isAssigned = activePermissions.includes(perm.id)
                                    return (
                                      <div
                                        key={perm.id}
                                        onClick={() => handleToggleActivePermission(perm.id)}
                                        className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-all ${
                                          !selectedRole.isSystem 
                                            ? "cursor-pointer hover:bg-background/80 hover:border-border/80" 
                                            : "opacity-85"
                                        } ${
                                          isAssigned 
                                            ? "border-primary/20 bg-background shadow-xs ring-1 ring-primary/5" 
                                            : "border-border/30 bg-background/50 opacity-60"
                                        }`}
                                      >
                                        <div className="mt-0.5">
                                          {isAssigned ? (
                                            <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                          ) : (
                                            <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                                          )}
                                        </div>
                                        <div className="space-y-0.5">
                                          <p className="font-semibold text-foreground">
                                            {formatActionName(perm.action, perm.resource)}
                                          </p>
                                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            {perm.description}
                                          </p>
                                          <p className="text-[9px] font-mono text-muted-foreground/60">
                                            {perm.resource}:{perm.action}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <Separator className="bg-border/30 my-4" />
                      </div>
                    )
                  })
                )}
              </CardContent>
              {hasChanges && (
                <CardFooter className="flex items-center justify-between border-t border-border/40 pt-4 pb-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Unsaved permissions modified.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetChanges} className="h-8 gap-1">
                      <Undo2 className="h-3 w-3" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleSaveChanges} disabled={savePermissionsMutation.isPending} className="h-8 gap-1.5">
                      {savePermissionsMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </div>
 
      <Separator className="my-6 bg-border/40" />
 
      {/* Employee Role Assignment */}
      <Card className="border border-border/40 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <UserCheck className="h-5 w-5 text-primary" />
                Employee Role Assignment
              </CardTitle>
              <CardDescription className="text-xs">
                Assign custom roles to employees to adjust their system access.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border border-border/40 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/40 font-semibold border-b border-border/40">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {employees.map((emp) => {
                    const customRole = roles.find(r => r.id === emp.customRoleId)
                    return (
                      <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-medium text-foreground">{emp.fullNameEnglish}</td>
                        <td className="p-3 text-muted-foreground">{emp.email}</td>
                        <td className="p-3">
                          {customRole ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded text-[10px] font-medium border border-primary/20">
                              {customRole.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[10px]">No Custom Role Assigned</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleOpenAssignRole(emp)}>
                            Change Role
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
 
      {/* Create / Edit Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {editingRole ? `Edit Role: ${editingRole.name}` : "Create Custom Role"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure name, description, and permissions for the custom role.
            </DialogDescription>
          </DialogHeader>
 
          <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Role Name</label>
                <Input
                  placeholder="e.g. Payroll Assistant"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Search Permissions</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter permissions..."
                    value={dialogPermissionSearch}
                    onChange={(e) => setDialogPermissionSearch(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Textarea
                placeholder="Enter role responsibilities and privileges..."
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </div>
 
            <Separator className="bg-border/40" />
 
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Permissions</h4>
              
              {Object.keys(groupedDialogPermissions).length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No permissions match your search query.
                </div>
              ) : (
                Object.keys(groupedDialogPermissions).map((categoryName) => {
                  const resourceGroups = groupedDialogPermissions[categoryName]
                  
                  return (
                    <div key={categoryName} className="space-y-3">
                      <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
                        {categoryName}
                      </span>
                      
                      <div className="space-y-3">
                        {resourceGroups.map(({ resource, permissions: resourcePerms }) => {
                          const permIds = resourcePerms.map(p => p.id)
                          const allSelected = permIds.every(id => formPermissions.includes(id))
                          const formattedResource = formatResourceName(resource)

                          return (
                            <div key={resource} className="border border-border/40 p-3 rounded-lg bg-muted/10">
                              <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-2">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                  {formattedResource}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-[10px] hover:bg-muted font-medium text-primary"
                                  onClick={() => toggleAllInResourceForm(permIds, !allSelected)}
                                >
                                  {allSelected ? "Clear Resource" : "Grant All"}
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {resourcePerms.map((perm) => {
                                  const checked = formPermissions.includes(perm.id)
                                  return (
                                    <div
                                      key={perm.id}
                                      onClick={() => togglePermission(perm.id)}
                                      className={`flex items-start gap-2.5 p-2 rounded border text-[11px] cursor-pointer transition-all ${
                                        checked 
                                          ? "border-primary/30 bg-background shadow-xs" 
                                          : "border-border/30 hover:bg-muted/40 opacity-75"
                                      }`}
                                    >
                                      <div className="mt-0.5">
                                        {checked ? (
                                          <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                                        ) : (
                                          <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground">
                                          {formatActionName(perm.action, perm.resource)}
                                        </p>
                                        <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-normal">
                                          {perm.description}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
 
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button variant="outline" size="sm" className="h-9" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={handleSaveRole} disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
              {(createRoleMutation.isPending || updateRoleMutation.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Role Assignment Dialog */}
      <Dialog open={assigningEmployeeId !== null} onOpenChange={(open) => { if (!open) setAssigningEmployeeId(null) }}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Assign Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure system roles or custom role configurations.
            </DialogDescription>
          </DialogHeader>
 
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Role</label>
              <Select
                value={assignedRole.customRoleId || "none"}
                onValueChange={(val) => setAssignedRole({ customRoleId: val })}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="none">No Role Assigned</SelectItem>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
 
          <DialogFooter className="border-t border-border/40 pt-4">
            <Button variant="outline" size="sm" className="h-9" onClick={() => setAssigningEmployeeId(null)}>
              Cancel
            </Button>
            <Button size="sm" className="h-9 gap-1.5" onClick={handleSaveRoleAssignment} disabled={updateEmployeeMutation.isPending}>
              {updateEmployeeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

