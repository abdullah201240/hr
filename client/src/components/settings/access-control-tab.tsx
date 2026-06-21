import { useState, useEffect } from "react"
import { Shield, ShieldAlert, Plus, Trash2, Edit3, UserCheck, CheckSquare, Square, Search, Loader2, Save } from "lucide-react"
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
import type { Role } from "@/hooks/useRoles"
import { useEmployeesQuery, useUpdateEmployeeMutation } from "@/hooks/useEmployees"

export function AccessControlTab() {
  const { data: permissions = [], isLoading: loadingPerms } = usePermissionsQuery()
  const { data: roles = [], isLoading: loadingRoles } = useRolesQuery()
  const customRoles = roles.filter(r => !r.isSystem)
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")

  useEffect(() => {
    if ((!selectedRoleId || !customRoles.some(r => r.id === selectedRoleId)) && customRoles.length > 0) {
      setSelectedRoleId(customRoles[0].id)
    }
  }, [roles, selectedRoleId])
  
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
    if (['employees', 'recruitment', 'letters', 'performance', 'disciplinary', 'separation', 'attendance', 'tasks'].includes(resource)) {
      return 'Workforce & Operations';
    }
    if (['payroll', 'salary', 'claims'].includes(resource)) {
      return 'Finance & Compensation';
    }
    return 'Organization & System';
  };

  const categories = Array.from(new Set(permissions.map(p => getCategory(p.resource))));

  const handleOpenCreateRole = () => {
    setEditingRole(null)
    setRoleForm({ name: "", description: "" })
    setFormPermissions([])
    setShowRoleDialog(true)
  }

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description })
    setFormPermissions(role.permissions)
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

  const toggleAllInCategory = (categoryName: string, checked: boolean) => {
    const categoryPermIds = permissions
      .filter(p => getCategory(p.resource) === categoryName)
      .map(p => p.id);

    if (checked) {
      setFormPermissions(prev => Array.from(new Set([...prev, ...categoryPermIds])));
    } else {
      setFormPermissions(prev => prev.filter(p => !categoryPermIds.includes(p)));
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Roles List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Roles</h3>
            <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handleOpenCreateRole}>
              <Plus className="h-3.5 w-3.5" />
              New Role
            </Button>
          </div>
          <div className="space-y-2">
            {customRoles.map((role) => {
              const isActive = role.id === selectedRoleId
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-border/40 hover:bg-muted/40 hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm flex items-center gap-1.5">
                      <Shield className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {role.name}
                    </span>
                    {!role.isSystem && (
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
            })}
          </div>
        </div>

        {/* Permissions details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRole && (
            <Card className="border border-border/40 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-primary" />
                      {selectedRole.name} Permissions
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {selectedRole.description}
                    </CardDescription>
                  </div>
                  {selectedRole.isSystem && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                      SYSTEM ROLE
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {categories.map((categoryName) => {
                  const categoryPerms = permissions.filter(p => getCategory(p.resource) === categoryName)
                  const categoryPermIds = categoryPerms.map(p => p.id)
                  const allSelected = categoryPermIds.every(id => activePermissions.includes(id))
                  
                  return (
                    <div key={categoryName} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                          {categoryName}
                        </h4>
                        {!selectedRole.isSystem && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] hover:bg-muted"
                            onClick={() => {
                              if (allSelected) {
                                setActivePermissions(prev => prev.filter(p => !categoryPermIds.includes(p)))
                              } else {
                                setActivePermissions(prev => Array.from(new Set([...prev, ...categoryPermIds])))
                              }
                            }}
                          >
                            {allSelected ? "Clear Category" : "Select All"}
                          </Button>
                        )}
                      </div>
                      <Separator className="bg-border/30" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPerms.map((perm) => {
                          const isAssigned = activePermissions.includes(perm.id)
                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleToggleActivePermission(perm.id)}
                              className={`flex items-start gap-2.5 p-2 rounded-md border text-xs transition-all ${
                                !selectedRole.isSystem ? "cursor-pointer hover:border-border/80" : ""
                              } ${
                                isAssigned 
                                  ? "border-primary/20 bg-primary/4" 
                                  : "border-border/30 opacity-70"
                              }`}
                            >
                              <div className="mt-0.5">
                                {isAssigned ? (
                                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {perm.resource.toUpperCase()}:{perm.action.toUpperCase()}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
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
              </CardContent>
              {hasChanges && (
                <CardFooter className="flex items-center justify-between border-t border-border/40 pt-4 mt-4 bg-muted/20">
                  <span className="text-xs text-muted-foreground">You have unsaved changes.</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetChanges} className="h-8">
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
      <Card className="border border-border/40 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Employee Role Assignment
          </CardTitle>
          <CardDescription className="text-xs">
            Assign custom or standard roles to employees to adjust their system access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search employees..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          
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
                      <tr key={emp.id} className="hover:bg-muted/20">
                        <td className="p-3 font-medium">{emp.fullNameEnglish}</td>
                        <td className="p-3 text-muted-foreground">{emp.email}</td>
                        <td className="p-3">
                          {customRole ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-medium">
                              {customRole.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 text-[10px]">No Role Assigned</span>
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
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6">
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
              
              {categories.map((categoryName) => {
                const categoryPerms = permissions.filter(p => getCategory(p.resource) === categoryName)
                const categoryPermIds = categoryPerms.map(p => p.id)
                const allSelected = categoryPermIds.every(id => formPermissions.includes(id))
                
                return (
                  <div key={categoryName} className="space-y-2 border border-border/40 p-3 rounded-lg bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{categoryName}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] hover:bg-muted"
                        onClick={() => toggleAllInCategory(categoryName, !allSelected)}
                      >
                        {allSelected ? "Clear Category" : "Select All"}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {categoryPerms.map((perm) => {
                        const checked = formPermissions.includes(perm.id)
                        return (
                          <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start gap-2 p-2 rounded border text-[11px] cursor-pointer transition-all ${
                              checked 
                                ? "border-primary/30 bg-primary/5" 
                                : "border-border/30 hover:bg-muted/40"
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
                                {perm.resource.toUpperCase()}:{perm.action.toUpperCase()}
                              </p>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
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
