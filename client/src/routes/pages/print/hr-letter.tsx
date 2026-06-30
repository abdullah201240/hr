import { useParams, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, Loader2 } from "lucide-react"
import { useLetterQuery } from "@/hooks/useLetters"
import {
  PrintWarning,
  PrintAppointment,
  PrintRelieving,
  PrintFirstWarning,
  PrintFinalWarning,
  PrintSuspension,
  PrintDomesticInquiry,
  PrintInquiryCommittee,
  PrintConfirmation,
  PrintOffer,
  PrintSalaryRevision,
  PrintDefaultLetter,
} from "@/components/letters/print/LetterPrintComponents"

const letterTypeNames: Record<string, string> = {
  offer: "Offer Letter",
  appointment: "Appointment Letter",
  confirmation: "Confirmation Letter",
  probation_extension: "Probation Extension Letter",
  promotion: "Promotion Letter",
  transfer: "Transfer Letter",
  salary_increment: "Salary Increment Letter",
  warning: "Show Cause Notice",
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
  const fields = letter.fields || {}

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const renderLetterPrintContent = () => {
    switch (letter.type) {
      case "warning":
        return <PrintWarning letter={letter} fields={fields} formatDate={formatDate} />
      case "appointment":
        return <PrintAppointment letter={letter} fields={fields} formatDate={formatDate} />
      case "relieving":
        return <PrintRelieving letter={letter} fields={fields} formatDate={formatDate} />
      case "first_warning":
        return <PrintFirstWarning letter={letter} fields={fields} formatDate={formatDate} />
      case "final_warning":
        return <PrintFinalWarning letter={letter} fields={fields} formatDate={formatDate} />
      case "suspension":
        return <PrintSuspension letter={letter} fields={fields} formatDate={formatDate} />
      case "domestic_inquiry":
        return <PrintDomesticInquiry letter={letter} fields={fields} formatDate={formatDate} />
      case "inquiry_committee":
        return <PrintInquiryCommittee letter={letter} fields={fields} formatDate={formatDate} />
      case "confirmation":
        return <PrintConfirmation letter={letter} fields={fields} formatDate={formatDate} />
      case "offer":
        return <PrintOffer letter={letter} fields={fields} formatDate={formatDate} />
      case "salary_increment":
        return <PrintSalaryRevision letter={letter} fields={fields} formatDate={formatDate} />
      default:
        return <PrintDefaultLetter letter={letter} fields={fields} formatDate={formatDate} typeName={typeName} />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0 font-sans">
      {/* Control Panel (Hidden during print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print bg-card p-4 rounded-xl border border-border/40 shadow-xs">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2 cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={() => window.print()} className="gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="h-4 w-4" /> Print Document
        </Button>
      </div>

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

      {renderLetterPrintContent()}
    </div>
  )
}
