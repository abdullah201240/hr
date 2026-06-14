import { useParams, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"

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

const letterTypeNames: Record<string, string> = {
  offer: "Offer Letter",
  appointment: "Appointment Letter",
  confirmation: "Confirmation Letter",
  probation_extension: "Probation Extension Letter",
  promotion: "Promotion Letter",
  transfer: "Transfer Letter",
  salary_increment: "Salary Increment Letter",
  warning: "Warning Letter",
  termination: "Termination Letter",
  experience: "Experience Letter",
  relieving: "Relieving Letter",
  proof_of_employment: "Proof of Employment",
}

export default function PrintHRLetterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [letter, setLetter] = useState<HRLetter | null>(null)

  useEffect(() => {
    // Try to load from letters page seed data
    const allLetters: HRLetter[] = [
      {
        id: "HR-L001", type: "offer", employeeName: "James Anderson", employeeDepartment: "Engineering",
        subject: "Employment Offer - Senior Software Engineer", issueDate: "2026-06-10", effectiveDate: "2026-07-01", status: "Sent",
        body: "We are pleased to offer you the position of Senior Software Engineer at Sadoshima HR Management. Your annual compensation will be $95,000 with a 6-month probation period. We look forward to welcoming you to our team.",
        fields: { designation: "Senior Software Engineer", department: "Engineering", salary: "$95,000", startDate: "2026-07-01", probationPeriod: "6 months", benefits: "Health insurance, 401k, 20 days PTO" },
        createdBy: "HR Admin", createdAt: "2026-06-10T09:00:00Z",
      },
      {
        id: "HR-L002", type: "offer", employeeName: "Maria Garcia", employeeDepartment: "Marketing",
        subject: "Employment Offer - Marketing Manager", issueDate: "2026-06-12", effectiveDate: "2026-07-15", status: "Draft",
        body: "We are pleased to offer you the position of Marketing Manager at Sadoshima HR Management. Your annual compensation will be $85,000 with a 3-month probation period.",
        fields: { designation: "Marketing Manager", department: "Marketing", salary: "$85,000", startDate: "2026-07-15", probationPeriod: "3 months", benefits: "Health insurance, 401k" },
        createdBy: "HR Admin", createdAt: "2026-06-12T10:30:00Z",
      },
      {
        id: "HR-L003", type: "confirmation", employeeName: "David Kim", employeeDepartment: "Engineering",
        subject: "Employment Confirmation", issueDate: "2026-06-01", effectiveDate: "2026-06-01", status: "Signed",
        body: "We are pleased to confirm your employment as Software Engineer following the successful completion of your probation period. Your dedication and performance have been commendable.",
        fields: { probationStart: "2025-12-01", probationEnd: "2026-06-01", confirmedDesignation: "Software Engineer" },
        createdBy: "HR Admin", createdAt: "2026-06-01T08:00:00Z",
      },
      {
        id: "HR-L004", type: "promotion", employeeName: "Sarah Mitchell", employeeDepartment: "Product",
        subject: "Promotion to Senior Product Manager", issueDate: "2026-06-05", effectiveDate: "2026-06-15", status: "Sent",
        body: "In recognition of your outstanding contributions, we are pleased to promote you to Senior Product Manager effective June 15, 2026. Your new annual salary will be $120,000.",
        fields: { oldDesignation: "Product Manager", newDesignation: "Senior Product Manager", salaryChange: "+15%", effectiveDate: "2026-06-15" },
        createdBy: "HR Admin", createdAt: "2026-06-05T11:00:00Z",
      },
      {
        id: "HR-L005", type: "warning", employeeName: "Marcus Brown", employeeDepartment: "Sales",
        subject: "First Written Warning - Attendance Policy Violation", issueDate: "2026-06-08", effectiveDate: "2026-06-08", status: "Sent",
        body: "This letter serves as a formal written warning regarding repeated violations of the company attendance policy. You are required to maintain regular attendance and punctuality. Further violations may result in additional disciplinary action.",
        fields: { violationType: "Attendance Policy", description: "Multiple unexcused absences in May 2026", actionRequired: "Maintain 95% attendance", deadline: "2026-07-08" },
        createdBy: "HR Admin", createdAt: "2026-06-08T14:00:00Z",
      },
      {
        id: "HR-L006", type: "transfer", employeeName: "Emily Zhang", employeeDepartment: "Engineering",
        subject: "Transfer to Chicago Office", issueDate: "2026-06-11", effectiveDate: "2026-07-01", status: "Draft",
        body: "We are pleased to inform you of your transfer to our Chicago office effective July 1, 2026. Your role and responsibilities will remain the same. Relocation assistance will be provided.",
        fields: { fromLocation: "New York", toLocation: "Chicago", fromRole: "Software Engineer", toRole: "Software Engineer", effectiveDate: "2026-07-01" },
        createdBy: "HR Admin", createdAt: "2026-06-11T09:30:00Z",
      },
      {
        id: "HR-L007", type: "salary_increment", employeeName: "Lisa Johnson", employeeDepartment: "HR",
        subject: "Annual Salary Revision", issueDate: "2026-06-01", effectiveDate: "2026-06-01", status: "Sent",
        body: "In recognition of your valuable contributions, your annual salary has been revised from $65,000 to $72,000 effective June 1, 2026. This represents a 10.8% increment.",
        fields: { currentSalary: "$65,000", newSalary: "$72,000", effectiveDate: "2026-06-01", incrementPercentage: "10.8%" },
        createdBy: "HR Admin", createdAt: "2026-06-01T10:00:00Z",
      },
      {
        id: "HR-L008", type: "experience", employeeName: "Robert Chen", employeeDepartment: "Finance",
        subject: "Experience Certificate", issueDate: "2026-06-05", effectiveDate: "2026-06-05", status: "Signed",
        body: "This is to certify that Mr. Robert Chen was employed with Sadoshima HR Management as Finance Manager from January 15, 2020 to June 5, 2026. During his tenure, he handled financial planning, budgeting, and reporting functions.",
        fields: { joiningDate: "2020-01-15", relievingDate: "2026-06-05", designation: "Finance Manager", responsibilities: "Financial planning, budgeting, and reporting" },
        createdBy: "HR Admin", createdAt: "2026-06-05T15:00:00Z",
      },
      {
        id: "HR-L009", type: "relieving", employeeName: "Robert Chen", employeeDepartment: "Finance",
        subject: "Relieving Letter", issueDate: "2026-06-05", effectiveDate: "2026-06-05", status: "Signed",
        body: "This is to confirm that your resignation has been accepted and you are relieved from your duties as Finance Manager effective June 5, 2026. We thank you for your contributions.",
        fields: { resignationDate: "2026-05-05", lastWorkingDay: "2026-06-05", noticePeriod: "30 days" },
        createdBy: "HR Admin", createdAt: "2026-06-05T16:00:00Z",
      },
      {
        id: "HR-L010", type: "proof_of_employment", employeeName: "Jennifer Lee", employeeDepartment: "Engineering",
        subject: "Employment Verification Letter", issueDate: "2026-06-10", effectiveDate: "2026-06-10", status: "Sent",
        body: "This letter confirms that Ms. Jennifer Lee is currently employed with Sadoshima HR Management as Senior Developer since March 1, 2021. Her current annual salary is $88,000.",
        fields: { designation: "Senior Developer", salary: "$88,000", joiningDate: "2021-03-01", employmentType: "Full-time Permanent" },
        createdBy: "HR Admin", createdAt: "2026-06-10T11:30:00Z",
      },
    ]

    const match = allLetters.find((l) => l.id === id)
    if (match) {
      setLetter(match)
    }
  }, [id])

  if (!letter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Letter Not Found</h1>
        <p className="text-muted-foreground mt-2">The requested HR letter could not be loaded.</p>
        <Button onClick={() => navigate("/letters")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Letters
        </Button>
      </div>
    )
  }

  const typeName = letterTypeNames[letter.type] || "HR Letter"

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      {/* Control Panel (Hidden during print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print bg-card p-4 rounded-xl border border-border/40 shadow-xs">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 cursor-pointer">
          <Printer className="h-4 w-4" /> Print Document
        </Button>
      </div>

      {/* Official Letter Container */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0">
        {/* Style block for printing */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            html, body, #root, .dark, [class*="dark"] {
              background-color: white !important;
              color: black !important;
            }
            .print-document, .print-document * {
              background-color: white !important;
              color: black !important;
              border-color: #000000 !important;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
          }
        `}} />

        {/* Company Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-slate-50">
              Sadoshima
            </h1>
            <p className="text-xs text-muted-foreground mt-1 print:text-slate-600">
              123 Innovation Boulevard, Suite 500<br />
              Dhaka, Bangladesh • contact@sadoshima.com
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground print:text-slate-600">
            <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">{typeName}</p>
            <p className="mt-1">Date: {formatDate(letter.issueDate)}</p>
            <p className="mt-0.5">Ref: {letter.id}</p>
          </div>
        </div>

        {/* Letter Body */}
        <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed print:text-black">
          {/* Recipient */}
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
            <p className="text-muted-foreground print:text-slate-600">{letter.employeeDepartment} Department</p>
          </div>

          {/* Subject */}
          <div className="pt-2">
            <p className="font-bold text-base text-slate-900 dark:text-slate-50">
              Subject: {letter.subject}
            </p>
          </div>

          {/* Salutation */}
          <p>Dear {letter.employeeName},</p>

          {/* Body Paragraphs */}
          {letter.body.split("\n").filter(Boolean).map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}

          {/* Fields Table */}
          {Object.keys(letter.fields).length > 0 && (
            <div className="pt-2">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {Object.entries(letter.fields).map(([key, value]) => (
                    <tr key={key}>
                      <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-muted-foreground print:text-slate-600 capitalize w-[40%]">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                        {value || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Effective Date */}
          {letter.effectiveDate && (
            <p className="text-xs text-muted-foreground print:text-slate-600">
              Effective Date: <strong className="text-slate-900 dark:text-slate-50 print:text-black">{formatDate(letter.effectiveDate)}</strong>
            </p>
          )}

          {/* Signature Section */}
          <div className="pt-12 grid grid-cols-2 gap-8">
            <div>
              <p className="text-muted-foreground print:text-slate-600">Sincerely,</p>
              <div className="h-16 flex items-end">
                <span className="font-serif italic text-slate-400 dark:text-slate-700 print:text-slate-500">{letter.createdBy}</span>
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{letter.createdBy}</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">Human Resources Department</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">Sadoshima HR Management</p>
              </div>
            </div>

            <div className="flex flex-col justify-end items-end text-right">
              <p className="text-muted-foreground print:text-slate-600">Acknowledged By:</p>
              <div className="h-16"></div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48 text-left">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">Employee Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
