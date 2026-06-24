import { useNavigate } from "react-router"
import AddEmployeeForm from "@/components/employee/add-employee-form"
import Swal from "sweetalert2"
import { useCreateEmployeeMutation } from "@/hooks/useEmployees"
import { apiClient } from "@/lib/api"
import { toast } from "sonner"

export default function CreateEmployeePage() {
  const navigate = useNavigate()
  const createMutation = useCreateEmployeeMutation()

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

  const handleAddEmployee = async (data: any) => {
    const loaderToastId = toast.loading("Processing files and registering employee...")

    try {
      // 1. Upload files
      const employeePhotoUrl = await uploadFile(data.employeePhoto, "employees/photos")
      const nidPdfUrl = await uploadFile(data.nidPdf, "employees/nids")

      // Nominees
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

      // Bank details statement
      const bankStatementPdfUrl = await uploadFile(data.bankStatementPdf, "employees/banks")

      // 2. Build backend payload
      const payload = {
        employeeId: data.employeeId,
        email: data.email,
        personalEmail: data.personalEmail || undefined,
        password: data.password || undefined,
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

      // 3. Trigger queued create mutation
      await createMutation.mutateAsync(payload)
      toast.dismiss(loaderToastId)

      Swal.fire({
        title: "Success!",
        text: "Employee profile created and registered successfully.",
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
      toast.error(error.message || "Failed to register employee")
    }
  }

  return (
    <div className="w-full">
      <AddEmployeeForm
        onCancel={() => navigate("/employees")}
        onSubmit={handleAddEmployee}
      />
    </div>
  )
}
