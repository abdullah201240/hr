import type { LetterPrintProps } from "../types"

export function PrintInquiryCommittee({ letter, fields, formatDate }: LetterPrintProps) {
  const committeeMemberDesignation = fields.committeeMemberDesignation || "—"
  const accusedEmployeeName = fields.accusedEmployeeName || "—"
  const accusedEmployeeId = fields.accusedEmployeeId || "—"
  const briefAllegation = fields.briefAllegation || "—"
  const committeeChair = fields.committeeChair || "—"
  const committeeMembers = fields.committeeMembers || "—"
  const reportDueDate = fields.reportDueDate ? formatDate(fields.reportDueDate) : "—"
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
            INQUIRY COMMITTEE APPOINTMENT LETTER
          </h2>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="font-semibold">Designation: <span className="font-normal">{committeeMemberDesignation}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Appointment as Inquiry Officer / Member of Inquiry Committee</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Scope of Inquiry</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Examine the allegations objectively.</li>
              <li>Review all relevant documents and evidence.</li>
              <li>Hear the employee and witnesses.</li>
              <li>Maintain impartiality and confidentiality.</li>
              <li>Submit a written inquiry report with findings and recommendations.</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-8">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Inquiry Details</h3>
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
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Employee</td>
                  <td className="p-2">{accusedEmployeeName} (ID: {accusedEmployeeId})</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Allegation</td>
                  <td className="p-2">{briefAllegation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Committee Chair</td>
                  <td className="p-2">{committeeChair}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Members</td>
                  <td className="p-2">{committeeMembers}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Report Due Date</td>
                  <td className="p-2">{reportDueDate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 leading-relaxed mb-12">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Confidentiality</h4>
          <p>
            All proceedings, documents, evidence and deliberations shall remain strictly confidential. The Committee shall conduct the inquiry in accordance with the Company's HR Policy and applicable laws while ensuring procedural fairness.
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
      </div>
    </>
  )
}
