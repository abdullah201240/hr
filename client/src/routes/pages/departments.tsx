import { useSearchParams, useNavigate } from "react-router"
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Building2, 
  Users, 
  Plus, 
  Briefcase, 
  Search, 
  TrendingUp, 
  Layers,
  Award,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Network,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Swal from "sweetalert2"
import OrgChart from "@/components/organization/org-chart"
import { useOrgStore } from "@/store/useOrgStore"
import { useDepartmentsQuery, useDeleteDepartmentMutation } from "@/hooks/useDepartments"
import { useDesignationsQuery, useDeleteDesignationMutation } from "@/hooks/useDesignations"

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const { 
    activeTab, 
    deptSearch, 
    desgSearch, 
    deptPage, 
    desgPage, 
    setActiveTab, 
    setDeptSearch, 
    setDesgSearch 
  } = useOrgStore()

  // Sync tab with URL search parameter
  const urlTab = searchParams.get("tab") || "departments"
  useEffect(() => {
    if (urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [urlTab, activeTab, setActiveTab])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  // TanStack Query
  const { data: deptsData, isLoading: isLoadingDepts, refetch: refetchDepts } = useDepartmentsQuery({
    page: deptPage,
    limit: 50, // Fetch up to 50 for listing
    search: deptSearch,
  })

  const { data: desgsData, isLoading: isLoadingDesgs, refetch: refetchDesgs } = useDesignationsQuery({
    page: desgPage,
    limit: 50,
    search: desgSearch,
  })

  const deleteDeptMutation = useDeleteDepartmentMutation()
  const deleteDesgMutation = useDeleteDesignationMutation()

  const handleDeleteDept = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Deactivate department "${name}"? This cannot be undone.`,
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
        deleteDeptMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire("Deactivated!", "Department has been deactivated.", "success")
          },
          onError: (err: Error) => {
            Swal.fire("Error", err.message || "Failed to deactivate department", "error")
          }
        })
      }
    })
  }

  const handleDeleteDesg = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Deactivate designation "${name}"? This cannot be undone.`,
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
        deleteDesgMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire("Deactivated!", "Designation has been deactivated.", "success")
          },
          onError: (err: Error) => {
            Swal.fire("Error", err.message || "Failed to deactivate designation", "error")
          }
        })
      }
    })
  }

  // Calculations for Department KPIs
  const departments = deptsData?.data || []
  const totalDepts = deptsData?.meta?.total || departments.length
  // Open Roles & size are computed from loaded data
  const totalMembers = departments.reduce((acc, curr) => acc + (Number(curr.employeeCount) || 0), 0)
  const avgDeptSize = totalDepts > 0 ? Math.round(totalMembers / totalDepts) : 0

  // Calculations for Designation KPIs
  const designations = desgsData?.data || []
  const totalDesgs = desgsData?.meta?.total || designations.length
  const uniqueGrades = new Set(designations.map(d => d.grade)).size
  const maxAllocatedRole = designations.length > 0 
    ? designations.reduce((prev, current) => ((prev.employeeCount || 0) > (current.employeeCount || 0)) ? prev : current)
    : { name: "N/A", employeeCount: 0 }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organization Structure</h2>
          <p className="text-muted-foreground">Manage departments, designations, roles and pay-grades</p>
        </div>
        <Button 
          className="gap-2" 
          onClick={() => navigate(activeTab === "departments" ? "/departments/create" : activeTab === "designations" ? "/designations/create" : "#")}
          disabled={activeTab === "orgchart"}
        >
          <Plus className="h-4 w-4" />
          {activeTab === "departments" ? "Add Department" : activeTab === "designations" ? "Add Designation" : "Edit in Tree"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-[500px] grid-cols-3 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          <TabsTrigger value="designations" className="text-xs">Designations</TabsTrigger>
          <TabsTrigger value="orgchart" className="text-xs">Org Chart</TabsTrigger>
        </TabsList>

        {/* DEPARTMENTS TAB CONTENT */}
        <TabsContent value="departments" className="space-y-6 outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Departments</span>
                <p className="text-3xl font-bold tracking-tight">{totalDepts}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Members</span>
                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-500">{totalMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Dept Size</span>
                <p className="text-3xl font-bold tracking-tight">{avgDeptSize} <span className="text-xs text-muted-foreground font-normal">/ dept</span></p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search departments by name or code..."
                className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => refetchDepts()}>
              <Filter className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto bg-transparent">
            {isLoadingDepts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Department Name</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Department Code</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center border-b-0">
                        <p className="text-sm text-muted-foreground">No departments found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    departments.map((dept) => (
                      <TableRow key={dept.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="cursor-pointer py-3 font-semibold text-sm hover:text-primary transition-colors" onClick={() => navigate(`/departments/view/${dept.id}`)}>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                            {dept.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground py-3">
                          {dept.code}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={dept.isActive ? "default" : "secondary"} className={dept.isActive ? "bg-emerald-500/10 text-emerald-600 border-none text-[10px]" : "border-none text-[10px]"}>
                            {dept.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => navigate(`/departments/view/${dept.id}`)}>
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/departments/edit/${dept.id}`)}>
                                <Edit2 className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleDeleteDept(dept.id, dept.name)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ORG CHART TAB CONTENT */}
        <TabsContent value="orgchart" className="space-y-6 outline-none">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Enterprise Organization Chart</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full hierarchy from CEO to individual contributors.
                </p>
              </div>
            </div>
            <OrgChart />
          </div>
        </TabsContent>

        {/* DESIGNATIONS TAB CONTENT */}
        <TabsContent value="designations" className="space-y-6 outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Designations</span>
                <p className="text-3xl font-bold tracking-tight">{totalDesgs}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pay Grade Bands</span>
                <p className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{uniqueGrades || 0}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Allocated Role</span>
                <p className="text-sm font-bold truncate max-w-[160px] text-emerald-600 dark:text-emerald-500 mt-2">{maxAllocatedRole.name}</p>
                <p className="text-[10px] text-muted-foreground">{maxAllocatedRole.employeeCount || 0} active officers</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Employees</span>
                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {designations.reduce((acc, d) => acc + (d.employeeCount || 0), 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search designations by name or code..."
                className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
                value={desgSearch}
                onChange={(e) => setDesgSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={() => refetchDesgs()}>
              <Filter className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Table Container */}
          <div className="w-full overflow-x-auto bg-transparent">
            {isLoadingDesgs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Designation Title</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Code</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Pay Grade</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center border-b-0">
                        <p className="text-sm text-muted-foreground">No designations found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    designations.map((desg) => (
                      <TableRow key={desg.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="cursor-pointer py-3 font-semibold text-sm hover:text-primary transition-colors" onClick={() => navigate(`/designations/view/${desg.id}`)}>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
                              <Briefcase className="h-4 w-4" />
                            </div>
                            {desg.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          {desg.code}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/30 px-2 py-0.5">
                            Grade {desg.grade || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant={desg.isActive ? "default" : "secondary"} className={desg.isActive ? "bg-emerald-500/10 text-emerald-600 border-none text-[10px]" : "border-none text-[10px]"}>
                            {desg.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => navigate(`/designations/view/${desg.id}`)}>
                                <Eye className="mr-2 h-3.5 w-3.5" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/designations/edit/${desg.id}`)}>
                                <Edit2 className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onClick={() => handleDeleteDesg(desg.id, desg.name)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
