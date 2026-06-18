import { useParams, useNavigate } from "react-router"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"

interface Candidate {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  source: string
  stage: string
  appliedDate: string
  offerLetterGenerated?: boolean
  joiningLetterGenerated?: boolean
  offeredSalary?: string
  offeredStartDate?: string
  joiningManager?: string
}

export default function PrintJoiningLetterPage() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState<Candidate | null>(null)

  useEffect(() => {
    const storedCandidates = localStorage.getItem("recruitment_candidates")
    if (storedCandidates) {
      try {
        const parsed: Candidate[] = JSON.parse(storedCandidates)
        const match = parsed.find(c => c.id === candidateId)
        if (match) {
          setCandidate(match)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [candidateId])

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Candidate Not Found</h1>
        <p className="text-muted-foreground mt-2">The candidate record could not be loaded.</p>
        <Button onClick={() => navigate("/recruitment")} className="mt-4 gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Recruitment
        </Button>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const joiningDate = candidate.offeredStartDate
    ? new Date(candidate.offeredStartDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

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
            /* Overwrite dark mode background and colors entirely */
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
            <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">CONFIDENTIAL</p>
            <p className="mt-1">Date: {todayStr}</p>
            <p className="mt-0.5 font-mono">REF: JOI-{new Date().getFullYear()}-{candidate.id.toUpperCase().slice(-6)}</p>
          </div>
        </div>

        {/* Letter Body */}
        <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed print:text-black">
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{candidate.name}</p>
            <p className="text-muted-foreground print:text-slate-600">{candidate.email}</p>
            {candidate.phone && <p className="text-muted-foreground print:text-slate-600">{candidate.phone}</p>}
          </div>

          <div className="pt-2">
            <p className="font-bold text-base text-slate-900 dark:text-slate-50 print:text-black">
              Subject: Letter of Appointment & Joining Details
            </p>
          </div>

          <p>Dear {candidate.name},</p>

          <p>
            We are pleased to formally issue this Letter of Appointment for the position of <strong>{candidate.role}</strong> at Sadoshima. This letter confirms your onboarding placement into our organization.
          </p>

          <p>
            Your employment will commence on <strong>{joiningDate}</strong>. You will be reporting directly to <strong>{candidate.joiningManager || "Michael Torres"}</strong>.
          </p>

          <p className="font-bold text-slate-900 dark:text-slate-50 mt-4 print:text-black">
            Terms and Conditions of Employment:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Compensation:</strong> Your initial base compensation will be {candidate.offeredSalary || "$80,000 / year"}, payable in accordance with the company's monthly payroll schedule.
            </li>
            <li>
              <strong>Working Hours:</strong> Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday, subject to standard company policies.
            </li>
            <li>
              <strong>Probation Period:</strong> You will be on probation for a period of three (3) months from your starting date.
            </li>
          </ul>

          <p>
            Please sign and return the duplicate copy of this letter as a token of your formal acceptance of the joining terms. We look forward to welcoming you to our team.
          </p>

          {/* Signature Section */}
          <div className="pt-12 grid grid-cols-2 gap-8">
            <div>
              <p className="text-muted-foreground print:text-slate-600">Sincerely,</p>
              <div className="h-16 flex items-end">
                <span className="font-serif italic text-slate-400 dark:text-slate-700 print:text-slate-400">Patricia Lee</span>
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48 print:border-slate-400">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">Patricia Lee</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">Head of Human Resources</p>
              </div>
            </div>

            <div className="flex flex-col justify-end items-end text-right">
              <p className="text-muted-foreground print:text-slate-600">Accepted By:</p>
              <div className="h-16"></div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48 text-left print:border-slate-400">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{candidate.name}</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">Candidate Signature & Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
