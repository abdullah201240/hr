import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart3,
  Search,
  Users,
  CalendarClock,
  FileCheck,
  ShieldCheck,
} from "lucide-react"
import { useEmployeesQuery } from "@/hooks/useEmployees"

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { data: employeesData } = useEmployeesQuery({ page: 1, limit: 1 })
  const totalHeadcount = employeesData?.meta?.total ?? 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports & Analytics
          </h2>
          <p className="text-muted-foreground">Monitor global HR metrics, labor costs, and regulatory compliance reports</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Compliance Rating</p>
                <p className="text-2xl font-bold mt-1">—</p>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Data not available</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Workforce Headcount</p>
                <p className="text-2xl font-bold mt-1">{totalHeadcount || "—"}</p>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Active employees</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Attendance Audit</p>
                <p className="text-2xl font-bold mt-1">—</p>
                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">Data not available</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports by title or keywords..."
              className="pl-9 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px] text-xs h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="Workforce" className="text-xs">Workforce Analytics</SelectItem>
              <SelectItem value="Compliance" className="text-xs">Regulatory Compliance</SelectItem>
              <SelectItem value="Finance" className="text-xs">Financial Costs</SelectItem>
              <SelectItem value="Performance" className="text-xs">Performance Reviews</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Reports Table Placeholder */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-sm font-bold">HR Analytics & Compliance Ledger</CardTitle>
          <CardDescription className="text-xs">Reports module — awaiting backend implementation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">No reports available</p>
            <p className="text-xs text-muted-foreground mt-1">Report generation will be implemented in a future update</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
