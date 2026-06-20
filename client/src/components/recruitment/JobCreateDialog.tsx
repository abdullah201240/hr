import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface JobCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  editingJob: any
  newJob: any
  setNewJob: (val: any) => void
  onSubmit: (e: React.FormEvent) => void
}

export function JobCreateDialog({
  isOpen,
  onClose,
  editingJob,
  newJob,
  setNewJob,
  onSubmit,
}: JobCreateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-xs">
        <DialogHeader>
          <DialogTitle>{editingJob ? "Edit Job Requisition" : "Open Job Requisition"}</DialogTitle>
          <DialogDescription>{editingJob ? "Update the details for this job posting." : "Create a new job posting for the recruitment pipeline."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Job Title *</Label>
            <Input placeholder="e.g. Senior Frontend Engineer" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Department</Label>
              <Select value={newJob.department} onValueChange={v => setNewJob({ ...newJob, department: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Engineering", "Product", "HR", "Sales", "Finance", "Marketing", "Operations"].map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Employment Type</Label>
              <Select value={newJob.type} onValueChange={v => setNewJob({ ...newJob, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Location *</Label>
              <Input placeholder="e.g. Dhaka, BD" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Experience Needed *</Label>
              <Input placeholder="e.g. 3-5 years" value={newJob.experience} onChange={e => setNewJob({ ...newJob, experience: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Job Description</Label>
            <Textarea placeholder="Describe the role, responsibilities, and requirements..." value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} rows={3} className="resize-none" />
          </div>
          {editingJob && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={newJob.status} onValueChange={v => setNewJob({ ...newJob, status: v as "Open" | "Closed" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Applicants Count</Label>
                <Input type="number" min="0" value={newJob.applicants} onChange={e => setNewJob({ ...newJob, applicants: Number(e.target.value) || 0 })} />
              </div>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{editingJob ? "Save Changes" : "Open Requisition"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
