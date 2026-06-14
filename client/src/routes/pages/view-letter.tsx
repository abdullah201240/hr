import { useParams, useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  FileCheck,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  ArrowRightLeft,
  Coins,
  Ban,
  FileX,
  Award,
  LogOut,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ─── Letter Type Config (same as main page) ─────────────────────────────────────
interface LetterTypeConfig {
  id: string
  name: string
  category: string
  icon: LucideIcon
  color: string
  bgColor: string
}

const letterTypes: LetterTypeConfig[] = [
  { id: "offer", name: "Offer Letter", category: "Hiring", icon: FileCheck, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { id: "appointment", name: "Appointment Letter", category: "Hiring", icon: UserCheck, color: "text-sky-600", bgColor: "bg-sky-500/10" },
  { id: "confirmation", name: "Confirmation Letter", category: "Employment", icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { id: "probation_extension", name: "Probation Extension", category: "Employment", icon: Calendar, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  { id: "promotion", name: "Promotion Letter", category: "Employment", icon: TrendingUp, color: "text-violet-600", bgColor: "bg-violet-500/10" },
  { id: "transfer", name: "Transfer Letter", category: "Employment", icon: ArrowRightLeft, color: "text-blue-600", bgColor: "bg-blue-500/10" },
  { id: "salary_increment", name: "Salary Increment", category: "Employment", icon: Coins, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { id: "warning", name: "Warning Letter", category: "Discipline", icon: AlertTriangle, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  { id: "termination", name: "Termination Letter", category: "Discipline", icon: Ban, color: "text-red-600", bgColor: "bg-red-500/10" },
  { id: "experience", name: "Experience Letter", category: "Exit", icon: Award, color: "text-indigo-600", bgColor: "bg-indigo-500/10" },
  { id: "relieving", name: "Relieving Letter", category: "Exit", icon: LogOut, color: "text-slate-600", bgColor: "bg-slate-500/10" },
  { id: "proof_of_employment", name: "Proof of Employment", category: "General", icon: ShieldCheck, color: "text-teal-600", bgColor: "bg-teal-500/10" },
]

// ─── Sample Letter Data (in real app, fetch from API/localStorage) ───────────────
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

const sampleLetters: Record<string, HRLetter> = {
  "HR-L001": {
    id: "HR-L001",
    type: "offer",
    employeeName: "James Anderson",
    employeeDepartment: "Engineering",
    subject: "Employment Offer - Senior Software Engineer",
    issueDate: "2026-06-10",
    effectiveDate: "2026-07-01",
    status: "Sent",
    body: "Dear Mr. Anderson,\n\nWe are pleased to offer you the position of Senior Software Engineer at Sadoshima HR Management. Your annual compensation will be $95,000 with a 6-month probation period.\n\nYour employment will commence on July 1, 2026, and you will be reporting to the Engineering department. As part of your employment package, you will receive health insurance, 401k retirement plan, and 20 days of paid time off annually.\n\nPlease review the terms and conditions outlined in this offer letter carefully. We look forward to welcoming you to our team.\n\nBest regards,\nHR Department\nSadoshima HR Management",
    fields: { designation: "Senior Software Engineer", department: "Engineering", salary: "$95,000", startDate: "2026-07-01", probationPeriod: "6 months", benefits: "Health insurance, 401k, 20 days PTO" },
    createdBy: "HR Admin",
    createdAt: "2026-06-10T09:00:00Z",
  },
  "HR-L003": {
    id: "HR-L003",
    type: "confirmation",
    employeeName: "David Kim",
    employeeDepartment: "Engineering",
    subject: "Employment Confirmation",
    issueDate: "2026-06-01",
    effectiveDate: "2026-06-01",
    status: "Signed",
    body: "Dear Mr. Kim,\n\nWe are pleased to confirm your employment as Software Engineer following the successful completion of your probation period from December 1, 2025 to June 1, 2026.\n\nYour dedication and performance during the probation period have been commendable. You are now a permanent employee of Sadoshima HR Management with all associated benefits and privileges.\n\nCongratulations on your confirmation!\n\nBest regards,\nHR Department\nSadoshima HR Management",
    fields: { probationStart: "2025-12-01", probationEnd: "2026-06-01", confirmedDesignation: "Software Engineer" },
    createdBy: "HR Admin",
    createdAt: "2026-06-01T08:00:00Z",
  },
  "HR-L005": {
    id: "HR-L005",
    type: "warning",
    employeeName: "Marcus Brown",
    employeeDepartment: "Sales",
    subject: "First Written Warning - Attendance Policy Violation",
    issueDate: "2026-06-08",
    effectiveDate: "2026-06-08",
    status: "Sent",
    body: "Dear Mr. Brown,\n\nThis letter serves as a formal written warning regarding repeated violations of the company attendance policy. Our records indicate multiple unexcused absences during May 2026.\n\nYou are required to maintain a minimum of 95% attendance and punctuality going forward. Any further violations within the next 30 days (until July 8, 2026) may result in additional disciplinary action, up to and including termination of employment.\n\nWe encourage you to discuss any concerns with your manager or HR department.\n\nRegards,\nHR Department\nSadoshima HR Management",
    fields: { violationType: "Attendance Policy", description: "Multiple unexcused absences in May 2026", actionRequired: "Maintain 95% attendance", deadline: "2026-07-08" },
    createdBy: "HR Admin",
    createdAt: "2026-06-08T14:00:00Z",
  },
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
const getLetterTypeConfig = (typeId: string): LetterTypeConfig | undefined =>
  letterTypes.find((lt) => lt.id === typeId)

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Draft": return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    case "Sent": return "bg-sky-500/10 text-sky-600 border-sky-500/20"
    case "Signed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "Archived": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    default: return "bg-muted text-muted-foreground"
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function ViewLetterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Get letter from sample data (in real app, fetch from API)
  const letter = sampleLetters[id || ""] || Object.values(sampleLetters)[0]
  const typeConfig = getLetterTypeConfig(letter?.type || "")
  const Icon = typeConfig?.icon || FileText

  if (!letter) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileX className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold">Letter Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested letter could not be found.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/letters")}>
          <ArrowLeft className="h-4 w-4" /> Back to Letters
        </Button>
      </div>
    )
  }

  const handlePrint = () => {
    navigate(`/letters/print/${letter.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden on print */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/letters")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Icon className={`h-5 w-5 ${typeConfig?.color}`} />
              {typeConfig?.name || "HR Letter"}
            </h2>
            <p className="text-sm text-muted-foreground">{letter.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusStyle(letter.status)}>{letter.status}</Badge>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          {letter.status === "Draft" && (
            <Button size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Send Letter
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Letter Preview - Takes 2 columns */}
        <div className="lg:col-span-2">
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-8 print:p-0">
              {/* Company Letterhead */}
              <div className="border-b-2 border-primary pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-primary">Sadoshima HR</h1>
                    <p className="text-xs text-muted-foreground">Management System</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>123 Business Avenue</p>
                    <p>New York, NY 10001</p>
                    <p>contact@sadoshimahr.com</p>
                  </div>
                </div>
              </div>

              {/* Letter Header Info */}
              <div className="mb-6 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Date:</span> {new Date(letter.issueDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                <p><span className="text-muted-foreground">Ref:</span> {letter.id}</p>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <p className="font-bold text-base">Subject: {letter.subject}</p>
              </div>

              {/* Recipient */}
              <div className="mb-6">
                <p className="font-medium">To: {letter.employeeName}</p>
                <p className="text-sm text-muted-foreground">{letter.employeeDepartment} Department</p>
              </div>

              {/* Letter Body */}
              <div className="prose prose-sm max-w-none mb-8">
                {letter.body.split("\n\n").map((paragraph, idx) => (
                  <p key={idx} className="mb-4 text-sm leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Signature */}
              <div className="mt-12 pt-6 border-t border-border">
                <p className="text-sm font-medium">{letter.createdBy}</p>
                <p className="text-xs text-muted-foreground">Human Resources Department</p>
                <p className="text-xs text-muted-foreground">Sadoshima HR Management</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Letter Details */}
        <div className="space-y-4 print:hidden">
          {/* Letter Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Letter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Letter ID</span>
                <span className="font-mono font-semibold">{letter.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="secondary" className="text-[10px]">{typeConfig?.name}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold">{typeConfig?.category}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`text-[10px] ${getStatusStyle(letter.status)}`}>{letter.status}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Issue Date</span>
                <span className="font-semibold">{new Date(letter.issueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Effective Date</span>
                <span className="font-semibold">{new Date(letter.effectiveDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-semibold">{letter.createdBy}</span>
              </div>
            </CardContent>
          </Card>

          {/* Employee Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Employee Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{letter.employeeName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {letter.employeeDepartment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Letter Fields Card */}
          {Object.keys(letter.fields).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Letter Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(letter.fields).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between text-xs gap-2">
                    <span className="text-muted-foreground capitalize shrink-0">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="font-semibold text-right">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-3 w-3 text-primary" />
                  </div>
                  <div className="w-px h-6 bg-border" />
                </div>
                <div className="pb-3">
                  <p className="text-xs font-semibold">Letter Created</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(letter.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              {letter.status !== "Draft" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-sky-500/10 flex items-center justify-center">
                      <Send className="h-3 w-3 text-sky-500" />
                    </div>
                    {letter.status === "Signed" && <div className="w-px h-6 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold">Letter Sent</p>
                    <p className="text-[10px] text-muted-foreground">Delivered to employee</p>
                  </div>
                </div>
              )}
              {letter.status === "Signed" && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Letter Signed</p>
                    <p className="text-[10px] text-muted-foreground">Acknowledged by employee</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
