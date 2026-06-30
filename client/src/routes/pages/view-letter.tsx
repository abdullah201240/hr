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
  { id: "warning", name: "Show Cause Notice", category: "Discipline", icon: AlertTriangle, color: "text-amber-600", bgColor: "bg-amber-500/10" },
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

  const renderLetterContent = () => {
    const fields = letter.fields || {}
    const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
    
    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

    if (letter.type === "relieving") {
      const resignationDate = fields.resignationDate ? formatDate(fields.resignationDate) : "—"
      const lastWorkingDay = fields.lastWorkingDay ? formatDate(fields.lastWorkingDay) : "—"
      const noticePeriod = fields.noticePeriod || "—"
      const reasonForLeaving = fields.reasonForLeaving || "—"
      const reportingManager = fields.reportingManager || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                RESIGNATION ACCEPTANCE LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Acceptance of Resignation</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Separation Details</h3>
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Resignation Date</td>
                      <td className="p-2">{resignationDate}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Notice Period</td>
                      <td className="p-2">{noticePeriod}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Last Working Day</td>
                      <td className="p-2">{lastWorkingDay}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Reason for Leaving</td>
                      <td className="p-2">{reasonForLeaving}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Reporting Manager</td>
                      <td className="p-2">{reportingManager}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Handover and Clearance</h4>
                <p className="mt-1">
                  You are required to complete the handover of all duties, files, records, passwords, documents, and Company assets to your Reporting Manager or the person nominated by Management. All departmental clearances must be completed before your final settlement is processed.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Full & Final Settlement</h4>
                <p className="mt-1">
                  Your Full & Final Settlement shall be processed after successful completion of the clearance formalities and subject to Company policy and applicable laws. Any outstanding dues payable by either party shall be adjusted accordingly.
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Exit Formalities</h4>
                <p className="mt-1">
                  Subject to satisfactory completion of all exit formalities, the Company will issue applicable employment documents such as the Experience Certificate and No Objection Certificate (where applicable).
                </p>
              </div>
              <p className="pt-2 font-semibold">
                We sincerely appreciate your contribution to the Company and wish you success in your future endeavors.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Resignation Acceptance Letter.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "offer") {
      const presentAddress = fields.presentAddress || "—"
      const designation = fields.designation || "—"
      const department = fields.department || "—"
      const employmentType = fields.employmentType || "—"
      const reportingTo = fields.reportingTo || "—"
      const dutyStation = fields.dutyStation || "—"
      const proposedJoiningDate = fields.proposedJoiningDate ? formatDate(fields.proposedJoiningDate) : "—"
      const monthlyGrossSalary = fields.monthlyGrossSalary || "—"
      const offerExpiryDate = fields.offerExpiryDate ? formatDate(fields.offerExpiryDate) : "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="whitespace-pre-line">{presentAddress}</p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Offer of Employment</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Position</td>
                      <td className="p-2">{designation}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Department</td>
                      <td className="p-2">{department}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Employment Type</td>
                      <td className="p-2">{employmentType}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Reporting To</td>
                      <td className="p-2">{reportingTo}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Duty Station</td>
                      <td className="p-2">{dutyStation}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Proposed Joining Date</td>
                      <td className="p-2">{proposedJoiningDate}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Monthly Gross Salary</td>
                      <td className="p-2">BDT {monthlyGrossSalary}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <p>This offer is subject to the following conditions:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Submission of all required documents and satisfactory verification thereof.</li>
                <li>Successful completion of the pre-employment medical examination (where applicable).</li>
                <li>Acceptance of the Company's Appointment Letter and compliance with all applicable Company policies, rules, and regulations.</li>
                <li>Completion of all joining formalities on or before the joining date.</li>
              </ol>
              <p className="pt-2">
                This Offer of Employment shall remain valid until <span className="font-semibold">{offerExpiryDate}</span>. Kindly confirm your acceptance by signing and returning a copy of this letter on or before the above date.
              </p>
              <p>
                Upon acceptance, a formal Appointment Letter containing the detailed terms and conditions of your employment will be issued on your joining date.
              </p>
              <p>
                We look forward to welcoming you to Sadoshima Corporation and wish you a successful and rewarding career with us.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Managing Director"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Acceptance of Offer</h3>
              <p className="leading-relaxed">
                I, <span className="font-semibold">{letter.employeeName}</span>, hereby accept the above Offer of Employment and agree to join Sadoshima Corporation – Bangladesh Liaison Office on <span className="font-semibold">{proposedJoiningDate}</span>.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Candidate</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "first_warning") {
      const incidentDate = fields.incidentDate || "—"
      const incidentLocation = fields.incidentLocation || "—"
      const description = fields.description || letter.body || "—"
      const previousCounseling = fields.previousCounseling || "—"
      const policyBreach = fields.policyBreach || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                FIRST WRITTEN WARNING LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: First Written Warning</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Details of the Incident</h3>
              <div className="space-y-1 pl-1">
                <p className="font-semibold">Date of Incident: <span className="font-normal">{incidentDate}</span></p>
                <p className="font-semibold">Location: <span className="font-normal">{incidentLocation}</span></p>
                <p className="font-semibold mt-2">Description:</p>
                <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 italic">
                  {description}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-6 leading-relaxed">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Previous Counseling (if any)</h3>
              <p className="whitespace-pre-line pl-1">{previousCounseling}</p>
            </div>

            <div className="text-xs space-y-2 mb-6 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Policy Breach</h4>
              <p className="whitespace-pre-line pl-1">{policyBreach}</p>
            </div>

            <div className="text-xs space-y-3 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Required Improvement</h4>
              <p className="pl-1">
                You are expected to immediately correct your conduct and comply with all Company policies. Failure to demonstrate sustained improvement or repetition of similar misconduct may result in further disciplinary action, including a Final Written Warning, suspension pending investigation, domestic inquiry, or any other action permitted under the Company's HR Policy and applicable laws.
              </p>
              <p className="pl-1 font-semibold">
                Please treat this matter seriously and ensure that such incidents do not recur.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this First Written Warning Letter.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeIdCode || "—"}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "final_warning") {
      const incidentDate = fields.incidentDate || "—"
      const incidentLocation = fields.incidentLocation || "—"
      const description = fields.description || letter.body || "—"
      const verbalCounselingDate = fields.verbalCounselingDate ? formatDate(fields.verbalCounselingDate) : "—"
      const firstWarningDate = fields.firstWarningDate ? formatDate(fields.firstWarningDate) : "—"
      const employeeExplanationDate = fields.employeeExplanationDate ? formatDate(fields.employeeExplanationDate) : "—"
      const policyViolated = fields.policyViolated || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                FINAL WRITTEN WARNING LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Final Written Warning</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Details of Misconduct / Performance Concern</h3>
              <div className="space-y-1 pl-1">
                <p className="font-semibold">Date(s) of Incident: <span className="font-normal">{incidentDate}</span></p>
                <p className="font-semibold">Location: <span className="font-normal">{incidentLocation}</span></p>
                <p className="font-semibold mt-2">Description:</p>
                <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 italic">
                  {description}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Previous Disciplinary Action</h3>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li><span className="font-semibold">Verbal Counseling (if applicable):</span> {verbalCounselingDate}</li>
                <li><span className="font-semibold">First Written Warning:</span> {firstWarningDate}</li>
                <li><span className="font-semibold">Employee Explanation (if applicable):</span> {employeeExplanationDate}</li>
              </ul>
            </div>

            <div className="text-xs space-y-2 mb-6 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Policy / Rule Violated</h4>
              <p className="whitespace-pre-line pl-1">{policyViolated}</p>
            </div>

            <div className="text-xs space-y-2 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Required Corrective Action</h4>
              <p className="pl-1">
                You are required to demonstrate immediate and sustained improvement in your conduct, attendance, performance, and compliance with Company policies. Failure to do so, or any further misconduct of a similar or serious nature, may result in disciplinary action including suspension pending investigation, domestic inquiry, termination of employment, or any other action permitted under the Company's HR Policy and applicable laws.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-12">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Support</h3>
              <p className="leading-relaxed">
                If you require clarification regarding the expectations outlined in this letter or need guidance to improve your performance or conduct, you are encouraged to discuss the matter with your Reporting Manager or the Human Resources Department.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Final Written Warning Letter.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeIdCode || "—"}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "suspension") {
      const incidentDate = fields.incidentDate || "—"
      const natureOfAllegation = fields.natureOfAllegation || "—"
      const reasonForSuspension = fields.reasonForSuspension || "—"
      const effectiveDate = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                SUSPENSION PENDING INVESTIGATION
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Suspension Pending Investigation</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Reason for Suspension</h3>
              <div className="space-y-1 pl-1">
                <p className="font-semibold">Date of Incident: <span className="font-normal">{incidentDate}</span></p>
                <p className="font-semibold">Nature of Allegation: <span className="font-normal">{natureOfAllegation}</span></p>
                <p className="font-semibold">Reason for Suspension: <span className="font-normal">{reasonForSuspension}</span></p>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Terms of Suspension</h3>
              <ul className="list-disc pl-5 space-y-1.5 mt-1">
                <li><span className="font-semibold">Effective Date:</span> {effectiveDate}</li>
                <li><span className="font-semibold">Suspension Period:</span> Until further written notice or completion of the investigation.</li>
                <li>During suspension you shall remain available to cooperate fully with the investigation.</li>
                <li>You shall not enter Company premises or contact employees, customers or suppliers regarding this matter unless authorized.</li>
                <li>Salary and benefits during suspension shall be administered in accordance with the Company's HR Policy and applicable laws.</li>
              </ul>
            </div>

            <div className="text-xs space-y-2 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Further Process</h4>
              <p>
                You will be informed separately if a Show Cause Notice, Domestic Inquiry Notice, or any other disciplinary proceeding is initiated. You will be given a reasonable opportunity to present your explanation before any final decision is made.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Suspension Pending Investigation Letter.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeIdCode || "—"}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "domestic_inquiry") {
      const incidentDate = fields.incidentDate || "—"
      const incidentLocation = fields.incidentLocation || "—"
      const summaryOfAllegation = fields.summaryOfAllegation || "—"
      const inquiryDate = fields.inquiryDate ? formatDate(fields.inquiryDate) : "—"
      const inquiryTime = fields.inquiryTime || "—"
      const inquiryVenue = fields.inquiryVenue || "—"
      const inquiryOfficer = fields.inquiryOfficer || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                DOMESTIC INQUIRY NOTICE
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Notice to Attend Domestic Inquiry</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Details of Allegation</h3>
              <div className="space-y-1 pl-1">
                <p className="font-semibold">Incident Date: <span className="font-normal">{incidentDate}</span></p>
                <p className="font-semibold">Location: <span className="font-normal">{incidentLocation}</span></p>
                <p className="font-semibold mt-2">Summary of Allegation:</p>
                <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 italic">
                  {summaryOfAllegation}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Inquiry Schedule</h3>
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Inquiry Date</td>
                      <td className="p-2">{inquiryDate}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Inquiry Time</td>
                      <td className="p-2">{inquiryTime}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Venue</td>
                      <td className="p-2">{inquiryVenue}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Inquiry Officer / Committee</td>
                      <td className="p-2">{inquiryOfficer}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-4 leading-relaxed mb-6">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Employee Rights</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>You will be given a full and fair opportunity to present your explanation.</li>
                  <li>You may produce documents or other evidence relevant to your defense.</li>
                  <li>You may identify witnesses whose testimony is relevant to the inquiry, subject to the Inquiry Committee's discretion.</li>
                  <li>The inquiry will be conducted impartially in accordance with the Company's HR Policy and applicable laws.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-12">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Attendance</h3>
              <p className="leading-relaxed">
                You are required to attend the inquiry at the scheduled date and time. If you fail to attend without a valid reason, the Inquiry Committee may proceed based on the available evidence.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Domestic Inquiry Notice.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeIdCode || "—"}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "inquiry_committee") {
      const committeeMemberDesignation = fields.committeeMemberDesignation || "—"
      const accusedEmployeeName = fields.accusedEmployeeName || "—"
      const accusedEmployeeId = fields.accusedEmployeeId || "—"
      const briefAllegation = fields.briefAllegation || "—"
      const committeeChair = fields.committeeChair || "—"
      const committeeMembers = fields.committeeMembers || "—"
      const reportDueDate = fields.reportDueDate ? formatDate(fields.reportDueDate) : "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                INQUIRY COMMITTEE APPOINTMENT LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Designation: <span className="font-normal">{committeeMemberDesignation}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Appointment as Inquiry Officer / Member of Inquiry Committee</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Scope of Inquiry</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Examine the allegations objectively.</li>
                  <li>Review all relevant documents and evidence.</li>
                  <li>Hear the employee and witnesses.</li>
                  <li>Maintain impartiality and confidentiality.</li>
                  <li>Submit a written inquiry report with findings and recommendations.</li>
                </ul>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Inquiry Details</h3>
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Employee</td>
                      <td className="p-2">{accusedEmployeeName} (ID: {accusedEmployeeId})</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Allegation</td>
                      <td className="p-2">{briefAllegation}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Committee Chair</td>
                      <td className="p-2">{committeeChair}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Members</td>
                      <td className="p-2">{committeeMembers}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Report Due Date</td>
                      <td className="p-2">{reportDueDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-2 leading-relaxed">
              <h4 className="font-bold text-blue-600 dark:text-blue-400">Confidentiality</h4>
              <p>
                All proceedings, documents, evidence and deliberations shall remain strictly confidential. The Committee shall conduct the inquiry in accordance with the Company's HR Policy and applicable laws while ensuring procedural fairness.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources"}</p>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "confirmation") {
      const effectiveDateOfConfirmation = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"
      const confirmedDesignation = fields.confirmedDesignation || "—"
      const department = fields.department || "—"
      const reportingTo = fields.reportingTo || "—"
      const workLocation = fields.workLocation || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                CONFIRMATION LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.confirmedDesignation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Confirmation of Employment</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
              <p className="mt-2">Your employment particulars are as follows:</p>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Effective Date of Confirmation</td>
                      <td className="p-2">{effectiveDateOfConfirmation}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Designation</td>
                      <td className="p-2">{confirmedDesignation}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Department</td>
                      <td className="p-2">{department}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Reporting To</td>
                      <td className="p-2">{reportingTo}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Work Location</td>
                      <td className="p-2">{workLocation}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Terms of Employment</h4>
                <p className="mt-1">
                  From the effective date of this confirmation, your employment shall continue as a confirmed employee subject to the Company's HR Policy, rules, regulations and applicable laws of Bangladesh.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Performance Expectations</h4>
                <p className="mt-1">
                  You are expected to continue maintaining high standards of integrity, discipline, attendance, professionalism and performance in the discharge of your duties.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Provident Fund & Gratuity</h4>
                <p className="mt-1">
                  The Employee may become eligible to participate in the Company's Provident Fund and Gratuity Schemes in accordance with the respective approved Trust Deeds, Company Policies, applicable laws of Bangladesh, and the eligibility criteria prescribed therein. Detailed provisions shall be communicated separately as and when the schemes become effective and applicable to the Employee.
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Other Benefits</h4>
                <p className="mt-1">
                  You shall continue to enjoy employee benefits in accordance with the Company's HR Policy and any amendments made from time to time.
                </p>
              </div>
              <p className="pt-2 font-semibold text-blue-600 dark:text-blue-400">
                Congratulations on your confirmation. We appreciate your contribution and look forward to your continued commitment and success with Sadoshima Corporation.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Managing Director"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Confirmation Letter and accept the terms stated herein.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "salary_increment") {
      const prevBasic = fields.prevBasic || "—"
      const revBasic = fields.revBasic || "—"
      const prevHouseRent = fields.prevHouseRent || "—"
      const revHouseRent = fields.revHouseRent || "—"
      const prevMedical = fields.prevMedical || "—"
      const revMedical = fields.revMedical || "—"
      const prevConveyance = fields.prevConveyance || "—"
      const revConveyance = fields.revConveyance || "—"
      const prevOtherAllowance = fields.prevOtherAllowance || "—"
      const revOtherAllowance = fields.revOtherAllowance || "—"
      const prevGross = fields.prevGross || "—"
      const revGross = fields.revGross || "—"
      const effectiveDate = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                SALARY REVISION LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6 leading-relaxed">
              <p className="font-bold text-blue-600 dark:text-blue-400">Subject: Salary Revision</p>
              <p>Dear Mr./Ms. {employeeLastName},</p>
              <p className="whitespace-pre-line">{letter.body}</p>
            </div>

            <div className="text-xs space-y-2 mb-8">
              <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-2 font-bold w-1/3">Particular</th>
                      <th className="p-2 font-bold">Previous (BDT)</th>
                      <th className="p-2 font-bold">Revised (BDT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Basic Salary</td>
                      <td className="p-2">{prevBasic}</td>
                      <td className="p-2">{revBasic}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">House Rent Allowance</td>
                      <td className="p-2">{prevHouseRent}</td>
                      <td className="p-2">{revHouseRent}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Medical Allowance</td>
                      <td className="p-2">{prevMedical}</td>
                      <td className="p-2">{revMedical}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Conveyance Allowance</td>
                      <td className="p-2">{prevConveyance}</td>
                      <td className="p-2">{revConveyance}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30">Other Allowance(s)</td>
                      <td className="p-2">{prevOtherAllowance}</td>
                      <td className="p-2">{revOtherAllowance}</td>
                    </tr>
                    <tr className="font-bold bg-slate-50 dark:bg-slate-900">
                      <td className="p-2">Gross Monthly Salary</td>
                      <td className="p-2">{prevGross}</td>
                      <td className="p-2">{revGross}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs space-y-4 mb-8 leading-relaxed">
              <div>
                <h4 className="font-bold text-blue-600 dark:text-blue-400">Terms and Conditions</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>The revised salary shall be effective from <span className="font-semibold">{effectiveDate}</span>.</li>
                  <li>Your designation, reporting relationship, duties and responsibilities shall remain unchanged unless otherwise notified by the Company.</li>
                  <li>All other terms and conditions of your employment shall remain unchanged.</li>
                  <li>This salary revision supersedes your previous salary structure from the effective date.</li>
                </ul>
              </div>
              <p className="pt-2">
                We appreciate your dedication and valuable contribution to Sadoshima Corporation and wish you continued success.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Managing Director"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee Acknowledgement</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Salary Revision Letter.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeIdCode || "—"}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "warning") {
      const incidentDate = fields.incidentDate || fields.dateTime || fields.violationDate || "—"
      const incidentLocation = fields.incidentLocation || fields.location || "—"
      const relevantPolicy = fields.relevantPolicy || fields.violationType || "—"
      const description = fields.description || letter.body || "—"
      const deadline = fields.deadline || fields.actionRequired || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                SHOW CAUSE NOTICE
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
              <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
              <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6">
              <p className="font-bold text-blue-600 dark:text-blue-400">
                Subject: Show Cause Notice
              </p>
              <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
              <p className="leading-relaxed">
                It has been reported that you were allegedly involved in the following incident(s), which, if established, may constitute misconduct and/or a breach of the Company's HR Policy, Code of Conduct and/or your terms of employment.
              </p>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Details of Alleged Misconduct</h3>
              <div className="space-y-1 pl-1">
                <p className="font-semibold">Date & Time: <span className="font-normal">{incidentDate}</span></p>
                <p className="font-semibold">Location: <span className="font-normal">{incidentLocation}</span></p>
                <p className="font-semibold mt-2">Description:</p>
                <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 italic">
                  {description}
                </p>
              </div>
            </div>

            <div className="text-xs space-y-2 mb-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Relevant Policy / Rule</h3>
              <p className="leading-relaxed pl-1 whitespace-pre-line">
                {relevantPolicy}
              </p>
            </div>

            <div className="text-xs space-y-2">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Explanation Required</h3>
              <p className="leading-relaxed pl-1">
                You are hereby required to submit your written explanation as to why disciplinary action should not be taken against you regarding the above matter.
              </p>
              <p className="leading-relaxed pl-1">
                Your written explanation must reach the Human Resources Department on or before <span className="font-semibold">{deadline}</span>. If you fail to submit your explanation within the stipulated time without a reasonable cause, the Company may proceed with the matter and make a decision based on the information available.
              </p>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-12">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">No Presumption of Guilt</h3>
              <p className="leading-relaxed">
                This Show Cause Notice is issued to provide you with an opportunity to explain your position. No final decision has been made regarding this matter.
              </p>
              <p className="leading-relaxed">
                You are expected to continue performing your duties and comply with all Company policies during this process unless otherwise instructed.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-16">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Human Resources / Managing Director"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Acknowledgement of Receipt</h3>
              <p className="leading-relaxed">
                I acknowledge receipt of this Show Cause Notice.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.issueDate ? formatDate(letter.issueDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    if (letter.type === "appointment") {
      const presentAddress = fields.presentAddress || "—"
      const designation = fields.designation || letter.employeeDesignation || "—"
      const department = fields.department || letter.employeeDepartment || "—"
      const startDate = fields.startDate || (letter.effectiveDate ? formatDate(letter.effectiveDate) : "—")
      const offerLetterDate = fields.offerLetterDate || "—"
      const reportingManager = fields.reportingManager || "—"
      const officeLocation = fields.officeLocation || "—"
      const salary = fields.salary || "—"

      return (
        <div className="space-y-6">
          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-left text-xs space-y-1 mb-8">
              <p className="font-bold underline text-slate-900 dark:text-slate-50">Private & Confidential</p>
              <p className="font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
              <p className="font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                APPOINTMENT LETTER
              </h2>
            </div>

            <div className="text-xs space-y-1 mb-6">
              <p className="font-semibold">To</p>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="font-semibold">Present Address: <span className="font-normal">{presentAddress}</span></p>
            </div>

            <div className="text-xs space-y-4 mb-6">
              <p className="font-bold text-blue-600 dark:text-blue-400">
                Subject: Appointment as {designation}
              </p>
              <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
              <p className="leading-relaxed">
                We are pleased to appoint you as <span className="font-semibold">{designation}</span> in the <span className="font-semibold">{department}</span> of Sadoshima Corporation – Bangladesh Liaison Office effective from <span className="font-semibold">{startDate}</span>. Your appointment is made based on your acceptance of our Offer Letter dated <span className="font-semibold">{offerLetterDate}</span> and is governed by the following terms and conditions.
              </p>
            </div>

            <div className="text-xs space-y-4">
              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">1. Position</h3>
                <p className="leading-relaxed mt-1">
                  You are appointed as <span className="font-semibold">{designation}</span> and will report to <span className="font-semibold">{reportingManager}</span> or any other person designated by the Company from time to time.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">2. Place of Posting</h3>
                <p className="leading-relaxed mt-1">
                  Your initial duty station shall be <span className="font-semibold">{officeLocation}</span>. The Company reserves the right to transfer you to any office, project site, or affiliated organization within Bangladesh whenever business requirements so demand.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">3. Probation</h3>
                <p className="leading-relaxed mt-1">
                  You will remain on probation for six (6) months from your date of joining. Upon satisfactory completion of probation and subject to Management approval, your employment may be confirmed in writing. The Company reserves the right to extend the probation period or discontinue your employment during probation in accordance with the Company's HR Policy and applicable laws.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">4. Working Hours</h3>
                <p className="leading-relaxed mt-1">
                  Your working hours shall be in accordance with the Company's office schedule. You may be required to work beyond normal office hours whenever business requirements so necessitate.
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4">
              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">5. Compensation</h3>
                <p className="leading-relaxed mt-1">
                  You shall receive a Gross Monthly Salary of BDT <span className="font-semibold">{salary}</span>. Salary shall be paid through bank transfer in accordance with the Company's payroll schedule.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">6. Leave</h3>
                <p className="leading-relaxed mt-1">
                  You shall be entitled to leave and holidays in accordance with the Company's HR Policy and applicable laws of Bangladesh.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">7. Performance Evaluation</h3>
                <p className="leading-relaxed mt-1">
                  Your performance shall be evaluated periodically under the Company's Performance Management System. Confirmation, salary revision, promotion and other employment benefits shall be based on performance, organizational requirements and Management approval.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">8. Provident Fund and Gratuity</h3>
                <p className="leading-relaxed mt-1">
                  The Employee may become eligible to participate in the Company's Provident Fund and Gratuity Schemes in accordance with the respective approved Trust Deeds, Company Policies, applicable laws of Bangladesh, and the eligibility criteria prescribed therein. The Company reserves the right to amend, revise, suspend, or discontinue such schemes to the extent permitted by applicable laws. Detailed provisions governing these schemes shall be communicated separately upon their implementation and as they become applicable to the Employee.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">9. Confidentiality</h3>
                <p className="leading-relaxed mt-1">
                  You shall maintain strict confidentiality regarding all confidential information acquired during your employment, both during and after separation from the Company.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">10. Code of Conduct</h3>
                <p className="leading-relaxed mt-1">
                  You shall comply with the Company's HR Policy, Code of Conduct and all other policies, procedures and lawful instructions issued from time to time.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">11. Company Property</h3>
                <p className="leading-relaxed mt-1">
                  All Company property issued to you shall remain the property of the Company and must be returned upon request or upon cessation of employment.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">12. Separation from Employment</h3>
                <p className="leading-relaxed mt-1">
                  Either party may terminate this employment in accordance with the Company's HR Policy and applicable laws of Bangladesh.
                </p>
              </div>
            </div>
          </Card>

          <Card className="shadow-xs border-border/40 p-8 sm:p-12 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <div className="text-xs space-y-4 mb-8">
              <div>
                <h3 className="font-bold text-blue-600 dark:text-blue-400">13. Governing Policies</h3>
                <p className="leading-relaxed mt-1">
                  Your employment shall be governed by the Company's HR Policy, Rules & Regulations and applicable laws of Bangladesh.
                </p>
              </div>

              <p className="leading-relaxed pt-2">
                We welcome you to Sadoshima Corporation and wish you a successful and rewarding career with us.
              </p>
            </div>

            <div className="text-xs space-y-6 mb-12">
              <p>Yours faithfully,</p>
              <p className="font-semibold">For Sadoshima Corporation</p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-1"></div>
                <p className="font-bold text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
                <p className="text-muted-foreground">{fields.signatoryDesignation || "Managing Director"}</p>
              </div>
            </div>

            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">Employee's Acceptance</h3>
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                I, <span className="font-semibold">{letter.employeeName}</span>, hereby acknowledge that I have read, understood and accepted the terms and conditions of this Appointment Letter and agree to comply with the Company's policies, rules and regulations.
              </p>
              <div className="pt-12">
                <div className="border-b border-slate-400 w-64 mb-2"></div>
                <p className="font-semibold">Signature of Employee</p>
                <div className="space-y-1 mt-2 text-muted-foreground">
                  <p>Name: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.employeeName}</span></p>
                  <p>Date: <span className="text-slate-900 dark:text-slate-100 font-semibold">{letter.issueDate ? formatDate(letter.issueDate) : "—"}</span></p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return (
      <Card className="shadow-xs border-border/40 bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <CardContent className="p-8">
          <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-slate-100 pb-6 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-slate-50">
                Sadoshima
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                123 Innovation Boulevard, Suite 500<br />
                Dhaka, Bangladesh • contact@sadoshima.com
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-bold text-slate-800 dark:text-slate-200 uppercase">{typeConfig?.name || "HR Letter"}</p>
              <p className="mt-1">Date: {formatDate(letter.issueDate)}</p>
              <p className="mt-0.5">Ref: {letter.id}</p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
              <p className="text-muted-foreground">{letter.employeeDepartment} Department</p>
            </div>

            <div className="pt-2">
              <p className="font-bold text-base text-slate-900 dark:text-slate-50">
                Subject: {letter.subject}
              </p>
            </div>

            <p>Dear {letter.employeeName},</p>

            {letter.body.split("\n").filter(Boolean).map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}

            {Object.keys(fields).length > 0 && (
              <div className="pt-2">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {Object.entries(fields).map(([key, value]) => (
                      <tr key={key}>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-muted-foreground capitalize w-[40%]">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </td>
                        <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-50">
                          {value || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {letter.effectiveDate && (
              <p className="text-xs text-muted-foreground">
                Effective Date: <strong className="text-slate-900 dark:text-slate-50">{formatDate(letter.effectiveDate)}</strong>
              </p>
            )}

            <div className="pt-12 grid grid-cols-2 gap-8">
              <div>
                <p className="text-muted-foreground">Sincerely,</p>
                <div className="h-16 flex items-end">
                  <span className="font-serif italic text-slate-400 dark:text-slate-700">{fields.signatoryName || letter.createdBy}</span>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48">
                  <p className="font-bold text-xs text-slate-900 dark:text-slate-50">{fields.signatoryName || letter.createdBy}</p>
                  <p className="text-[10px] text-muted-foreground">{fields.signatoryDesignation || "Human Resources Department"}</p>
                  <p className="text-[10px] text-muted-foreground">Sadoshima HR Management</p>
                </div>
              </div>

              <div className="flex flex-col justify-end items-end text-right">
                <p className="text-muted-foreground">Acknowledged By:</p>
                <div className="h-16"></div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48 text-left">
                  <p className="font-bold text-xs text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
                  <p className="text-[10px] text-muted-foreground">Employee Signature & Date</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
          {renderLetterContent()}
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
