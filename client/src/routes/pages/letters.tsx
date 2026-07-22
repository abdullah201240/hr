import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LetterCreateDialog } from "@/components/letters/LetterCreateDialog"
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
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle2,
  Archive,
  FileCheck,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  ArrowRightLeft,
  Coins,
  Ban,
  Award,
  LogOut,
  ShieldCheck,
  Calendar,
  Eye,
  Printer,
  MoreHorizontal,
  Loader2,
  Edit,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees"
import {
  useLettersQuery,
  useCreateLetterMutation,
  useUpdateLetterMutation,
  useUpdateLetterStatusMutation,
  useDeleteLetterMutation,
  type HRLetter,
} from "@/hooks/useLetters"
import Swal from "sweetalert2"
import { cn } from "@/lib/utils"

// ─── Letter Type Configuration ─────────────────────────────────────────────────
interface LetterTypeConfig {
  id: string
  name: string
  category: "hiring" | "employment" | "discipline" | "exit" | "general"
  icon: LucideIcon
  color: string
  bgColor: string
  description: string
  templateFields: string[]
}

const letterTypes: LetterTypeConfig[] = [
  {
    id: "offer",
    name: "Offer Letter",
    category: "hiring",
    icon: FileCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Job offer with terms and conditions",
    templateFields: ["presentAddress", "designation", "department", "employmentType", "reportingTo", "dutyStation", "proposedJoiningDate", "monthlyGrossSalary", "offerExpiryDate"],
  },
  {
    id: "appointment",
    name: "Appointment Letter",
    category: "hiring",
    icon: UserCheck,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    description: "Official appointment confirmation",
    templateFields: ["presentAddress", "designation", "department", "startDate", "offerLetterDate", "reportingManager", "officeLocation", "salary"],
  },
  {
    id: "confirmation",
    name: "Confirmation Letter",
    category: "employment",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Post-probation employment confirmation",
    templateFields: ["confirmedDesignation", "department", "reportingTo", "workLocation"],
  },
  {
    id: "probation_extension",
    name: "Probation Extension",
    category: "employment",
    icon: Calendar,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Extend probation period",
    templateFields: ["reason", "extensionDuration", "newEndDate"],
  },
  {
    id: "promotion",
    name: "Promotion Letter",
    category: "employment",
    icon: TrendingUp,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    description: "Employee promotion notification",
    templateFields: ["currentDesignation", "newDesignation", "currentGrade", "newGrade", "currentReportingTo", "newReportingTo", "currentGrossSalary", "revGrossSalary", "revBasic", "revHouseRent", "revMedical", "revConveyance", "revOtherAllowance"],
  },
  {
    id: "transfer",
    name: "Transfer Letter",
    category: "employment",
    icon: ArrowRightLeft,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    description: "Role or location transfer",
    templateFields: ["fromLocation", "toLocation", "fromRole", "toRole", "effectiveDate"],
  },
  {
    id: "salary_increment",
    name: "Salary Revision",
    category: "employment",
    icon: Coins,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Salary revision notification",
    templateFields: ["reasonForRevision", "prevBasic", "revBasic", "prevHouseRent", "revHouseRent", "prevMedical", "revMedical", "prevConveyance", "revConveyance", "prevOtherAllowance", "revOtherAllowance", "prevGross", "revGross"],
  },
  {
    id: "warning",
    name: "Show Cause Notice",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Disciplinary show cause notice",
    templateFields: ["incidentDate", "incidentLocation", "relevantPolicy", "description", "deadline"],
  },
  {
    id: "termination",
    name: "Termination Letter",
    category: "discipline",
    icon: Ban,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    description: "Employment termination notice",
    templateFields: ["reason", "lastWorkingDay", "severanceDetails"],
  },
  {
    id: "experience",
    name: "Experience Letter",
    category: "exit",
    icon: Award,
    color: "text-indigo-600",
    bgColor: "bg-indigo-500/10",
    description: "Employment experience certificate",
    templateFields: ["joiningDate", "relievingDate", "designation", "responsibilities"],
  },
  {
    id: "relieving",
    name: "Resignation Acceptance",
    category: "exit",
    icon: LogOut,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    description: "Resignation acceptance and relieving",
    templateFields: ["resignationDate", "noticePeriod", "lastWorkingDay", "reasonForLeaving", "reportingManager"],
  },
  {
    id: "proof_of_employment",
    name: "Proof of Employment",
    category: "general",
    icon: ShieldCheck,
    color: "text-teal-600",
    bgColor: "bg-teal-500/10",
    description: "Employment verification document",
    templateFields: ["designation", "salary", "joiningDate", "employmentType"],
  },
  {
    id: "inquiry_committee",
    name: "Inquiry Committee Appointment",
    category: "discipline",
    icon: ShieldCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Inquiry committee appointment letter",
    templateFields: ["committeeMemberDesignation", "accusedEmployeeName", "accusedEmployeeId", "briefAllegation", "committeeChair", "committeeMembers", "reportDueDate"],
  },
  {
    id: "domestic_inquiry",
    name: "Domestic Inquiry Notice",
    category: "discipline",
    icon: ShieldCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Notice to attend domestic inquiry",
    templateFields: ["explanationDate", "incidentDate", "incidentLocation", "summaryOfAllegation", "inquiryDate", "inquiryTime", "inquiryVenue", "inquiryOfficer"],
  },
  {
    id: "suspension",
    name: "Suspension Pending Investigation",
    category: "discipline",
    icon: Ban,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Suspension pending investigation letter",
    templateFields: ["incidentDate", "natureOfAllegation", "reasonForSuspension"],
  },
  {
    id: "final_warning",
    name: "Final Written Warning",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Final written warning letter",
    templateFields: ["previousWarningDate", "incidentDate", "incidentLocation", "description", "verbalCounselingDate", "firstWarningDate", "employeeExplanationDate", "policyViolated"],
  },
  {
    id: "first_warning",
    name: "First Written Warning",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "First written warning letter",
    templateFields: ["incidentDate", "incidentLocation", "description", "previousCounseling", "policyBreach"],
  },
]

// ─── Helper Functions ───────────────────────────────────────────────────────────
const getLetterTypeConfig = (typeId: string): LetterTypeConfig | undefined =>
  letterTypes.find((lt) => lt.id === typeId)

const getStatusStyle = (status: HRLetter["status"]) => {
  switch (status) {
    case "Draft":
      return "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/10"
    case "Sent":
      return "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/10"
    case "Signed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
    case "Archived":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
  }
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    hiring: "Hiring",
    employment: "Employment",
    discipline: "Discipline",
    exit: "Exit",
    general: "General",
  }
  return labels[category] || category
}



export default function LettersPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [page] = useState(1)

  // API Queries & Mutations
  const { data: lettersData, isLoading: isLettersLoading } = useLettersQuery({
    search: searchTerm,
    type: filterType,
    status: filterStatus,
    page,
    limit: 15,
  })
  const { data: employeeOptions = [] } = useEmployeeOptionsQuery()

  const createMutation = useCreateLetterMutation()
  const updateMutation = useUpdateLetterMutation()
  const updateStatusMutation = useUpdateLetterStatusMutation()
  const deleteMutation = useDeleteLetterMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [letterToEdit, setLetterToEdit] = useState<HRLetter | null>(null)


  // Stats
  const lettersList = lettersData?.data || []
  const totalLetters = lettersData?.meta?.total || 0
  const pendingLetters = lettersList.filter((l) => l.status === "Draft").length
  const sentLetters = lettersList.filter((l) => l.status === "Sent").length
  const signedLetters = lettersList.filter((l) => l.status === "Signed").length

  const handleCreateLetterSubmit = async (payload: any) => {
    try {
      if (letterToEdit) {
        await updateMutation.mutateAsync({ id: letterToEdit.id, payload })
        Swal.fire("Success", "HR Letter has been successfully updated.", "success")
      } else {
        await createMutation.mutateAsync(payload)
        Swal.fire("Success", "HR Letter has been successfully created.", "success")
      }
      setDialogOpen(false)
      setLetterToEdit(null)
    } catch (err: any) {
      Swal.fire("Error", err.message || "Failed to save letter.", "error")
    }
  }

  const handleEditLetter = (letter: HRLetter) => {
    setLetterToEdit(letter)
    setDialogOpen(true)
  }

  // Handle status change
  const handleStatusChange = (id: string, status: HRLetter["status"]) => {
    updateStatusMutation.mutate({ id, status })
  }

  // Handle delete
  const handleDeleteLetter = (id: string) => {
    Swal.fire({
      title: "Delete Letter?",
      text: "Are you sure you want to permanently revoke this issued letter?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            Swal.fire("Deleted", "HR Letter has been deleted.", "success")
          },
        })
      }
    })
  }

  // Open preview
  const openPreview = (letter: HRLetter) => {
    navigate(`/letters/view/${letter.id}`)
  }

  // Print letter - navigate to dedicated print page
  const handlePrintLetter = (letterId: string) => {
    navigate(`/letters/print/${letterId}`)
  }

  if (isLettersLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Loading issued HR documents...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            HR Letter Management
          </h2>
          <p className="text-muted-foreground">Create, manage and track all HR letters</p>
        </div>
        <Button 
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Letter
        </Button>
      </div>

      <LetterCreateDialog
        isOpen={dialogOpen}
        onClose={() => { setDialogOpen(false); setLetterToEdit(null) }}
        employeeOptions={employeeOptions}
        onSubmit={handleCreateLetterSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        letterToEdit={letterToEdit}
      />

      {/* KPI Cards - Compact Style */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Letters</p>
                <p className="text-2xl font-bold mt-1">{totalLetters}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">All HR letters</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1">{pendingLetters}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Draft letters</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Archive className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold mt-1">{sentLetters}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Delivered letters</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Signed</p>
                <p className="text-2xl font-bold mt-1">{signedLetters}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Completed letters</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search letters by employee, ID, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2 min-w-[120px]"
          >
            <option value="all">All Types</option>
            {letterTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent border border-border/60 hover:border-border transition-colors text-xs h-9 rounded-md px-2 min-w-[120px]"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Signed">Signed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10 border-b border-border/30">
              <TableRow className="border-b-0">
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Letter ID</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Employee</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Category</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Subject</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Issue Date</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0">Status</TableHead>
                <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 text-right w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lettersList.length > 0 ? (
                lettersList.map((letter) => {
                  const typeConfig = getLetterTypeConfig(letter.type)
                  return (
                    <TableRow key={letter.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <TableCell className="py-3 font-semibold text-xs">{letter.id}</TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">{letter.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground">{letter.employeeDepartment || "HR Dept"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="text-[10px] capitalize font-medium py-0.5 px-2">
                          {typeConfig ? getCategoryLabel(typeConfig.category) : "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-xs font-medium max-w-[200px] truncate">{letter.subject}</TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground">{letter.issueDate}</TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className={cn("text-[9px] font-bold py-0.5 px-2", getStatusStyle(letter.status))}>
                          {letter.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {letter.status === "Draft" && (
                              <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEditLetter(letter)}>
                                <Edit className="h-3.5 w-3.5" />
                                Edit Document
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openPreview(letter)}>
                              <Eye className="h-3.5 w-3.5" />
                              Preview Document
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handlePrintLetter(letter.id)}>
                              <Printer className="h-3.5 w-3.5" />
                              Print Statement
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleStatusChange(letter.id, "Sent")}>
                              <Send className="h-3.5 w-3.5" />
                              Mark as Sent
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleStatusChange(letter.id, "Signed")}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark as Signed
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleStatusChange(letter.id, "Archived")}>
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-destructive cursor-pointer" onClick={() => handleDeleteLetter(letter.id)}>
                              <Ban className="h-3.5 w-3.5" />
                              Revoke Letter
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm font-semibold">No letters found matching the filters</p>
                    <p className="text-xs">Try clearing search terms or changing status filter options.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  )
}
