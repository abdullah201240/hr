import { useNavigate, useParams } from "react-router"
import AddEmployeeForm from "@/components/employee/add-employee-form"
import { Button } from "@/components/ui/button"
import { DEFAULT_VALUES } from "@/components/employee/form-schema"

const initialEmployees = [
  { name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", role: "Senior Engineer", dept: "Engineering", status: "Active", initials: "SM" },
  { name: "James Cooper", email: "james.c@sadoshima.com", role: "Product Manager", dept: "Product", status: "Active", initials: "JC" },
  { name: "Emily Zhang", email: "emily.z@sadoshima.com", role: "HR Specialist", dept: "HR", status: "Active", initials: "EZ" },
  { name: "David Kim", email: "david.k@sadoshima.com", role: "Finance Analyst", dept: "Finance", status: "On Leave", initials: "DK" },
  { name: "Lisa Johnson", email: "lisa.j@sadoshima.com", role: "Marketing Lead", dept: "Marketing", status: "Active", initials: "LJ" },
  { name: "Marcus Brown", email: "marcus.b@sadoshima.com", role: "Sales Rep", dept: "Sales", status: "Active", initials: "MB" },
]

export default function ViewEmployeePage() {
  const { email } = useParams()
  const navigate = useNavigate()

  const stored = localStorage.getItem("employees_list")
  const currentList = stored ? JSON.parse(stored) : initialEmployees

  const employeeIndex = currentList.findIndex((emp: any) => emp.email === email)
  const employee = currentList[employeeIndex]

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Employee Not Found</h2>
        <p className="text-muted-foreground mt-2">The employee record could not be found.</p>
        <Button className="mt-4" onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    )
  }

  // Pre-fill the details for viewing
  const initialData = employee.formData || {
    ...DEFAULT_VALUES,
    employeeId: employee.employeeId || `EMP-${1000 + employeeIndex}`,
    fullNameEnglish: employee.name,
    email: employee.email,
    designation: employee.role,
    department: employee.dept,
    employeeType: employee.status === "Active" ? "Permanent" : "Probation",
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
