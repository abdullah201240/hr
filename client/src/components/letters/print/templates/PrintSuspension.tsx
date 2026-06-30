import type { LetterPrintProps } from "../types"

export function PrintSuspension({ letter, fields, formatDate }: LetterPrintProps) {
  const incidentDate = fields.incidentDate || "—"
  const natureOfAllegation = fields.natureOfAllegation || "—"
  const reasonForSuspension = fields.reasonForSuspension || "—"
  const effectiveDate = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"

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
            SUSPENSION PENDING INVESTIGATION
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
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Suspension Pending Investigation</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Reason for Suspension</h3>
          <div className="space-y-1 pl-1">
            <p className="font-semibold font-sans">Date of Incident: <span className="font-normal">{incidentDate}</span></p>
            <p className="font-semibold font-sans">Nature of Allegation: <span className="font-normal">{natureOfAllegation}</span></p>
            <p className="font-semibold font-sans">Reason for Suspension: <span className="font-normal">{reasonForSuspension}</span></p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Terms of Suspension</h3>
          <ul className="list-disc pl-5 space-y-1.5 mt-1 font-sans">
            <li><span className="font-semibold">Effective Date:</span> {effectiveDate}</li>
            <li><span className="font-semibold">Suspension Period:</span> Until further written notice or completion of the investigation.</li>
            <li>During suspension you shall remain available to cooperate fully with the investigation.</li>
            <li>You shall not enter Company premises or contact employees, customers or suppliers regarding this matter unless authorized.</li>
            <li>Salary and benefits during suspension shall be administered in accordance with the Company's HR Policy and applicable laws.</li>
          </ul>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 leading-relaxed mb-12">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Further Process</h4>
          <p>
            You will be informed separately if a Show Cause Notice, Domestic Inquiry Notice, or any other disciplinary proceeding is initiated. You will be given a reasonable opportunity to present your explanation before any final decision is made.
          </p>
        </div>
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
          <p>Yours faithfully,</p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-1"></div>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
            <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Human Resources"}</p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-black pt-6 space-y-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
          <p className="leading-relaxed">
            I acknowledge receipt of this Suspension Pending Investigation Letter.
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
