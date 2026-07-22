import { useNavigate, useParams } from "react-router"
import AddEmployeeForm from "@/components/employee/add-employee-form"
import Swal from "sweetalert2"
import { useEmployeeQuery, useUpdateEmployeeMutation } from "@/hooks/useEmployees"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function EditEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: employee, isLoading, isError, error } = useEmployeeQuery(id || "")
  const updateMutation = useUpdateEmployeeMutation(id || "")

  const uploadFile = async (file: any, folder: string): Promise<string | undefined> => {
    if (!file) return undefined
    if (typeof file === "string") return file
    if (file instanceof File) {
      const formData = new FormData()
      formData.append("file", file)
      const res = await apiClient.post<any>(`upload?folder=${folder}`, formData)
      return res.secureUrl
    }
    return undefined
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground mt-2">Loading employee profile...</p>
      </div>
    )
  }

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Employee Not Found</h2>
        <p className="text-muted-foreground mt-2">{error?.message || "The employee record could not be found."}</p>
        <Button className="mt-4" onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    )
  }

  // Pre-fill the details for editing
  const initialData = {
    employeeId: employee.employeeId,
    fullNameEnglish: employee.fullNameEnglish,
    fullNameBangla: employee.fullNameBangla,
    email: employee.email,
    personalEmail: employee.personalEmail,
    phone: employee.phone,
    personalMobileNumber: employee.personalMobileNumber,
    religion: employee.religion,
    gender: employee.gender,
    dateOfBirth: employee.dateOfBirth,
    bloodGroup: employee.bloodGroup,
    maritalStatus: employee.maritalStatus,
    employeePhoto: employee.employeePhotoUrl || null,
    nidNumber: employee.nidNumber,
    nidPdf: employee.nidPdfUrl || null,
    tinNumber: employee.tinNumber,
    fatherNameEnglish: employee.fatherNameEnglish,
    fatherNameBangla: employee.fatherNameBangla,
    motherNameEnglish: employee.motherNameEnglish,
    motherNameBangla: employee.motherNameBangla,
    currentAddress: employee.currentAddress,
    permanentAddress: employee.permanentAddress,
    emergencyContactName: employee.emergencyContactName,
    emergencyContactRelation: employee.emergencyContactRelation,
    emergencyContactNumber: employee.emergencyContactNumber,
    designation: employee.designationId,
    department: employee.departmentId,
    employeeType: employee.employeeType,
    joinDate: employee.joinDate,
    isSalary: employee.isSalary ?? true,
    lineManager: employee.lineManagerId || "none",
    spouses: (employee.spouses || []).map((s) => ({
      name: s.name,
      nid: s.nid,
      phone: s.phone,
      occupation: s.occupation,
      marriageDate: s.marriageDate || "",
    })),
    children: (employee.children || []).map((c) => ({
      name: c.name,
      dateOfBirth: c.dateOfBirth || "",
      gender: c.gender,
    })),
    nominees: (employee.nominees || []).map((n) => ({
      name: n.name,
      relation: n.relation,
      nidNumber: n.nidNumber,
      nidPdf: n.nidPdfUrl || null,
      photo: n.photoUrl || null,
    })),
    bankName: employee.bankDetails?.bankName || "",
    bankBranch: employee.bankDetails?.branch || "",
    accountNumber: employee.bankDetails?.accountNumber || "",
    accountType: employee.bankDetails?.accountType || "",
    routingNumber: employee.bankDetails?.routingNumber || "",
    swiftCode: employee.bankDetails?.swiftCode || "",
    ibanNumber: employee.bankDetails?.ibanNumber || "",
    bankStatementPdf: employee.bankDetails?.bankStatementPdfUrl || null,
    documents: (employee.documents || []).map((d) => ({
      title: d.title,
      description: d.description,
      file: d.fileUrl || null,
    })),
  }

  const handleEditEmployee = async (data: any) => {
    const loaderToastId = toast.loading("Saving changes and uploading new files...")

    try {
      // 1. Upload new files if any changed
      const employeePhotoUrl = await uploadFile(data.employeePhoto, "employees/photos")
      const nidPdfUrl = await uploadFile(data.nidPdf, "employees/nids")

      // Nominees files
      const nominees = await Promise.all(
        (data.nominees || []).map(async (n: any) => ({
          name: n.name,
          relation: n.relation,
          nidNumber: n.nidNumber,
          nidPdfUrl: (await uploadFile(n.nidPdf, "employees/nominees")) ?? null,
          photoUrl: (await uploadFile(n.photo, "employees/nominees")) ?? null,
        }))
      )

      // Documents
      const documents = await Promise.all(
        (data.documents || []).map(async (d: any) => ({
          title: d.title,
          description: d.description,
          fileUrl: (await uploadFile(d.file, "employees/documents")) || "",
        }))
      )

      // Bank statement
      const bankStatementPdfUrl = await uploadFile(data.bankStatementPdf, "employees/banks")

      // 2. Build update payload
      const payload = {
        employeeId: data.employeeId,
        email: data.email,
        personalEmail: data.personalEmail || undefined,
        fullNameEnglish: data.fullNameEnglish,
        fullNameBangla: data.fullNameBangla || undefined,
        phone: data.phone,
        personalMobileNumber: data.personalMobileNumber || undefined,
        religion: data.religion,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        bloodGroup: data.bloodGroup || undefined,
        maritalStatus: data.maritalStatus || undefined,
        employeePhotoUrl,
        nidNumber: data.nidNumber,
        nidPdfUrl,
        tinNumber: data.tinNumber || undefined,
        fatherNameEnglish: data.fatherNameEnglish || undefined,
        fatherNameBangla: data.fatherNameBangla || undefined,
        motherNameEnglish: data.motherNameEnglish || undefined,
        motherNameBangla: data.motherNameBangla || undefined,
        currentAddress: data.currentAddress || undefined,
        permanentAddress: data.permanentAddress || undefined,
        emergencyContactName: data.emergencyContactName || undefined,
        emergencyContactRelation: data.emergencyContactRelation || undefined,
        emergencyContactNumber: data.emergencyContactNumber || undefined,
        designationId: data.designation,
        departmentId: data.department,
        employeeType: data.employeeType,
        joinDate: data.joinDate,
        isSalary: data.isSalary,
        lineManagerId: data.lineManager === "none" || !data.lineManager ? undefined : data.lineManager,
        spouses: (data.spouses || []).map((s: any) => ({
          name: s.name,
          nid: s.nid,
          phone: s.phone,
          occupation: s.occupation,
          marriageDate: s.marriageDate || null,
        })),
        children: (data.children || []).map((c: any) => ({
          name: c.name,
          dateOfBirth: c.dateOfBirth || null,
          gender: c.gender,
        })),
        nominees,
        bankDetails: data.bankName ? {
          bankName: data.bankName,
          branch: data.bankBranch,
          accountNumber: data.accountNumber,
          accountType: data.accountType,
          routingNumber: data.routingNumber,
          swiftCode: data.swiftCode,
          ibanNumber: data.ibanNumber,
          bankStatementPdfUrl: bankStatementPdfUrl ?? null,
        } : null,
        documents,
      }

      // If password field is set, include it in update payload
      if (data.password) {
        Object.assign(payload, { password: data.password })
      }

      // 3. Trigger queued update mutation
      await updateMutation.mutateAsync(payload)
      toast.dismiss(loaderToastId)

      Swal.fire({
        title: "Success!",
        text: "Employee profile updated successfully.",
        icon: "success",
        confirmButtonText: "Done",
        buttonsStyling: false,
        customClass: {
          confirmButton: "swal2-confirm swal2-styled bg-primary text-white font-semibold rounded-md px-4 py-2"
        }
      }).then(() => {
        navigate("/employees")
      })

    } catch (error: any) {
      toast.dismiss(loaderToastId)
      toast.error(error.message || "Failed to update employee details")
    }
  }

  return (
    <div className="w-full">
      <AddEmployeeForm
        isEdit={true}
        initialData={initialData}
        onCancel={() => navigate("/employees")}
        onSubmit={handleEditEmployee}
      />
    </div>
  )
}
