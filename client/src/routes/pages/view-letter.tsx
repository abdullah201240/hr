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
  Loader2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useLetterQuery, useUpdateLetterStatusMutation } from "@/hooks/useLetters"
import Swal from "sweetalert2"

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

  const { data: letter, isLoading, isError } = useLetterQuery(id || "")
  const updateStatusMutation = useUpdateLetterStatusMutation()

  const typeConfig = getLetterTypeConfig(letter?.type || "")
  const Icon = typeConfig?.icon || FileText

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Loading HR document details...</p>
      </div>
    )
  }

  if (isError || !letter) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileX className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold">Letter Not Found</h2>
        <p className="text-muted-foreground mt-2">The requested letter could not be found or loaded.</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/letters")}>
          <ArrowLeft className="h-4 w-4" /> Back to Letters
        </Button>
      </div>
    )
  }

  const handlePrint = () => {
    navigate(`/letters/print/${letter.id}`)
  }

  const handleSendLetter = () => {
    updateStatusMutation.mutate(
      { id: letter.id, status: "Sent" },
      {
        onSuccess: () => {
          Swal.fire("Success", "HR Letter marked as Sent and delivered to employee.", "success")
        },
      }
    )
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
            <Button
              size="sm"
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
              onClick={handleSendLetter}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
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
