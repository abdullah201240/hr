import { useParams, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Loader2 } from "lucide-react"
import { useLetterQuery } from "@/hooks/useLetters"

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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: letter, isLoading, isError } = useLetterQuery(id || "")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Loading letter print view...</p>
      </div>
    )
  }

  if (isError || !letter) {
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
