import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  Edit,
  Calendar,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { z } from "zod"
import {
  useAnnouncementsPaginated,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  type Announcement,
} from "@/hooks/useAnnouncements"
import { useAuthStore } from "@/store/useAuthStore"
import Swal from "sweetalert2"

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["Published", "Draft"]),
})

export default function AnnouncementsPage() {
  const { user } = useAuthStore()
  
  // Pagination state
  const [cursor, setCursor] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)
  
  // Filter state
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCursor(null) // Reset cursor when search changes
      setCursorHistory([])
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])
  
  // Fetch paginated announcements
  const { data: pageData, isLoading } = useAnnouncementsPaginated({
    cursor: cursor || undefined,
    limit,
    status: selectedStatus as any,
    search: debouncedSearch || undefined,
  })
  
  const announcements = pageData?.data || []
  const hasNextPage = pageData?.hasNextPage || false
  const nextCursor = pageData?.nextCursor || null
  
  // Mutations
  const createMutation = useCreateAnnouncement()
  const updateMutation = useUpdateAnnouncement()
  const deleteMutation = useDeleteAnnouncement()
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)
  const [editMode, setEditMode] = useState(false)

  // Form states
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formCategory, setFormCategory] = useState<Announcement["category"]>("info")
  const [formDepartment, setFormDepartment] = useState("All Departments")
  const [formStatus, setFormStatus] = useState<Announcement["status"]>("Published")
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const openCreateModal = () => {
    setEditMode(false)
    setFormTitle("")
    setFormContent("")
    setFormCategory("info")
    setFormDepartment("All Departments")
    setFormStatus("Published")
    setErrors({})
    setIsFormOpen(true)
  }

  const openEditModal = (ann: Announcement) => {
    setEditMode(true)
    setCurrentAnnouncement(ann)
    setFormTitle(ann.title)
    setFormContent(ann.content)
    setFormCategory(ann.category)
    setFormDepartment(ann.department)
    setFormStatus(ann.status)
    setErrors({})
    setIsFormOpen(true)
  }

  const openViewModal = (ann: Announcement) => {
    setCurrentAnnouncement(ann)
    setIsViewOpen(true)
  }

  const handleSave = async () => {
    setErrors({})
    const result = announcementSchema.safeParse({
      title: formTitle,
      content: formContent,
      status: formStatus,
    })

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

    try {
      if (editMode && currentAnnouncement) {
        await updateMutation.mutateAsync({
          id: currentAnnouncement.id,
          data: {
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
            department: formDepartment,
            status: formStatus,
          }
        })
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Announcement has been updated.',
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        await createMutation.mutateAsync({
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
          department: formDepartment,
          status: formStatus,
          authorId: user?.id,
          authorName: user?.fullNameEnglish || 'HR Admin',
        })
        Swal.fire({
          icon: 'success',
          title: 'Created!',
          text: 'New announcement has been published.',
          timer: 1500,
          showConfirmButton: false,
        })
      }
      setIsFormOpen(false)
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Something went wrong',
      })
    }
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    })

    if (result.isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id)
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Announcement has been deleted.',
          timer: 1500,
          showConfirmButton: false,
        })
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error?.response?.data?.message || 'Failed to delete announcement',
        })
      }
    }
  }

  // Pagination handlers
  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory([...cursorHistory, cursor || ''])
      setCursor(nextCursor)
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1]
      setCursorHistory(cursorHistory.slice(0, -1))
      setCursor(prevCursor || null)
      setCurrentPage(prev => prev - 1)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Announcements & Notices</h2>
          <p className="text-muted-foreground">Manage and broadcast company announcements and notices to employees</p>
        </div>
        <Button className="gap-2 text-xs font-semibold" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Create Announcement
        </Button>
      </div>

      {/* Search & Categories */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search announcements by title or content..."
              className="pl-9 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All Statuses" },
              { id: "Published", label: "Published" },
              { id: "Draft", label: "Drafts" },
            ].map(statusItem => (
              <Button
                key={statusItem.id}
                variant={selectedStatus === statusItem.id ? "default" : "outline"}
                size="sm"
                className="text-xs h-9 shrink-0 font-medium"
                onClick={() => setSelectedStatus(statusItem.id)}
              >
                {statusItem.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table of Announcements */}
      <Card className="shadow-none border-border/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10 border-b border-border/30">
                <TableRow className="border-b-0 hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Title</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Posted By</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Published Date</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground border-b-0 hover:bg-transparent text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm font-semibold">Loading announcements...</p>
                    </TableCell>
                  </TableRow>
                ) : announcements.length > 0 ? (
                  announcements.map((ann: any) => {
                    return (
                      <TableRow key={ann.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-3">
                          <div className="space-y-0.5 max-w-[320px] sm:max-w-[400px]">
                            <p className="text-xs font-semibold text-foreground hover:text-primary cursor-pointer truncate" onClick={() => openViewModal(ann)}>
                              {ann.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{ann.content}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                          {ann.author}
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground font-medium">
                          {ann.date}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={cn("text-[9px] font-bold border-none",
                            ann.status === "Published" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-500/10 text-slate-600"
                          )}>
                            {ann.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                              onClick={() => openEditModal(ann)}
                              title="Edit Announcement"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                              onClick={() => handleDelete(ann.id)}
                              title="Delete Announcement"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm font-semibold">No announcements found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {announcements.length > 0 && (
        <Card className="shadow-none border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{announcements.length}</span> results
                {cursorHistory.length > 0 && ` (Page ${currentPage})`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={cursorHistory.length === 0}
                  className="text-xs gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                  className="text-xs gap-1"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Dialog for Create/Edit */}
      <Dialog open={isFormOpen} onOpenChange={(val) => {
        setIsFormOpen(val)
        if (!val) {
          setFormTitle("")
          setFormContent("")
          setFormCategory("info")
          setFormDepartment("All Departments")
          setFormStatus("Published")
          setErrors({})
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editMode ? "Edit Announcement" : "Create Announcement"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Fill in the details below to publish a notice or announcement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-semibold">Title</Label>
              <Input
                id="title"
                placeholder="Enter title here..."
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="text-xs"
              />
              {errors.title && <p className="text-[10px] text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-xs font-semibold">Content</Label>
              <Textarea
                id="content"
                placeholder="Write the announcement description or notice content here..."
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                className="text-xs min-h-[140px] resize-none"
              />
              {errors.content && <p className="text-[10px] text-red-500">{errors.content}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-semibold">Category</Label>
                <Select value={formCategory} onValueChange={(v: any) => setFormCategory(v)}>
                  <SelectTrigger id="category" className="text-xs h-9">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info" className="text-xs">Information</SelectItem>
                    <SelectItem value="warning" className="text-xs">Warning</SelectItem>
                    <SelectItem value="event" className="text-xs">Event</SelectItem>
                    <SelectItem value="policy" className="text-xs">Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">Status</Label>
                <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                  <SelectTrigger id="status" className="text-xs h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published" className="text-xs">Published</SelectItem>
                    <SelectItem value="Draft" className="text-xs">Draft</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-[10px] text-red-500">{errors.status}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs" disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Save Announcement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog for Details */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {currentAnnouncement && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={cn("text-[9px] font-bold border-none uppercase",
                    currentAnnouncement.category === "warning" ? "bg-amber-500/10 text-amber-600" :
                    currentAnnouncement.category === "event" ? "bg-violet-500/10 text-violet-600" :
                    currentAnnouncement.category === "policy" ? "bg-sky-500/10 text-sky-600" :
                    "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {currentAnnouncement.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Published: {currentAnnouncement.date}
                  </span>
                </div>
                <DialogTitle className="text-base font-bold leading-snug">
                  {currentAnnouncement.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 border-t border-border/40 mt-2">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {currentAnnouncement.content}
                </p>
                <div className="bg-muted/30 border border-border/20 rounded-xl p-3 flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <User className="h-4 w-4" />
                    Author: {currentAnnouncement.author}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setIsViewOpen(false)} className="text-xs">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
