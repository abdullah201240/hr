import { useState } from "react"
import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionCard, SectionTitle, Field, StepHeader } from "@/components/employee/form-ui"
import { Building2, ArrowLeft, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { z } from "zod"
import { useCreateDepartmentMutation } from "@/hooks/useDepartments"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"

const departmentSchema = z.object({
  name: z.string().trim().min(1, "Department Name is required"),
  code: z.string().trim().min(2, "Code must be at least 2 characters").max(50, "Code cannot exceed 50 characters"),
  description: z.string().trim().optional(),
  headEmployeeId: z.string().trim().uuid("Invalid Head Employee ID").or(z.literal("")).optional(),
})

export default function CreateDepartmentPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [headEmployeeId, setHeadEmployeeId] = useState("")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Fetch employees list to populate Head of Department dropdown options
  const { data: employeesData } = useQuery<any>({
    queryKey: ["employees", "options-list"],
    queryFn: () => apiClient.get<any>("employees?limit=100"),
  })
  const employeesList = employeesData?.data || []

  const createMutation = useCreateDepartmentMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Zod validation
    const result = departmentSchema.safeParse({ name, code, description, headEmployeeId })
    
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {}
      result.error.issues.forEach((err: any) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    const data = result.data

    createMutation.mutate(
      {
        name: data.name,
        code: data.code,
        description: data.description || "",
        headEmployeeId: data.headEmployeeId || null,
      },
      {
        onSuccess: () => {
          Swal.fire({
            title: "Created!",
            text: "Department has been created successfully.",
            icon: "success",
            confirmButtonText: "Done",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2"
            }
          }).then(() => {
            navigate("/departments")
          })
        },
        onError: (err: any) => {
          Swal.fire({
            title: "Error",
            text: err.message || "Failed to create department",
            icon: "error",
            confirmButtonText: "Ok",
            buttonsStyling: false,
            customClass: {
              confirmButton: "swal2-confirm swal2-styled bg-primary hover:bg-primary/90 text-white font-semibold rounded-md px-4 py-2"
            }
          })
        }
      }
    )
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <StepHeader 
          title="Create Department" 
          description="Add a new business unit or department to the organization directory."
          icon={Building2}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard>
          <SectionTitle icon={Building2}>Department Details</SectionTitle>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Department Name" required error={errors.name}>
              <Input 
                value={name} 
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors(prev => ({ ...prev, name: "" }))
                }}
                placeholder="e.g. Quality Assurance" 
              />
            </Field>

            <Field label="Department Code" required error={errors.code}>
              <Input 
                value={code} 
                onChange={(e) => {
                  setCode(e.target.value)
                  if (errors.code) setErrors(prev => ({ ...prev, code: "" }))
                }}
                placeholder="e.g. QA" 
              />
            </Field>

            <Field label="Head of Department" error={errors.headEmployeeId}>
              <select
                value={headEmployeeId}
                onChange={(e) => {
                  setHeadEmployeeId(e.target.value)
                  if (errors.headEmployeeId) setErrors(prev => ({ ...prev, headEmployeeId: "" }))
                }}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Head of Department (Optional)</option>
                {employeesList.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullNameEnglish} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description">
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief details about the department operations..."
              />
            </Field>
          </div>
        </SectionCard>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/departments")} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Department
          </Button>
        </div>
      </form>
    </div>
  )
}
