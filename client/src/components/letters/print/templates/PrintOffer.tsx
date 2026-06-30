import type { LetterPrintProps } from "../types"

export function PrintOffer({ letter, fields, formatDate }: LetterPrintProps) {
  const presentAddress = fields.presentAddress || "—"
  const designation = fields.designation || "—"
  const department = fields.department || "—"
  const employmentType = fields.employmentType || "—"
  const reportingTo = fields.reportingTo || "—"
  const dutyStation = fields.dutyStation || "—"
  const proposedJoiningDate = fields.proposedJoiningDate ? formatDate(fields.proposedJoiningDate) : "—"
  const monthlyGrossSalary = fields.monthlyGrossSalary || "—"
  const offerExpiryDate = fields.offerExpiryDate ? formatDate(fields.offerExpiryDate) : "—"
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"

  return (
    <>
      {/* Page 1 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
        <div className="text-left text-xs space-y-1 mb-8 print:text-black">
          <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref.: <span className="font-normal">{letter.id}</span></p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="whitespace-pre-line">{presentAddress}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Offer of Employment</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-8">
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
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Position</td>
                  <td className="p-2">{designation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Department</td>
                  <td className="p-2">{department}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Employment Type</td>
                  <td className="p-2">{employmentType}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Reporting To</td>
                  <td className="p-2">{reportingTo}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Duty Station</td>
                  <td className="p-2">{dutyStation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Proposed Joining Date</td>
                  <td className="p-2">{proposedJoiningDate}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Monthly Gross Salary</td>
                  <td className="p-2">BDT {monthlyGrossSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
          <p>This offer is subject to the following conditions:</p>
          <ol className="list-decimal pl-5 space-y-2 font-sans">
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
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
          <p>Yours faithfully,</p>
          <p className="font-semibold">For Sadoshima Corporation</p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-1"></div>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy || "[Authorized Signatory]"}</p>
            <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Managing Director"}</p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-black pt-6 space-y-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Acceptance of Offer</h3>
          <p className="leading-relaxed">
            I, <span className="font-semibold">{letter.employeeName}</span>, hereby accept the above Offer of Employment and agree to join Sadoshima Corporation – Bangladesh Liaison Office on <span className="font-semibold">{proposedJoiningDate}</span>.
          </p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-2"></div>
            <p className="font-semibold">Signature of Candidate</p>
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
