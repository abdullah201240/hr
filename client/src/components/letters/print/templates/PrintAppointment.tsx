import type { LetterPrintProps } from "../types"

export function PrintAppointment({ letter, fields, formatDate }: LetterPrintProps) {
  const employeeLastName = letter.employeeName ? letter.employeeName.trim().split(" ").pop() : "[Last Name]"
  const presentAddress = fields.presentAddress || "—"
  const designation = fields.designation || letter.employeeDesignation || "—"
  const department = fields.department || letter.employeeDepartment || "—"
  const startDate = fields.startDate || (letter.effectiveDate ? formatDate(letter.effectiveDate) : "—")
  const offerLetterDate = fields.offerLetterDate || "—"
  const reportingManager = fields.reportingManager || "—"
  const officeLocation = fields.officeLocation || "—"
  const salary = fields.salary || "—"

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
            APPOINTMENT LETTER
          </h2>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-1 mb-6">
          <p className="font-semibold">To</p>
          <p className="font-bold text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
          <p className="font-semibold">Employee ID: <span className="font-normal">{letter.employeeIdCode || "—"}</span></p>
          <p className="font-semibold">Present Address: <span className="font-normal">{presentAddress}</span></p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-6 leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">
            Subject: Appointment as {designation}
          </p>
          <p className="font-semibold">Dear Mr./Ms. {employeeLastName},</p>
          <p className="leading-relaxed">
            We are pleased to appoint you as <span className="font-semibold">{designation}</span> in the <span className="font-semibold">{department}</span> of Sadoshima Corporation – Bangladesh Liaison Office effective from <span className="font-semibold">{startDate}</span>. Your appointment is made based on your acceptance of our Offer Letter dated <span className="font-semibold">{offerLetterDate}</span> and is governed by the following terms and conditions.
          </p>
        </div>

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
            <p className="leading-relaxed mt-1 font-sans">
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
            <p className="font-semibold font-sans">Signature of Employee</p>
            <div className="space-y-1 mt-2 text-muted-foreground print:text-slate-600">
              <p>Name: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.employeeName}</span></p>
              <p>Date: <span className="text-slate-900 dark:text-slate-100 print:text-black font-semibold">{letter.issueDate ? formatDate(letter.issueDate) : "—"}</span></p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
