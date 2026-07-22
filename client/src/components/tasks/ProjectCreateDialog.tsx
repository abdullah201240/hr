import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDepartmentOptionsQuery } from "@/hooks/useDepartments"
import { useEmployeeOptionsQuery } from "@/hooks/useEmployees"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ProjectCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    departmentId?: string
    ownerId?: string
    status?: "Active" | "Completed" | "Archived"
  }) => void
  isPending: boolean
  editingProject?: any
}

export function ProjectCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  editingProject,
}: ProjectCreateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [departmentId, setDepartmentId] = useState<string>("all")
  const [ownerId, setOwnerId] = useState<string>("all")
  const [status, setStatus] = useState<"Active" | "Completed" | "Archived">("Active")

  const { data: depts = [] } = useDepartmentOptionsQuery()
  const { data: emps = [] } = useEmployeeOptionsQuery()

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name || "")
      setDescription(editingProject.description || "")
      setDepartmentId(editingProject.departmentId || "all")
      setOwnerId(editingProject.ownerId || "all")
      setStatus(editingProject.status || "Active")
    } else {
      setName("")
      setDescription("")
      setDepartmentId("all")
      setOwnerId("all")
      setStatus("Active")
    }
  }, [editingProject, isOpen])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Project name is required")
      return
    }

    onSubmit({
      name,
      description,
      departmentId: departmentId === "all" ? undefined : departmentId,
      ownerId: ownerId === "all" ? undefined : ownerId,
      status,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border-border/50 shadow-lg">
        <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingProject ? "Edit Project Details" : "Create New Project"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Projects help organize your tasks, team members, and milestones.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 text-xs">
            <div className="grid gap-1.5">
              <Label htmlFor="proj-name" className="text-xs font-semibold">
                Project Name *
              </Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Financial Audit Preparation"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="proj-desc" className="text-xs font-semibold">
                Description
              </Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe scope, major milestones, or reference links..."
                className="min-h-[80px] text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Department Owner</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="General / All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All / General
                    </SelectItem>
                    {depts.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Project Lead</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Unassigned
                    </SelectItem>
                    {emps.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">
                        {e.fullNameEnglish}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingProject && (
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Project Status</Label>
                <Select
                  value={status}
                  onValueChange={(val: any) => setStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active" className="text-xs">Active</SelectItem>
                    <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                    <SelectItem value="Archived" className="text-xs">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/20">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : editingProject ? (
                "Save Changes"
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
