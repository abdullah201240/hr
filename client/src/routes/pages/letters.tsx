import { useState } from "react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Download,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { LucideIcon } from "lucide-react"

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
    templateFields: ["designation", "department", "salary", "startDate", "probationPeriod", "benefits"],
  },
  {
    id: "appointment",
    name: "Appointment Letter",
    category: "hiring",
    icon: UserCheck,
    color: "text-sky-600",
    bgColor: "bg-sky-500/10",
    description: "Official appointment confirmation",
    templateFields: ["designation", "department", "salary", "startDate", "reportingManager"],
  },
  {
    id: "confirmation",
    name: "Confirmation Letter",
    category: "employment",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Post-probation employment confirmation",
    templateFields: ["probationStart", "probationEnd", "confirmedDesignation"],
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
    templateFields: ["oldDesignation", "newDesignation", "salaryChange", "effectiveDate"],
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
    name: "Salary Increment",
    category: "employment",
    icon: Coins,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    description: "Salary revision notification",
    templateFields: ["currentSalary", "newSalary", "effectiveDate", "incrementPercentage"],
  },
  {
    id: "warning",
    name: "Warning Letter",
    category: "discipline",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    description: "Disciplinary warning notice",
    templateFields: ["violationType", "description", "actionRequired", "deadline"],
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
    name: "Relieving Letter",
    category: "exit",
    icon: LogOut,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    description: "Resignation acceptance and relieving",
    templateFields: ["resignationDate", "lastWorkingDay", "noticePeriod"],
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
]

// ─── Letter Interface ───────────────────────────────────────────────────────────
interface HRLetter {
  id: string
  type: string
  employeeName: string
  employeeDepartment: string
  subject: string
  issueDate: string
  effectiveDate: string
  status: "Draft" | "Sent" | "Signed" | "Archived"
  body: string
  fields: Record<string, string>
  createdBy: string
  createdAt: string
}

// ─── Seed Data ──────────────────────────────────────────────────────────────────
const initialLetters: HRLetter[] = [
  {
    id: "HR-L001",
    type: "offer",
    employeeName: "James Anderson",
    employeeDepartment: "Engineering",
    subject: "Employment Offer - Senior Software Engineer",
    issueDate: "2026-06-10",
    effectiveDate: "2026-07-01",
    status: "Sent",
    body: "We are pleased to offer you the position of Senior Software Engineer at Sadoshima HR Management. Your annual compensation will be $95,000 with a 6-month probation period. We look forward to welcoming you to our team.",
    fields: { designation: "Senior Software Engineer", department: "Engineering", salary: "$95,000", startDate: "2026-07-01", probationPeriod: "6 months", benefits: "Health insurance, 401k, 20 days PTO" },
    createdBy: "HR Admin",
    createdAt: "2026-06-10T09:00:00Z",
  },
  {
    id: "HR-L002",
    type: "offer",
    employeeName: "Maria Garcia",
    employeeDepartment: "Marketing",
    subject: "Employment Offer - Marketing Manager",
    issueDate: "2026-06-12",
    effectiveDate: "2026-07-15",
    status: "Draft",
    body: "We are pleased to offer you the position of Marketing Manager at Sadoshima HR Management. Your annual compensation will be $85,000 with a 3-month probation period.",
    fields: { designation: "Marketing Manager", department: "Marketing", salary: "$85,000", startDate: "2026-07-15", probationPeriod: "3 months", benefits: "Health insurance, 401k" },
    createdBy: "HR Admin",
    createdAt: "2026-06-12T10:30:00Z",
  },
  {
    id: "HR-L003",
    type: "confirmation",
    employeeName: "David Kim",
    employeeDepartment: "Engineering",
    subject: "Employment Confirmation",
    issueDate: "2026-06-01",
    effectiveDate: "2026-06-01",
    status: "Signed",
    body: "We are pleased to confirm your employment as Software Engineer following the successful completion of your probation period. Your dedication and performance have been commendable.",
    fields: { probationStart: "2025-12-01", probationEnd: "2026-06-01", confirmedDesignation: "Software Engineer" },
    createdBy: "HR Admin",
    createdAt: "2026-06-01T08:00:00Z",
  },
  {
    id: "HR-L004",
    type: "promotion",
    employeeName: "Sarah Mitchell",
    employeeDepartment: "Product",
    subject: "Promotion to Senior Product Manager",
    issueDate: "2026-06-05",
    effectiveDate: "2026-06-15",
    status: "Sent",
    body: "In recognition of your outstanding contributions, we are pleased to promote you to Senior Product Manager effective June 15, 2026. Your new annual salary will be $120,000.",
    fields: { oldDesignation: "Product Manager", newDesignation: "Senior Product Manager", salaryChange: "+15%", effectiveDate: "2026-06-15" },
    createdBy: "HR Admin",
    createdAt: "2026-06-05T11:00:00Z",
  },
  {
    id: "HR-L005",
    type: "warning",
    employeeName: "Marcus Brown",
    employeeDepartment: "Sales",
    subject: "First Written Warning - Attendance Policy Violation",
    issueDate: "2026-06-08",
    effectiveDate: "2026-06-08",
    status: "Sent",
    body: "This letter serves as a formal written warning regarding repeated violations of the company attendance policy. You are required to maintain regular attendance and punctuality. Further violations may result in additional disciplinary action.",
    fields: { violationType: "Attendance Policy", description: "Multiple unexcused absences in May 2026", actionRequired: "Maintain 95% attendance", deadline: "2026-07-08" },
    createdBy: "HR Admin",
    createdAt: "2026-06-08T14:00:00Z",
  },
  {
    id: "HR-L006",
    type: "transfer",
    employeeName: "Emily Zhang",
    employeeDepartment: "Engineering",
    subject: "Transfer to Chicago Office",
    issueDate: "2026-06-11",
    effectiveDate: "2026-07-01",
    status: "Draft",
    body: "We are pleased to inform you of your transfer to our Chicago office effective July 1, 2026. Your role and responsibilities will remain the same. Relocation assistance will be provided.",
    fields: { fromLocation: "New York", toLocation: "Chicago", fromRole: "Software Engineer", toRole: "Software Engineer", effectiveDate: "2026-07-01" },
    createdBy: "HR Admin",
    createdAt: "2026-06-11T09:30:00Z",
  },
  {
    id: "HR-L007",
    type: "salary_increment",
    employeeName: "Lisa Johnson",
    employeeDepartment: "HR",
    subject: "Annual Salary Revision",
    issueDate: "2026-06-01",
    effectiveDate: "2026-06-01",
    status: "Sent",
    body: "In recognition of your valuable contributions, your annual salary has been revised from $65,000 to $72,000 effective June 1, 2026. This represents a 10.8% increment.",
    fields: { currentSalary: "$65,000", newSalary: "$72,000", effectiveDate: "2026-06-01", incrementPercentage: "10.8%" },
    createdBy: "HR Admin",
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "HR-L008",
    type: "experience",
    employeeName: "Robert Chen",
    employeeDepartment: "Finance",
    subject: "Experience Certificate",
    issueDate: "2026-06-05",
    effectiveDate: "2026-06-05",
    status: "Signed",
    body: "This is to certify that Mr. Robert Chen was employed with Sadoshima HR Management as Finance Manager from January 15, 2020 to June 5, 2026. During his tenure, he handled financial planning, budgeting, and reporting functions.",
    fields: { joiningDate: "2020-01-15", relievingDate: "2026-06-05", designation: "Finance Manager", responsibilities: "Financial planning, budgeting, and reporting" },
    createdBy: "HR Admin",
    createdAt: "2026-06-05T15:00:00Z",
  },
  {
    id: "HR-L009",
    type: "relieving",
    employeeName: "Robert Chen",
    employeeDepartment: "Finance",
    subject: "Relieving Letter",
    issueDate: "2026-06-05",
    effectiveDate: "2026-06-05",
    status: "Signed",
    body: "This is to confirm that your resignation has been accepted and you are relieved from your duties as Finance Manager effective June 5, 2026. We thank you for your contributions.",
    fields: { resignationDate: "2026-05-05", lastWorkingDay: "2026-06-05", noticePeriod: "30 days" },
    createdBy: "HR Admin",
    createdAt: "2026-06-05T16:00:00Z",
  },
  {
    id: "HR-L010",
    type: "proof_of_employment",
    employeeName: "Jennifer Lee",
    employeeDepartment: "Engineering",
    subject: "Employment Verification Letter",
    issueDate: "2026-06-10",
    effectiveDate: "2026-06-10",
    status: "Sent",
    body: "This letter confirms that Ms. Jennifer Lee is currently employed with Sadoshima HR Management as Senior Developer since March 1, 2021. Her current annual salary is $88,000.",
    fields: { designation: "Senior Developer", salary: "$88,000", joiningDate: "2021-03-01", employmentType: "Full-time Permanent" },
    createdBy: "HR Admin",
    createdAt: "2026-06-10T11:30:00Z",
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

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function LettersPage() {
  const navigate = useNavigate()
  const [letters, setLetters] = useState<HRLetter[]>(initialLetters)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Preview state
  const [previewLetter, setPreviewLetter] = useState<HRLetter | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Form state
  const [selectedType, setSelectedType] = useState("")
  const [formEmployee, setFormEmployee] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formIssueDate, setFormIssueDate] = useState("")
  const [formEffectiveDate, setFormEffectiveDate] = useState("")
  const [formBody, setFormBody] = useState("")
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [formStatus, setFormStatus] = useState<HRLetter["status"]>("Draft")

  // Filter letters
  const filteredLetters = letters.filter((letter) => {
    const matchesSearch =
      letter.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || letter.type === filterType
    const matchesStatus = filterStatus === "all" || letter.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  // Stats
  const totalLetters = letters.length
  const pendingLetters = letters.filter((l) => l.status === "Draft").length
  const sentLetters = letters.filter((l) => l.status === "Sent").length
  const signedLetters = letters.filter((l) => l.status === "Signed").length

  // Reset form
  const resetForm = () => {
    setSelectedType("")
    setFormEmployee("")
    setFormSubject("")
    setFormIssueDate("")
    setFormEffectiveDate("")
    setFormBody("")
    setFormFields({})
    setFormStatus("Draft")
  }

  // Handle type selection - prefill template
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId)
    const config = getLetterTypeConfig(typeId)
    if (config) {
      setFormSubject(config.name)
      // Initialize empty fields
      const emptyFields: Record<string, string> = {}
      config.templateFields.forEach((f) => (emptyFields[f] = ""))
      setFormFields(emptyFields)
      // Set default body template
      setFormBody(`This ${config.name} is issued to confirm the following details.\n\n[Letter content based on ${config.name} type]\n\nPlease review and acknowledge receipt of this letter.`)
    }
  }

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const config = getLetterTypeConfig(selectedType)
    if (!config) return

    const newLetter: HRLetter = {
      id: `HR-L${String(letters.length + 1).padStart(3, "0")}`,
      type: selectedType,
      employeeName: formEmployee,
      employeeDepartment: "Department",
      subject: formSubject,
      issueDate: formIssueDate,
      effectiveDate: formEffectiveDate,
      status: formStatus,
      body: formBody,
      fields: formFields,
      createdBy: "HR Admin",
      createdAt: new Date().toISOString(),
    }

    setLetters([newLetter, ...letters])
    resetForm()
    setDialogOpen(false)
  }

  // Handle status change
  const handleStatusChange = (id: string, status: HRLetter["status"]) => {
    setLetters(letters.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  // Open preview
  const openPreview = (letter: HRLetter) => {
    setPreviewLetter(letter)
    setPreviewOpen(true)
  }

  // Print letter - navigate to dedicated print page
  const handlePrintLetter = (letterId: string) => {
    navigate(`/letters/print/${letterId}`)
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
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Letter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create HR Letter</DialogTitle>
              <DialogDescription>
                Select a letter type and fill in the details to generate an HR letter
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Letter Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Letter Type *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {letterTypes.map((lt) => {
                    const Icon = lt.icon
                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => handleTypeSelect(lt.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                          selectedType === lt.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg ${lt.bgColor} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${lt.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{lt.name}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{getCategoryLabel(lt.category)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedType && (
                <>
                  {/* Employee + Subject */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Employee Name *</Label>
                      <Input
                        placeholder="Enter employee name"
                        value={formEmployee}
                        onChange={(e) => setFormEmployee(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Subject *</Label>
                      <Input
                        placeholder="Letter subject"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Issue Date *</Label>
                      <Input
                        type="date"
                        value={formIssueDate}
                        onChange={(e) => setFormIssueDate(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Effective Date *</Label>
                      <Input
                        type="date"
                        value={formEffectiveDate}
                        onChange={(e) => setFormEffectiveDate(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields based on letter type */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold">Letter Details</Label>
                    <div className="grid gap-3 sm:grid-cols-2 p-3 rounded-lg border border-border/50 bg-muted/10">
                      {getLetterTypeConfig(selectedType)?.templateFields.map((field) => (
                        <div key={field} className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground font-medium capitalize">
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </Label>
                          <Input
                            placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                            value={formFields[field] || ""}
                            onChange={(e) => setFormFields({ ...formFields, [field]: e.target.value })}
                            className="text-xs h-8"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Letter Body *</Label>
                    <Textarea
                      placeholder="Enter letter content..."
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      required
                      className="text-xs min-h-[120px] resize-y"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={formStatus} onValueChange={(v) => setFormStatus(v as HRLetter["status"])}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Signed">Signed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedType}>
                  Create Letter
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Letters Table */}
      <Card>
        <CardHeader>
          <CardTitle>HR Letters</CardTitle>
          <CardDescription>Manage all HR correspondence and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by employee, ID, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Letter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {letterTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    {lt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Signed">Signed</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto bg-transparent">
            {filteredLetters.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/5">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-20 text-muted-foreground" />
                <p className="text-sm font-semibold text-muted-foreground">No letters found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try modifying your search or filter</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/30">
                  <TableRow className="border-b-0 hover:bg-transparent">
                    <TableHead className="font-semibold text-xs text-muted-foreground">Letter Info</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Type</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Employee</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground hidden lg:table-cell">Subject</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                    <TableHead className="w-20 font-semibold text-xs text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLetters.map((letter) => {
                    const typeConfig = getLetterTypeConfig(letter.type)
                    const Icon = typeConfig?.icon || FileText
                    return (
                      <TableRow key={letter.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div>
                            <p className="font-mono text-xs text-muted-foreground">{letter.id}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">by {letter.createdBy}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-lg ${typeConfig?.bgColor || "bg-muted"} flex items-center justify-center`}>
                              <Icon className={`h-3.5 w-3.5 ${typeConfig?.color || "text-muted-foreground"}`} />
                            </div>
                            <span className="text-xs font-semibold">{typeConfig?.name || letter.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div>
                            <p className="text-sm font-medium">{letter.employeeName}</p>
                            <p className="text-[10px] text-muted-foreground">{letter.employeeDepartment}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 hidden lg:table-cell">
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{letter.subject}</p>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs text-muted-foreground">
                            <p>{new Date(letter.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                            <p className="text-[10px] text-muted-foreground/60">Issued</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`text-[10px] ${getStatusStyle(letter.status)}`}>
                            {letter.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="text-xs gap-2" onClick={() => openPreview(letter)}>
                                <Eye className="h-3.5 w-3.5" /> View Letter
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2" onClick={() => handlePrintLetter(letter.id)}>
                                <Printer className="h-3.5 w-3.5" /> Print
                              </DropdownMenuItem>
                              {letter.status === "Draft" && (
                                <DropdownMenuItem
                                  className="text-xs gap-2"
                                  onClick={() => handleStatusChange(letter.id, "Sent")}
                                >
                                  <Send className="h-3.5 w-3.5" /> Mark Sent
                                </DropdownMenuItem>
                              )}
                              {letter.status === "Sent" && (
                                <DropdownMenuItem
                                  className="text-xs gap-2"
                                  onClick={() => handleStatusChange(letter.id, "Signed")}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Signed
                                </DropdownMenuItem>
                              )}
                              {letter.status !== "Archived" && (
                                <DropdownMenuItem
                                  className="text-xs gap-2"
                                  onClick={() => handleStatusChange(letter.id, "Archived")}
                                >
                                  <Archive className="h-3.5 w-3.5" /> Archive
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {previewLetter && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="flex items-center gap-2">
                      {(() => {
                        const tc = getLetterTypeConfig(previewLetter.type)
                        const PIcon = tc?.icon || FileText
                        return <><PIcon className={`h-5 w-5 ${tc?.color || ""}`} />{tc?.name || "HR Letter"}</>
                      })()}
                    </DialogTitle>
                    <DialogDescription className="mt-1">{previewLetter.subject}</DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePrintLetter(previewLetter.id)}>
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePrintLetter(previewLetter.id)}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-2">
                {/* Status + Meta Bar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge className={`text-[10px] ${getStatusStyle(previewLetter.status)}`}>{previewLetter.status}</Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{previewLetter.id}</span>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <span className="text-[10px] text-muted-foreground">Issued: {new Date(previewLetter.issueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  <span className="text-[10px] text-muted-foreground">|</span>
                  <span className="text-[10px] text-muted-foreground">Effective: {new Date(previewLetter.effectiveDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>

                {/* Letter Preview (printable area) */}
                <div className="rounded-lg border border-border bg-background p-8">
                  {/* Company Letterhead */}
                  <div className="letterhead flex items-start justify-between border-b-[3px] border-indigo-500 pb-4 mb-6">
                    <div>
                      <h1 className="text-xl font-bold text-indigo-600">Sadoshima HR</h1>
                      <p className="text-[10px] text-muted-foreground">Management System</p>
                    </div>
                    <div className="address text-right text-[10px] text-muted-foreground space-y-0.5">
                      <p>123 Business Avenue</p>
                      <p>New York, NY 10001</p>
                      <p>contact@sadoshimahr.com</p>
                    </div>
                  </div>

                  {/* Date + Ref */}
                  <div className="meta mb-5 space-y-0.5 text-xs">
                    <p><span className="text-muted-foreground">Date:</span> {new Date(previewLetter.issueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <p><span className="text-muted-foreground">Ref:</span> <span className="font-mono">{previewLetter.id}</span></p>
                  </div>

                  {/* Subject */}
                  <p className="subject font-bold text-sm mb-5">Subject: {previewLetter.subject}</p>

                  {/* Recipient */}
                  <div className="recipient mb-5">
                    <p className="text-sm font-medium">To: {previewLetter.employeeName}</p>
                    <p className="dept text-[11px] text-muted-foreground">{previewLetter.employeeDepartment} Department</p>
                  </div>

                  {/* Letter Body */}
                  <div className="body mb-6">
                    {previewLetter.body.split("\n").filter(Boolean).map((paragraph, idx) => (
                      <p key={idx} className="text-xs leading-relaxed mb-3">{paragraph}</p>
                    ))}
                  </div>

                  {/* Dynamic Fields Table */}
                  {Object.keys(previewLetter.fields).length > 0 && (
                    <table className="fields-table w-full border-collapse mb-6 text-xs">
                      <tbody>
                        {Object.entries(previewLetter.fields).map(([key, value]) => (
                          <tr key={key}>
                            <td className="py-1.5 px-3 border border-border/50 bg-muted/30 text-muted-foreground capitalize w-[40%]">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </td>
                            <td className="py-1.5 px-3 border border-border/50 font-semibold">
                              {value || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Signature */}
                  <div className="signature mt-10 pt-4 border-t border-border">
                    <p className="name text-sm font-semibold">{previewLetter.createdBy}</p>
                    <p className="dept text-[11px] text-muted-foreground">Human Resources Department</p>
                    <p className="dept text-[11px] text-muted-foreground">Sadoshima HR Management</p>
                  </div>
                </div>

                {/* Letter Details Sidebar Info (below preview on small screens) */}
                <div className="grid gap-3 sm:grid-cols-3 mt-4">
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground">Letter Type</p>
                    <p className="text-xs font-semibold mt-0.5">{getLetterTypeConfig(previewLetter.type)?.name}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground">Employee</p>
                    <p className="text-xs font-semibold mt-0.5">{previewLetter.employeeName}</p>
                    <p className="text-[10px] text-muted-foreground">{previewLetter.employeeDepartment}</p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-[10px] text-muted-foreground">Created</p>
                    <p className="text-xs font-semibold mt-0.5">{new Date(previewLetter.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </Card>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
