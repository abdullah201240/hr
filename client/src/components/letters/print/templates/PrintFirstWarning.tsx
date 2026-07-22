import type { LetterPrintProps } from "../types"

export function PrintFirstWarning({ letter, fields, formatDate }: LetterPrintProps) {
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
  const incidentDate = fields.incidentDate || "—"
  const incidentLocation = fields.incidentLocation || "—"
  const description = fields.description || letter.body || "—"
  const previousCounseling = fields.previousCounseling || "—"
  const policyBreach = fields.policyBreach || "—"

  return (
    <>
      {/* Page 1 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
        <div className="text-left text-xs space-y-1 mb-8 print:text-black">
          <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
            FIRST WRITTEN WARNING LETTER
          </h2>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
          <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.designation || "—"}</span></p>
          <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: First Written Warning</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Details of the Incident</h3>
          <div className="space-y-1 pl-1">
            <p className="font-semibold font-sans">Date of Incident: <span className="font-normal">{incidentDate}</span></p>
            <p className="font-semibold font-sans">Location: <span className="font-normal">{incidentLocation}</span></p>
            <p className="font-semibold font-sans mt-2">Description:</p>
            <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 print:border-black italic">
              {description}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6 leading-relaxed">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Previous Counseling (if any)</h3>
          <p className="whitespace-pre-line pl-1">{previousCounseling}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6 leading-relaxed">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Policy Breach</h4>
          <p className="whitespace-pre-line pl-1">{policyBreach}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-3 leading-relaxed mb-12">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Required Improvement</h4>
          <p className="pl-1">
            You are expected to immediately correct your conduct and comply with all Company policies. Failure to demonstrate sustained improvement or repetition of similar misconduct may result in further disciplinary action, including a Final Written Warning, suspension pending investigation, domestic inquiry, or any other action permitted under the Company's HR Policy and applicable laws.
          </p>
          <p className="pl-1 font-semibold print:text-black mt-2">
            Please treat this matter seriously and ensure that such incidents do not recur.
          </p>
        </div>
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
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
            I acknowledge receipt of this First Written Warning Letter.
          </p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-2"></div>
            <p className="font-semibold font-sans">Signature of Employee</p>
            <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600 font-sans">
              <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
              <p>Employee ID: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeIdCode || "—"}</span></p>
              <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"}</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
