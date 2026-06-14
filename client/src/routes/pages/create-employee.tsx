import { useNavigate } from "react-router"
import AddEmployeeForm from "@/components/employee/add-employee-form"
import Swal from "sweetalert2"

const initialEmployees = [
  { name: "Sarah Mitchell", email: "sarah.m@sadoshima.com", role: "Senior Engineer", dept: "Engineering", status: "Active", initials: "SM" },
  { name: "James Cooper", email: "james.c@sadoshima.com", role: "Product Manager", dept: "Product", status: "Active", initials: "JC" },
  { name: "Emily Zhang", email: "emily.z@sadoshima.com", role: "HR Specialist", dept: "HR", status: "Active", initials: "EZ" },
  { name: "David Kim", email: "david.k@sadoshima.com", role: "Finance Analyst", dept: "Finance", status: "On Leave", initials: "DK" },
  { name: "Lisa Johnson", email: "lisa.j@sadoshima.com", role: "Marketing Lead", dept: "Marketing", status: "Active", initials: "LJ" },
  { name: "Marcus Brown", email: "marcus.b@sadoshima.com", role: "Sales Rep", dept: "Sales", status: "Active", initials: "MB" },
]

export default function CreateEmployeePage() {
  const navigate = useNavigate()

  const handleAddEmployee = (data: any) => {
    const initials = data.fullNameEnglish
      ? data.fullNameEnglish
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "EM"

    const newEmployee = {
      name: data.fullNameEnglish,
      email: data.email,
      role: data.designation,
      dept: data.department,
      status: data.employeeType,
      lineManager: data.lineManager || "",
      initials,
    }

    // Persist in localStorage so it appears in the list view
    const stored = localStorage.getItem("employees_list")
    const currentList = stored ? JSON.parse(stored) : initialEmployees
    const updatedList = [newEmployee, ...currentList]
    localStorage.setItem("employees_list", JSON.stringify(updatedList))

    Swal.fire({
      title: "Success!",
      text: "Employee profile created successfully.",
      icon: "success",
      confirmButtonText: "Done",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled"
      }
    }).then(() => {
      navigate("/employees")
    })
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
