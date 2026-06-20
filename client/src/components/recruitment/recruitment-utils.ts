import Swal from "sweetalert2"

export const escHtml = (str: string | undefined | null): string => {
  if (!str) return ""
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

export const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function promptOfferLetter(cand: any, onConfirm: (salary: string, startDate: string) => void) {
  Swal.fire({
    title: "Generate Offer Letter",
    html: `
      <div class="text-left space-y-3">
        <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mb-1">Annual Salary Offered *</label>
        <input id="swal-salary" class="swal2-input !mt-0 !w-full" placeholder="e.g. BDT 1,20,000 / month" value="${escHtml(cand.offeredSalary) || "BDT 1,20,000 / month"}">
        <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mt-3 mb-1">Proposed Start Date *</label>
        <input id="swal-start-date" type="date" class="swal2-input !mt-0 !w-full" value="${cand.offeredStartDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Generate & Send",
    preConfirm: () => {
      const salary = (document.getElementById("swal-salary") as HTMLInputElement).value
      const startDate = (document.getElementById("swal-start-date") as HTMLInputElement).value
      if (!salary || !startDate) { Swal.showValidationMessage("Please enter all details"); return false }
      return { salary, startDate }
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      onConfirm(result.value.salary, result.value.startDate)
    }
  })
}

export function promptJoiningLetter(cand: any, onConfirm: (manager: string) => void) {
  Swal.fire({
    title: "Generate Joining Letter",
    html: `
      <div class="text-left space-y-3">
        <label class="text-xs font-semibold block text-gray-700 dark:text-gray-300 mb-1">Reporting Manager *</label>
        <input id="swal-manager" class="swal2-input !mt-0 !w-full" placeholder="e.g. Michael Torres" value="${escHtml(cand.joiningManager) || ""}">
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Generate & Issue",
    preConfirm: () => {
      const manager = (document.getElementById("swal-manager") as HTMLInputElement).value
      if (!manager) { Swal.showValidationMessage("Please enter manager name"); return false }
      return { manager }
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      onConfirm(result.value.manager)
    }
  })
}

export function confirmAction(title: string, text: string, confirmButtonText: string, onConfirm: () => void) {
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText
  }).then(r => {
    if (r.isConfirmed) {
      onConfirm()
    }
  })
}

export function alertError(text: string) {
  Swal.fire("Error", text, "error")
}

export function alertSuccess(title: string, text?: string) {
  Swal.fire(title, text || "", "success")
}
