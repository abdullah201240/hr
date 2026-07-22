import type { LetterPrintProps } from "../types"

export function PrintRelieving({ letter, fields, formatDate }: LetterPrintProps) {
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
  const resignationDate = fields.resignationDate ? formatDate(fields.resignationDate) : "—"
  const lastWorkingDay = fields.lastWorkingDay ? formatDate(fields.lastWorkingDay) : "—"
  const noticePeriod = fields.noticePeriod || "—"
  const reasonForLeaving = fields.reasonForLeaving || "—"
  const reportingManager = fields.reportingManager || "—"

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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 print:divide-black font-sans">
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
    </>
  )
}
