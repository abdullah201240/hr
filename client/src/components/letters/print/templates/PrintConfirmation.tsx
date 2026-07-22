import type { LetterPrintProps } from "../types"

export function PrintConfirmation({ letter, fields, formatDate }: LetterPrintProps) {
  const effectiveDateOfConfirmation = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"
  const confirmedDesignation = fields.confirmedDesignation || "—"
  const department = fields.department || "—"
  const reportingTo = fields.reportingTo || "—"
  const workLocation = fields.workLocation || "—"
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
            CONFIRMATION LETTER
          </h2>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
          <p className="font-semibold">Designation: <span className="font-normal">{letter.employeeDesignation || fields.confirmedDesignation || "—"}</span></p>
          <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Confirmation of Employment</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
          <p className="mt-2">Your employment particulars are as follows:</p>
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
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Effective Date of Confirmation</td>
                  <td className="p-2">{effectiveDateOfConfirmation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Designation</td>
                  <td className="p-2">{confirmedDesignation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Department</td>
                  <td className="p-2">{department}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Reporting To</td>
                  <td className="p-2">{reportingTo}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Work Location</td>
                  <td className="p-2">{workLocation}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Terms of Employment</h4>
            <p className="mt-1">
              From the effective date of this confirmation, your employment shall continue as a confirmed employee subject to the Company's HR Policy, rules, regulations and applicable laws of Bangladesh.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Performance Expectations</h4>
            <p className="mt-1">
              You are expected to continue maintaining high standards of integrity, discipline, attendance, professionalism and performance in the discharge of your duties.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Provident Fund & Gratuity</h4>
            <p className="mt-1 font-sans">
              The Employee may become eligible to participate in the Company's Provident Fund and Gratuity Schemes in accordance with the respective approved Trust Deeds, Company Policies, applicable laws of Bangladesh, and the eligibility criteria prescribed therein. Detailed provisions shall be communicated separately as and when the schemes become effective and applicable to the Employee.
            </p>
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Other Benefits</h4>
            <p className="mt-1">
              You shall continue to enjoy employee benefits in accordance with the Company's HR Policy and any amendments made from time to time.
            </p>
          </div>
          <p className="pt-2 font-semibold text-blue-600 dark:text-blue-400 print:text-blue-600">
            Congratulations on your confirmation. We appreciate your contribution and look forward to your continued commitment and success with Sadoshima Corporation.
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

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-black pt-6 space-y-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
          <p className="leading-relaxed">
            I acknowledge receipt of this Confirmation Letter and accept the terms stated herein.
          </p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-2"></div>
            <p className="font-semibold font-sans">Signature of Employee</p>
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
