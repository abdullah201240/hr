import type { LetterPrintProps } from "../types"

export function PrintPromotion({ letter, fields, formatDate }: LetterPrintProps) {
  const currentDesignation = fields.currentDesignation || "—"
  const newDesignation = fields.newDesignation || "—"
  const currentGrade = fields.currentGrade || "—"
  const newGrade = fields.newGrade || "—"
  const currentReportingTo = fields.currentReportingTo || "—"
  const newReportingTo = fields.newReportingTo || "—"
  const currentGrossSalary = fields.currentGrossSalary || "—"
  const revGrossSalary = fields.revGrossSalary || "—"
  const revBasic = fields.revBasic || "—"
  const revHouseRent = fields.revHouseRent || "—"
  const revMedical = fields.revMedical || "—"
  const revConveyance = fields.revConveyance || "—"
  const revOtherAllowance = fields.revOtherAllowance || "—"
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
            PROMOTION LETTER
          </h2>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
          <p className="font-semibold">Current Designation: <span className="font-normal">{currentDesignation}</span></p>
          <p className="font-semibold">Department: <span className="font-normal">{letter.employeeDepartment || fields.department || "—"}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Promotion and Revision of Compensation</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
          <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800 print:border-black">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border-b border-slate-200 dark:border-slate-800 print:border-black">
                  <th className="p-2 font-bold w-1/3">Particular</th>
                  <th className="p-2 font-bold">Current</th>
                  <th className="p-2 font-bold">Revised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 print:divide-black font-sans">
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Designation</td>
                  <td className="p-2">{currentDesignation}</td>
                  <td className="p-2">{newDesignation}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Grade</td>
                  <td className="p-2">{currentGrade}</td>
                  <td className="p-2">{newGrade}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Reporting To</td>
                  <td className="p-2">{currentReportingTo}</td>
                  <td className="p-2">{newReportingTo}</td>
                </tr>
                <tr className="font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50 font-bold">
                  <td className="p-2">Gross Monthly Salary</td>
                  <td className="p-2">BDT {currentGrossSalary}</td>
                  <td className="p-2">BDT {revGrossSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-8">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Revised Monthly Salary Structure</h3>
          <div className="border rounded-md overflow-hidden border-slate-200 dark:border-slate-800 print:border-black">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border-b border-slate-200 dark:border-slate-800 print:border-black">
                  <th className="p-2 font-bold w-1/2">Salary Component</th>
                  <th className="p-2 font-bold">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 print:divide-black font-sans">
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Basic Salary</td>
                  <td className="p-2">{revBasic}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">House Rent Allowance</td>
                  <td className="p-2">{revHouseRent}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Medical Allowance</td>
                  <td className="p-2">{revMedical}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Conveyance Allowance</td>
                  <td className="p-2">{revConveyance}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Other Allowance</td>
                  <td className="p-2">{revOtherAllowance}</td>
                </tr>
                <tr className="font-bold bg-slate-50 dark:bg-slate-900 print:bg-slate-100">
                  <td className="p-2">Gross Monthly Salary</td>
                  <td className="p-2">{revGrossSalary}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-8 leading-relaxed">
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Terms</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>This promotion and salary revision shall be effective from <span className="font-semibold">{effectiveDate}</span>.</li>
              <li>All other terms and conditions of your Appointment Letter remain unchanged.</li>
              <li>Your duties and responsibilities shall be in accordance with your new designation and any instructions issued by Management.</li>
              <li>Your future performance will continue to be reviewed under the Company's Performance Management System.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 mb-12">
          <p className="leading-relaxed">
            Congratulations on your well-deserved promotion. We wish you continued success in your new role.
          </p>
          <p className="mt-4">Yours faithfully,</p>
          <p className="font-semibold">For Sadoshima Corporation</p>
          <div className="pt-12">
            <div className="border-b border-slate-400 w-64 mb-1"></div>
            <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || "[Authorized Signatory]"}</p>
            <p className="text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Managing Director"}</p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black border-t border-slate-200 dark:border-slate-800 print:border-black pt-6 space-y-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
          <p className="leading-relaxed">
            I acknowledge receipt and acceptance of this Promotion and Salary Revision Letter.
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
