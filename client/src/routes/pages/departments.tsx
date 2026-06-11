import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Users, 
  Plus, 
  Briefcase, 
  Search, 
  TrendingUp, 
  Layers,
  Award
} from "lucide-react"

const initialDepartments = [
  { name: "Engineering", head: "Michael Torres", count: 64, openRoles: 5, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Product", head: "Sarah Chen", count: 32, openRoles: 2, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "Marketing", head: "Anna Williams", count: 28, openRoles: 3, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { name: "Sales", head: "Robert Davis", count: 45, openRoles: 8, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { name: "Human Resources", head: "Patricia Lee", count: 12, openRoles: 1, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { name: "Finance", head: "Thomas Wright", count: 18, openRoles: 2, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
]

const initialDesignations = [
  { name: "Software Engineer", grade: "L1", department: "Engineering", count: 24, openRoles: 2, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Senior Software Engineer", grade: "L2", department: "Engineering", count: 18, openRoles: 1, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Tech Lead", grade: "L3", department: "Engineering", count: 8, openRoles: 1, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Engineering Manager", grade: "L4", department: "Engineering", count: 4, openRoles: 1, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { name: "Product Manager", grade: "L3", department: "Product", count: 12, openRoles: 1, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "Designer", grade: "L2", department: "Product", count: 14, openRoles: 2, color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  { name: "HR Specialist", grade: "L2", department: "HR", count: 6, openRoles: 0, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  { name: "Finance Analyst", grade: "L2", department: "Finance", count: 8, openRoles: 1, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { name: "Marketing Lead", grade: "L3", department: "Marketing", count: 10, openRoles: 2, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { name: "Sales Rep", grade: "L1", department: "Sales", count: 20, openRoles: 5, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
]

export default function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState("departments")
  const [deptSearch, setDeptSearch] = useState("")
  const [desgSearch, setDesgSearch] = useState("")

  const filteredDepts = initialDepartments.filter(dept => 
    dept.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    dept.head.toLowerCase().includes(deptSearch.toLowerCase())
  )

  const filteredDesgs = initialDesignations.filter(desg => 
    desg.name.toLowerCase().includes(desgSearch.toLowerCase()) ||
    desg.department.toLowerCase().includes(desgSearch.toLowerCase()) ||
    desg.grade.toLowerCase().includes(desgSearch.toLowerCase())
  )

  // Calculations for Department KPIs
  const totalDepts = initialDepartments.length
  const totalMembers = initialDepartments.reduce((acc, curr) => acc + curr.count, 0)
  const totalOpenRoles = initialDepartments.reduce((acc, curr) => acc + curr.openRoles, 0)
  const avgDeptSize = Math.round(totalMembers / totalDepts)

  // Calculations for Designation KPIs
  const totalDesgs = initialDesignations.length
  const uniqueGrades = new Set(initialDesignations.map(d => d.grade)).size
  const maxAllocatedRole = initialDesignations.reduce((prev, current) => (prev.count > current.count) ? prev : current)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organization Structure</h2>
          <p className="text-muted-foreground">Manage departments, designations, roles and pay-grades</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {activeTab === "departments" ? "Add Department" : "Add Designation"}
        </Button>
      </div>

      <Tabs defaultValue="departments" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 shadow-none border border-border/40 bg-muted/20">
          <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          <TabsTrigger value="designations" className="text-xs">Designations</TabsTrigger>
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open Positions</span>
                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{totalOpenRoles}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
            />
          </div>

          {/* Grid list - Borderless & Shadowless */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepts.map((dept) => (
              <div key={dept.name} className="p-5 rounded-2xl bg-muted/20 hover:bg-muted/35 transition-all duration-300 flex flex-col justify-between h-40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${dept.color}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold bg-primary/8 text-primary border-none">
                      {dept.openRoles} Open Roles
                    </Badge>
                  </div>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">{dept.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Head: <span className="font-medium text-foreground/80">{dept.head}</span></p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-3 border-t border-border/10">
                  <Users className="h-3.5 w-3.5" />
                  <span>{dept.count} Members</span>
                </div>
              </div>
            ))}
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
                <p className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400">{uniqueGrades}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Allocated Role</span>
                <p className="text-sm font-bold truncate max-w-[160px] text-emerald-600 dark:text-emerald-500 mt-2">{maxAllocatedRole.name}</p>
                <p className="text-[10px] text-muted-foreground">{maxAllocatedRole.count} active officers</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-muted/30 flex items-center justify-between transition-all duration-300 hover:bg-muted/40">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Designation Openings</span>
                <p className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {initialDesignations.reduce((acc, curr) => acc + curr.openRoles, 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search designations..."
              className="pl-9 bg-transparent border-border/60 hover:border-border transition-colors text-xs h-9"
              value={desgSearch}
              onChange={(e) => setDesgSearch(e.target.value)}
            />
          </div>

          {/* Grid list - Borderless & Shadowless */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDesgs.map((desg) => (
              <div key={desg.name} className="p-5 rounded-2xl bg-muted/20 hover:bg-muted/35 transition-all duration-300 flex flex-col justify-between h-40">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold border-muted-foreground/30 px-2 py-0.5">
                      Grade {desg.grade}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      {desg.department}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold tracking-tight text-foreground line-clamp-1">{desg.name}</h3>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/10">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{desg.count} Occupants</span>
                  </div>
                  {desg.openRoles > 0 && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] font-bold">
                      {desg.openRoles} Vacancy
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
