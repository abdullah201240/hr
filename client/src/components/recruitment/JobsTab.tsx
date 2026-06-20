import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, Edit2, Trash2 } from "lucide-react"

interface JobsTabProps {
  jobs: any[]
  getApplicantCount: (title: string) => number
  setViewingJob: (job: any) => void
  setIsJobDetailOpen: (open: boolean) => void
  handleEditJobClick: (job: any) => void
  deleteJob: (id: string) => void
}

const JOBS_PER_PAGE = 8

export function JobsTab({
  jobs,
  getApplicantCount,
  setViewingJob,
  setIsJobDetailOpen,
  handleEditJobClick,
  deleteJob,
}: JobsTabProps) {
  const [jobsSearch, setJobsSearch] = useState("")
  const [jobsPage, setJobsPage] = useState(1)

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(jobsSearch.toLowerCase()) ||
    job.department.toLowerCase().includes(jobsSearch.toLowerCase()) ||
    job.location.toLowerCase().includes(jobsSearch.toLowerCase())
  )
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  const start = (jobsPage - 1) * JOBS_PER_PAGE
  const paginated = filteredJobs.slice(start, start + JOBS_PER_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">Open Requisitions</h3>
          <p className="text-sm text-muted-foreground">Monitor currently active and filled job requisitions</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search job roles..." className="pl-9 text-xs" value={jobsSearch} onChange={e => { setJobsSearch(e.target.value); setJobsPage(1); }} />
        </div>
      </div>

      <div className="w-full overflow-x-auto bg-transparent">
        <Table>
          <TableHeader className="bg-muted/10 border-b border-border/30">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="font-semibold text-xs text-muted-foreground">Job Title</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground">Department</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Type / Location</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground">Experience</TableHead>
              <TableHead className="hidden md:table-cell font-semibold text-xs text-muted-foreground">Date Opened</TableHead>
              <TableHead className="hidden lg:table-cell font-semibold text-xs text-muted-foreground text-center">Applicants</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
              <TableHead className="w-12 font-semibold text-xs text-muted-foreground" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map(job => (
              <TableRow key={job.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                <TableCell className="py-3">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{job.title}</p>
                    {job.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 max-w-[200px]">{job.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-muted-foreground">{job.department}</TableCell>
                <TableCell className="hidden md:table-cell py-3 text-sm text-muted-foreground">
                  <span className="font-medium">{job.type}</span> • {job.location}
                </TableCell>
                <TableCell className="hidden lg:table-cell py-3 text-sm">{job.experience}</TableCell>
                <TableCell className="hidden md:table-cell py-3 text-sm">{job.dateOpened}</TableCell>
                <TableCell className="hidden lg:table-cell py-3 text-center">
                  <span className="font-bold text-sm">{getApplicantCount(job.title)}</span>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant={job.status === "Open" ? "default" : "secondary"}
                    className={job.status === "Open" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {job.description && (
                        <DropdownMenuItem onClick={() => { setViewingJob(job); setIsJobDetailOpen(true) }}>
                          <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEditJobClick(job)}>
                        <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => deleteJob(job.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5 text-destructive" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center border-b-0">
                  <p className="text-sm text-muted-foreground">No jobs found.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <span className="text-xs text-muted-foreground">Showing {start + 1}–{Math.min(start + JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setJobsPage(p => Math.max(p - 1, 1))} disabled={jobsPage === 1} className="h-8 text-xs cursor-pointer">Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setJobsPage(p => Math.min(p + 1, totalPages))} disabled={jobsPage === totalPages} className="h-8 text-xs cursor-pointer">Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
