import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Download,
  Search,
  Users,
  CalendarClock,
  FileCheck,
  ShieldCheck,
} from "lucide-react"

interface ReportItem {
  id: string
  title: string
  desc: string
  date: string
  category: "Workforce" | "Compliance" | "Finance" | "Performance"
  status: "Ready" | "Generating" | "Outdated"
}

const initialReports: ReportItem[] = [
  { id: "REP-01", title: "Headcount Report & Attrition", desc: "Monthly workforce growth and turnover analysis", date: "Jun 2026", category: "Workforce", status: "Ready" },
  { id: "REP-02", title: "EEO / Diversity & Inclusion Compliance", desc: "Equal Employment Opportunity statistics and demographic trends", date: "Q2 2026", category: "Compliance", status: "Ready" },
  { id: "REP-03", title: "FLSA / Overtime Compliance Audit", desc: "Fair Labor Standards Act payroll overtime checking report", date: "May 2026", category: "Compliance", status: "Ready" },
  { id: "REP-04", title: "Monthly Attendance & Absences Summary", desc: "Absence patterns, leave audits, and shift metrics", date: "Jun 2026", category: "Workforce", status: "Ready" },
  { id: "REP-05", title: "Departmental Labor Costs & Payroll", desc: "Detailed breakdown of wage expenses, bonuses, and tax allocations", date: "May 2026", category: "Finance", status: "Ready" },
  { id: "REP-06", title: "Annual Performance Appraisal Audit", desc: "Compliance reporting on reviews completed and pending ratings", date: "Q1 2026", category: "Performance", status: "Outdated" },
  { id: "REP-07", title: "OSHA Safety & Incident Summary", desc: "Occupational Safety and Health compliance incident tracking log", date: "Q2 2026", category: "Compliance", status: "Generating" },
]

export default function ReportsPage() {
  const [reports] = useState<ReportItem[]>(initialReports)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Handle Download Mock
  const handleDownload = (reportTitle: string) => {
    // Generate CSV mock
    const headers = "Metric,Value,Period,Status\n"
    const rows = [
      `"Total headcount",248,"June 2026","Active"`,
      `"Turnover rate","1.2%","Q2 2026","Stable"`,
      `"Compliance audit status","100%","Q2 2026","Passed"`,
    ].join("\n")
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_report.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = reports.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.desc.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || r.category === categoryFilter
    return matchesSearch && matchesCategory
  })

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
                <p className="text-2xl font-bold mt-1">98.5%</p>
                <div className="flex items-center gap-1 mt-0.5 text-emerald-500">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">All Audits Passed</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileCheck className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Workforce Headcount</p>
                <p className="text-2xl font-bold mt-1">248</p>
                <div className="flex items-center gap-1 mt-0.5 text-sky-500">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">+4.8% Year-over-Year</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 shadow-none border-border/40">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Attendance Audit</p>
                <p className="text-2xl font-bold mt-1">94.2%</p>
                <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium">12 Overtime Alerts</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-amber-500" />
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

      {/* Available Reports Table */}
      <Card className="shadow-none border-border/40">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-sm font-bold">HR Analytics & Compliance Ledger</CardTitle>
          <CardDescription className="text-xs">Pre-configured reports compiled in accordance with standard employment regulations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Report Title</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Category</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Date Scope</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(report => (
                    <TableRow key={report.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{report.title}</p>
                          <p className="text-[10px] text-muted-foreground">{report.desc}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {report.category}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                        {report.date}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold py-0.5 px-2 flex items-center gap-1 w-fit",
                          report.status === "Ready" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                          report.status === "Generating" && "bg-sky-500/10 text-sky-600 border-sky-500/20",
                          report.status === "Outdated" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={report.status !== "Ready"}
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-md"
                          onClick={() => handleDownload(report.title)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No reports matching filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
