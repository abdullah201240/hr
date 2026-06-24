import { useNavigate, useParams } from "react-router"
import AddEmployeeForm from "@/components/employee/add-employee-form"
import { Button } from "@/components/ui/button"
import { useEmployeeQuery } from "@/hooks/useEmployees"

export default function ViewEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: employee, isLoading, isError, error } = useEmployeeQuery(id || "")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground mt-2">Loading employee details...</p>
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

  // Pre-fill the details for viewing
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

  return (
    <div className="w-full">
      <AddEmployeeForm
        isView={true}
        initialData={initialData}
        onCancel={() => navigate("/employees")}
        onSubmit={() => {}}
      />
    </div>
  )
}
