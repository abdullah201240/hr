import type { LetterPrintProps } from "../types"

export function PrintDomesticInquiry({ letter, fields, formatDate }: LetterPrintProps) {
  const incidentDate = fields.incidentDate || "—"
  const incidentLocation = fields.incidentLocation || "—"
  const summaryOfAllegation = fields.summaryOfAllegation || "—"
  const inquiryDate = fields.inquiryDate ? formatDate(fields.inquiryDate) : "—"
  const inquiryTime = fields.inquiryTime || "—"
  const inquiryVenue = fields.inquiryVenue || "—"
  const inquiryOfficer = fields.inquiryOfficer || "—"
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
            DOMESTIC INQUIRY NOTICE
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
          <p className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Subject: Notice to Attend Domestic Inquiry</p>
          <p>Dear Mr./Ms. {employeeLastName},</p>
          <p className="whitespace-pre-line">{letter.body}</p>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-6">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Details of Allegation</h3>
          <div className="space-y-1 pl-1">
            <p className="font-semibold font-sans">Incident Date: <span className="font-normal">{incidentDate}</span></p>
            <p className="font-semibold font-sans">Location: <span className="font-normal">{incidentLocation}</span></p>
            <p className="font-semibold font-sans mt-2">Summary of Allegation:</p>
            <p className="leading-relaxed whitespace-pre-wrap pl-2 border-l border-slate-200 dark:border-slate-800 print:border-black italic">
              {summaryOfAllegation}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-2 mb-8">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Inquiry Schedule</h3>
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
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Inquiry Date</td>
                  <td className="p-2">{inquiryDate}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Inquiry Time</td>
                  <td className="p-2">{inquiryTime}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Venue</td>
                  <td className="p-2">{inquiryVenue}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold bg-slate-50/50 dark:bg-slate-900/30 print:bg-slate-50">Inquiry Officer / Committee</td>
                  <td className="p-2">{inquiryOfficer}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 leading-relaxed mb-6">
          <div>
            <h4 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Employee Rights</h4>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>You will be given a full and fair opportunity to present your explanation.</li>
              <li>You may produce documents or other evidence relevant to your defense.</li>
              <li>You may identify witnesses whose testimony is relevant to the inquiry, subject to the Inquiry Committee's discretion.</li>
              <li>The inquiry will be conducted impartially in accordance with the Company's HR Policy and applicable laws.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Page 2 */}
      <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0 print:pt-4 print:page-break-before">
        <div className="text-xs text-slate-800 dark:text-slate-200 print:text-black space-y-4 mb-12">
          <h3 className="font-bold text-blue-600 dark:text-blue-400 print:text-blue-600">Attendance</h3>
          <p className="leading-relaxed">
            You are required to attend the inquiry at the scheduled date and time. If you fail to attend without a valid reason, the Inquiry Committee may proceed based on the available evidence.
          </p>
        </div>

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
            I acknowledge receipt of this Domestic Inquiry Notice.
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
