import type { LetterPrintProps } from "../types"

export function PrintSalaryRevision({ letter, fields, formatDate }: LetterPrintProps) {
  const prevBasic = fields.prevBasic || "—"
  const revBasic = fields.revBasic || "—"
  const prevHouseRent = fields.prevHouseRent || "—"
  const revHouseRent = fields.revHouseRent || "—"
  const prevMedical = fields.prevMedical || "—"
  const revMedical = fields.revMedical || "—"
  const prevConveyance = fields.prevConveyance || "—"
  const revConveyance = fields.revConveyance || "—"
  const prevOtherAllowance = fields.prevOtherAllowance || "—"
  const revOtherAllowance = fields.revOtherAllowance || "—"
  const prevGross = fields.prevGross || "—"
  const revGross = fields.revGross || "—"
  const effectiveDate = letter.effectiveDate ? formatDate(letter.effectiveDate) : "—"
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"

  return (
    <>
      {/* Page 1 Container */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4">
        <div className="text-left text-xs space-y-1 mb-8 print:text-black">
          <p className="font-bold underline text-slate-900 dark:text-slate-50 print:text-black">Private & Confidential</p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Ref. No.: <span className="font-normal">{letter.id}</span></p>
          <p className="text-slate-800 dark:text-slate-200 print:text-black font-semibold">Date: <span className="font-normal">{formatDate(letter.issueDate)}</span></p>
        </div>

        <div className="text-center mb-10">
          <h2 className="text-sm sm:text-base font-bold underline text-blue-600 dark:text-blue-400 print:text-blue-600 uppercase tracking-wide">
            SALARY REVISION LETTER
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
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Salary Revision</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line leading-relaxed">{letter.body}</p>
        </div>

        <div className="mb-6">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 print:border-black text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 print:bg-slate-100 border-b border-slate-300 dark:border-slate-700 print:border-black">
                <th className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-left font-bold text-slate-900 dark:text-slate-50 print:text-black w-[40%]">Particular</th>
                <th className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-left font-bold text-slate-900 dark:text-slate-50 print:text-black">Previous (BDT)</th>
                <th className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-left font-bold text-slate-900 dark:text-slate-50 print:text-black">Revised (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black font-sans">
              <tr>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Basic Salary</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevBasic}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revBasic}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">House Rent Allowance</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevHouseRent}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revHouseRent}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Medical Allowance</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevMedical}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revMedical}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Conveyance Allowance</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevConveyance}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revConveyance}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 print:text-black">Other Allowance(s)</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevOtherAllowance}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revOtherAllowance}</td>
              </tr>
              <tr className="font-bold bg-slate-50 dark:bg-slate-900 print:bg-slate-100">
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">Gross Monthly Salary</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{prevGross}</td>
                <td className="border border-slate-300 dark:border-slate-700 print:border-black py-2 px-3 text-slate-800 dark:text-slate-200 print:text-black">{revGross}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6 leading-relaxed">
          <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Terms and Conditions</h4>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>The revised salary shall be effective from <span className="font-semibold">{effectiveDate}</span>.</li>
            <li>Your designation, reporting relationship, duties and responsibilities shall remain unchanged unless otherwise notified by the Company.</li>
            <li>All other terms and conditions of your employment shall remain unchanged.</li>
            <li>This salary revision supersedes your previous salary structure from the effective date.</li>
          </ul>
          <p className="pt-2">
            We appreciate your dedication and valuable contribution to Sadoshima Corporation and wish you continued success.
          </p>
        </div>
      </div>

      {/* Page 2 Container (Print layout break) */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl mt-6 print:border-0 print:shadow-none print:p-0 print:mt-0 print:break-before-page">
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
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-6 border-t border-slate-200 dark:border-slate-800 print:border-black pt-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Acknowledgement</h3>
          <p className="leading-relaxed">
            I acknowledge receipt of this Salary Revision Letter.
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
