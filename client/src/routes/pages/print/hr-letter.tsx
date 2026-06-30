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

  if (letter.type === "warning") {
    const fields = letter.fields || {}
    const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
    
    // Support fallbacks for fields to maintain backward compatibility
    const incidentDate = fields.incidentDate || fields.dateTime || fields.violationDate || "—"
    const incidentLocation = fields.incidentLocation || fields.location || "—"
    const relevantPolicy = fields.relevantPolicy || fields.violationType || "—"
    const description = fields.description || letter.body || "—"
    const deadline = fields.deadline || fields.actionRequired || "—"

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

        {/* Page 1 Container */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
          
          {/* Header block */}
          <div className="text-left text-xs space-y-1 mb-8 print:text-black">
            <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
          </div>

          {/* Letter Title */}
          <div className="text-center mb-10">
            <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
              SHOW CAUSE NOTICE
            </h2>
          </div>

          {/* Recipient details */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
            <p className="font-semibold">To</p>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
            <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
            <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
            <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
          </div>

          {/* Subject & Salutation */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6">
            <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
              Subject: Show Cause Notice
            </p>
            <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
            <p className="leading-relaxed">
              It has been reported that you were allegedly involved in the following incident(s), which, if established, may constitute misconduct and/or a breach of the Company's HR Policy, Code of Conduct and/or your terms of employment.
            </p>
          </div>

          {/* Details of Alleged Misconduct */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Details of Alleged Misconduct</h3>
            <div className="space-y-1 pl-1">
              <p className="font-semibold">Date & Time: <span className="font-normal">{incidentDate}</span></p>
              <p className="font-semibold">Location: <span className="font-normal">{incidentLocation}</span></p>
              <p className="font-semibold mt-2">Description:</p>
              <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 print:border-black italic">
                {description}
              </p>
            </div>
          </div>

          {/* Relevant Policy / Rule */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Relevant Policy / Rule</h3>
            <p className="leading-relaxed pl-1 whitespace-pre-line">
              {relevantPolicy}
            </p>
          </div>

          {/* Explanation Required */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Explanation Required</h3>
            <p className="leading-relaxed pl-1">
              You are hereby required to submit your written explanation as to why disciplinary action should not be taken against you regarding the above matter.
            </p>
            <p className="leading-relaxed pl-1">
              Your written explanation must reach the Human Resources Department on or before <span className="font-semibold">{deadline}</span>. If you fail to submit your explanation within the stipulated time without a reasonable cause, the Company may proceed with the matter and make a decision based on the information available.
            </p>
          </div>
        </div>

        {/* Page 2 Container (Print layout break) */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl mt-6 print:border-0 print:shadow-none print:p-0 print:mt-0 print:break-before-page">
          
          {/* No Presumption of Guilt */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-12">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">No Presumption of Guilt</h3>
            <p className="leading-relaxed">
              This Show Cause Notice is issued to provide you with an opportunity to explain your position. No final decision has been made regarding this matter.
            </p>
            <p className="leading-relaxed">
              You are expected to continue performing your duties and comply with all Company policies during this process unless otherwise instructed.
            </p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-16">
            <p>Yours faithfully,</p>
            <p className="font-semibold">For Sadoshima Corporation</p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
              <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Human Resources / Managing Director"}</p>
            </div>
          </div>

          {/* Employee Acknowledgement */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Acknowledgement of Receipt</h3>
            <p className="leading-relaxed">
              I acknowledge receipt of this Show Cause Notice.
            </p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-2"></div>
              <p className="font-semibold">Signature of Employee</p>
              <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600">
                <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
                <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.issueDate ? formatDate(letter.issueDate) : "—"}</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  if (letter.type === "appointment") {
    const fields = letter.fields || {}
    const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
    
    // Support fallbacks for fields to maintain backward compatibility
    const presentAddress = fields.presentAddress || "—"
    const designation = fields.designation || letter.employeeDesignation || "—"
    const department = fields.department || letter.employeeDepartment || "—"
    const startDate = fields.startDate || (letter.effectiveDate ? formatDate(letter.effectiveDate) : "—")
    const offerLetterDate = fields.offerLetterDate || "—"
    const reportingManager = fields.reportingManager || "—"
    const officeLocation = fields.officeLocation || "—"
    const salary = fields.salary || "—"

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

        {/* Page 1 Container */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
          
          {/* Header block */}
          <div className="text-left text-xs space-y-1 mb-8 print:text-black">
            <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
          </div>

          {/* Letter Title */}
          <div className="text-center mb-10">
            <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
              APPOINTMENT LETTER
            </h2>
          </div>

          {/* Recipient details */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
            <p className="font-semibold">To</p>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
            <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
            <p className="font-semibold">Present Address: <span className="font-normal">{presentAddress}</span></p>
          </div>

          {/* Subject & Salutation */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6">
            <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
              Subject: Appointment as {designation}
            </p>
            <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
            <p className="leading-relaxed">
              We are pleased to appoint you as <span className="font-semibold">{designation}</span> in the <span className="font-semibold">{department}</span> of Sadoshima Corporation – Bangladesh Liaison Office effective from <span className="font-semibold">{startDate}</span>. Your appointment is made based on your acceptance of our Offer Letter dated <span className="font-semibold">{offerLetterDate}</span> and is governed by the following terms and conditions.
            </p>
          </div>

          {/* Clauses 1 to 4 */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4">
            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">1. Position</h3>
              <p className="leading-relaxed mt-1">
                You are appointed as <span className="font-semibold">{designation}</span> and will report to <span className="font-semibold">{reportingManager}</span> or any other person designated by the Company from time to time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">2. Place of Posting</h3>
              <p className="leading-relaxed mt-1">
                Your initial duty station shall be <span className="font-semibold">{officeLocation}</span>. The Company reserves the right to transfer you to any office, project site, or affiliated organization within Bangladesh whenever business requirements so demand.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">3. Probation</h3>
              <p className="leading-relaxed mt-1">
                You will remain on probation for six (6) months from your date of joining. Upon satisfactory completion of probation and subject to Management approval, your employment may be confirmed in writing. The Company reserves the right to extend the probation period or discontinue your employment during probation in accordance with the Company's HR Policy and applicable laws.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">4. Working Hours</h3>
              <p className="leading-relaxed mt-1">
                Your working hours shall be in accordance with the Company's office schedule. You may be required to work beyond normal office hours whenever business requirements so necessitate.
              </p>
            </div>
          </div>
        </div>

        {/* Page 2 Container (Print layout break) */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl mt-6 print:border-0 print:shadow-none print:p-0 print:mt-0 print:break-before-page">
          
          {/* Clauses 5 to 12 */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4">
            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">5. Compensation</h3>
              <p className="leading-relaxed mt-1">
                You shall receive a Gross Monthly Salary of BDT <span className="font-semibold">{salary}</span>. Salary shall be paid through bank transfer in accordance with the Company's payroll schedule.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">6. Leave</h3>
              <p className="leading-relaxed mt-1">
                You shall be entitled to leave and holidays in accordance with the Company's HR Policy and applicable laws of Bangladesh.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">7. Performance Evaluation</h3>
              <p className="leading-relaxed mt-1">
                Your performance shall be evaluated periodically under the Company's Performance Management System. Confirmation, salary revision, promotion and other employment benefits shall be based on performance, organizational requirements and Management approval.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">8. Provident Fund and Gratuity</h3>
              <p className="leading-relaxed mt-1">
                The Employee may become eligible to participate in the Company's Provident Fund and Gratuity Schemes in accordance with the respective approved Trust Deeds, Company Policies, applicable laws of Bangladesh, and the eligibility criteria prescribed therein. The Company reserves the right to amend, revise, suspend, or discontinue such schemes to the extent permitted by applicable laws. Detailed provisions governing these schemes shall be communicated separately upon their implementation and as they become applicable to the Employee.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">9. Confidentiality</h3>
              <p className="leading-relaxed mt-1">
                You shall maintain strict confidentiality regarding all confidential information acquired during your employment, both during and after separation from the Company.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">10. Code of Conduct</h3>
              <p className="leading-relaxed mt-1">
                You shall comply with the Company's HR Policy, Code of Conduct and all other policies, procedures and lawful instructions issued from time to time.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">11. Company Property</h3>
              <p className="leading-relaxed mt-1">
                All Company property issued to you shall remain the property of the Company and must be returned upon request or upon cessation of employment.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">12. Separation from Employment</h3>
              <p className="leading-relaxed mt-1">
                Either party may terminate this employment in accordance with the Company's HR Policy and applicable laws of Bangladesh.
              </p>
            </div>
          </div>
        </div>

        {/* Page 3 Container (Print layout break) */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl mt-6 print:border-0 print:shadow-none print:p-0 print:mt-0 print:break-before-page">
          
          {/* Clause 13 & Closing */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8">
            <div>
              <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">13. Governing Policies</h3>
              <p className="leading-relaxed mt-1">
                Your employment shall be governed by the Company's HR Policy, Rules & Regulations and applicable laws of Bangladesh.
              </p>
            </div>

            <p className="leading-relaxed pt-2">
              We welcome you to Sadoshima Corporation and wish you a successful and rewarding career with us.
            </p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
            <p>Yours faithfully,</p>
            <p className="font-semibold">For Sadoshima Corporation</p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
              <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Managing Director"}</p>
            </div>
          </div>

          {/* Employee Acceptance */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee's Acceptance</h3>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300 print:text-black">
              I, <span className="font-semibold">{letter.employeeName}</span>, hereby acknowledge that I have read, understood and accepted the terms and conditions of this Appointment Letter and agree to comply with the Company's policies, rules and regulations.
            </p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-2"></div>
              <p className="font-semibold">Signature of Employee</p>
              <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600">
                <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
                <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.issueDate ? formatDate(letter.issueDate) : "—"}</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  if (letter.type === "relieving") {
    const resignationDate = fields.resignationDate ? formatDate(fields.resignationDate) : "—"
    const lastWorkingDay = fields.lastWorkingDay ? formatDate(fields.lastWorkingDay) : "—"
    const noticePeriod = fields.noticePeriod || "—"
    const reasonForLeaving = fields.reasonForLeaving || "—"
    const reportingManager = fields.reportingManager || "—"
    const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"

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

        {/* Page 1 */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
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

          <div className="text-left text-xs space-y-1 mb-8 print:text-black">
            <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
              RESIGNATION ACCEPTANCE LETTER
            </h2>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
            <p className="font-semibold">To</p>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
            <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
            <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
            <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Acceptance of Resignation</p>
            <p>Dear Mr./Ms. {employeeLastName},</p>
            <p className="whitespace-pre-line">{letter.body}</p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-8">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Separation Details</h3>
            <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800 print:border-black">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border-b border-slate-200 dark:border-slate-800 print:border-black">
                    <th className="p-2 font-bold w-1/3">Particular</th>
                    <th className="p-2 font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900 print:divide-black">
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Resignation Date</td>
                    <td className="p-2">{resignationDate}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Notice Period</td>
                    <td className="p-2">{noticePeriod}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Last Working Day</td>
                    <td className="p-2">{lastWorkingDay}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Reason for Leaving</td>
                    <td className="p-2">{reasonForLeaving}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Reporting Manager</td>
                    <td className="p-2">{reportingManager}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
            <div>
              <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Handover and Clearance</h4>
              <p className="mt-1">
                You are required to complete the handover of all duties, files, records, passwords, documents, and Company assets to your Reporting Manager or the person nominated by Management. All departmental clearances must be completed before your final settlement is processed.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Full & Final Settlement</h4>
              <p className="mt-1">
                Your Full & Final Settlement shall be processed after successful completion of the clearance formalities and subject to Company policy and applicable laws. Any outstanding dues payable by either party shall be adjusted accordingly.
              </p>
            </div>
          </div>
        </div>

        {/* Page 2 */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
            <div>
              <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Exit Formalities</h4>
              <p className="mt-1">
                Subject to satisfactory completion of all exit formalities, the Company will issue applicable employment documents such as the Experience Certificate and No Objection Certificate (where applicable).
              </p>
            </div>
            <p className="pt-2 font-semibold">
              We sincerely appreciate your contribution to the Company and wish you success in your future endeavors.
            </p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
            <p>Yours faithfully,</p>
            <p className="font-semibold">For Sadoshima Corporation</p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
              <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Human Resources"}</p>
            </div>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-black pt-6 space-y-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
            <p className="leading-relaxed">
              I acknowledge receipt of this Resignation Acceptance Letter.
            </p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-2"></div>
              <p className="font-semibold">Signature of Employee</p>
              <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600">
                <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
                <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (letter.type === "salary_increment") {
    const fields = letter.fields || {}
    const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
    
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

        {/* Page 1 Container */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
          
          {/* Header block */}
          <div className="text-left text-xs space-y-1 mb-8 print:text-black">
            <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
            <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
          </div>

          {/* Letter Title */}
          <div className="text-center mb-10">
            <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
              PERFORMANCE REVIEW OUTCOME & SALARY INCREMENT LETTER
            </h2>
          </div>

          {/* Recipient details */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
            <p className="font-semibold">To</p>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
            <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
            <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
            <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
          </div>

          {/* Subject & Salutation */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6">
            <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
              Subject: Annual Performance Review Outcome and Salary Revision
            </p>
            <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
            <p className="leading-relaxed">
              We are pleased to inform you that your Annual Performance Review for the period{" "}
              <span className="font-semibold">{fields.reviewPeriod || "[Review Period]"}</span> has been completed.
              Based on your overall performance, achievement of assigned Key Performance Indicators (KPIs),
              demonstration of Company values, and Management's assessment, the Management has approved the following:
            </p>
          </div>

          {/* Details Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100">
                  <th className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-left font-bold text-slate-900 dark:text-slate-50 print:text-black w-[40%]">Particular</th>
                  <th className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-left font-bold text-slate-900 dark:text-slate-50 print:text-black">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Performance Rating</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{fields.performanceRating || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Overall Score</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{fields.overallScore || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Review Period</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{fields.reviewPeriod || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Effective Date</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Current Gross Salary</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">BDT {fields.currentGrossSalary || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Revised Gross Salary</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">BDT {fields.revisedGrossSalary || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Monthly Increment</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">BDT {fields.monthlyIncrement || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Annual Increment (%)</td>
                  <td className="border border-slate-300 dark:border-slate-700 py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{fields.annualIncrementPercentage || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Management Remarks */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Management Remarks</h3>
            <p className="leading-relaxed whitespace-pre-line italic">
              {fields.managementRemarks || "[Remarks are pending completion.]"}
            </p>
          </div>

          {/* Future Expectations */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Future Expectations</h3>
            <p className="leading-relaxed">
              You are expected to continue maintaining high standards of professionalism, integrity,
              teamwork and performance while contributing towards the achievement of departmental and
              organizational objectives. Your performance will continue to be reviewed in accordance
              with the Company's Performance Management System.
            </p>
          </div>
        </div>

        {/* Page 2 Container (Print layout break) */}
        <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl mt-6 print:border-0 print:shadow-none print:p-0 print:mt-0 print:break-before-page">
          {/* Salary Revision */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Salary Revision</h3>
            <p className="leading-relaxed">
              The revised salary stated above shall be effective from{" "}
              <span className="font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "[Effective Date]"}</span> and shall
              supersede your previous salary. All other terms and conditions of your employment
              shall remain unchanged.
            </p>
            <p className="leading-relaxed">
              We appreciate your valuable contribution and congratulate you on your continued
              commitment to Sadoshima Corporation. We wish you every success in your future
              career with the Company.
            </p>
          </div>

          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
            <p>Yours faithfully,</p>
            <p className="font-semibold">For Sadoshima Corporation</p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-1"></div>
              <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || "[Authorized Signatory]"}</p>
              <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Managing Director"}</p>
            </div>
          </div>

          {/* Employee Acknowledgement */}
          <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
            <p className="leading-relaxed">
              I acknowledge receipt of this Performance Review Outcome and Salary Increment Letter.
            </p>
            <div className="pt-12">
              <div className="border-b border-slate-400 w-64 mb-2"></div>
              <p className="font-semibold">Signature of Employee</p>
              <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600">
                <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
                <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

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
                <span className="font-serif italic text-slate-400 dark:text-slate-700 print:text-slate-500">{fields.signatoryName || letter.createdBy}</span>
              </div>
              <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48">
                <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy}</p>
                <p className="text-[10px] text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Human Resources Department"}</p>
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
