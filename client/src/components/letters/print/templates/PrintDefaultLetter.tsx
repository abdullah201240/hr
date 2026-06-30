import type { LetterPrintProps } from "../types"

export function PrintDefaultLetter({ letter, fields, formatDate, typeName }: LetterPrintProps & { typeName: string }) {
  return (
    <div className="print-document max-w-3xl mx-auto bg-white dark:bg-slate-950 p-12 sm:p-16 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl print:border-0 print:shadow-none print:p-0">
      {/* Company Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight uppercase text-slate-900 dark:text-slate-50">
            Sadoshima
          </h1>
          <p className="text-xs text-muted-foreground mt-1 print:text-slate-600 font-sans">
            123 Innovation Boulevard, Suite 500<br />
            Dhaka, Bangladesh • contact@sadoshima.com
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground print:text-slate-600 font-sans">
          <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black uppercase">{typeName}</p>
          <p className="mt-1">Date: {formatDate(letter.issueDate)}</p>
          <p className="mt-0.5">Ref: {letter.id}</p>
        </div>
      </div>

      {/* Letter Body */}
      <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200 leading-relaxed print:text-black">
        {/* Recipient */}
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-50">{letter.employeeName}</p>
          <p className="text-muted-foreground print:text-slate-600 font-sans">{letter.employeeDepartment} Department</p>
        </div>

        {/* Subject */}
        <div className="pt-2">
          <p className="font-bold text-base text-slate-900 dark:text-slate-50">
            Subject: {letter.subject}
          </p>
        </div>

        {/* Salutation */}
        <p>Dear {letter.employeeName},</p>

        {/* Body Paragraphs */}
        {letter.body.split("\n").filter(Boolean).map((paragraph: string, idx: number) => (
          <p key={idx}>{paragraph}</p>
        ))}

        {/* Fields Table */}
        {Object.keys(letter.fields || {}).length > 0 && (
          <div className="pt-2">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {Object.entries(letter.fields).map(([key, value]) => (
                  <tr key={key}>
                    <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-muted-foreground print:text-slate-600 capitalize w-[40%] font-sans">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-50 print:text-black">
                      {value as string || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Effective Date */}
        {letter.effectiveDate && (
          <p className="text-xs text-muted-foreground print:text-slate-600 font-sans">
            Effective Date: <strong className="text-slate-900 dark:text-slate-50 print:text-black">{formatDate(letter.effectiveDate)}</strong>
          </p>
        )}

        {/* Signature Section */}
        <div className="pt-12 grid grid-cols-2 gap-8 font-sans">
          <div>
            <p className="text-muted-foreground print:text-slate-600">Sincerely,</p>
            <div className="h-16 flex items-end">
              <span className="font-serif italic text-slate-400 dark:text-slate-700 print:text-slate-500">{fields.signatoryName || letter.createdBy}</span>
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48">
              <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{fields.signatoryName || letter.createdBy}</p>
              <p className="text-[10px] text-muted-foreground print:text-slate-600">{fields.signatoryDesignation || "Human Resources Department"}</p>
              <p className="text-[10px] text-muted-foreground print:text-slate-600">Sadoshima HR Management</p>
            </div>
          </div>

          <div className="flex flex-col justify-end items-end text-right">
            <p className="text-muted-foreground print:text-slate-600">Acknowledged By:</p>
            <div className="h-16"></div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-2 w-48 text-left">
              <p className="font-bold text-xs text-slate-900 dark:text-slate-50 print:text-black">{letter.employeeName}</p>
              <p className="text-[10px] text-muted-foreground print:text-slate-600">Employee Signature & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
