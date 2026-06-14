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
} from "lucide-react"
import { z } from "zod"

export interface Announcement {
  id: string
  title: string
  content: string
  category: "info" | "warning" | "event" | "policy"
  department: string
  date: string
  author: string
  status: "Published" | "Draft"
}

const defaultAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Annual Company Picnic scheduled for June 29",
    content: "We are excited to announce that our Annual Company Picnic will be held on Monday, June 29th at Golden Gate Park. The picnic will feature food trucks, team-building activities, and live music. Families are welcome! Please RSVP by June 20th.",
    category: "event",
    department: "All Departments",
    date: "2026-06-10",
    author: "Alex Johnson",
    status: "Published",
  },
  {
    id: "ann-2",
    title: "Updated Remote Work & Hybrid Schedule Policy",
    content: "Starting next month, all employees are requested to sync their core working days (Tuesday & Thursday) in the office. Remote work request configurations can be managed in the settings area. Please read the document in the Policies folder for further details.",
    category: "policy",
    department: "All Departments",
    date: "2026-06-08",
    author: "Alex Johnson",
    status: "Published",
  },
  {
    id: "ann-3",
    title: "Scheduled Server Maintenance: Saturday Night",
    content: "The internal IT systems and HR portal will be offline for scheduled database maintenance this Saturday, June 20th, from 10:00 PM to 2:00 AM. Please ensure you save all pending tasks and reports before then.",
    category: "warning",
    department: "All Departments",
    date: "2026-06-12",
    author: "IT Infrastructure Team",
    status: "Published",
  },
]

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  status: z.enum(["Published", "Draft"]),
})

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("hr_announcements")
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return defaultAnnouncements
  })

  useEffect(() => {
    localStorage.setItem("hr_announcements", JSON.stringify(announcements))
  }, [announcements])

  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  
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

  const handleSave = () => {
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

    if (editMode && currentAnnouncement) {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === currentAnnouncement.id
            ? {
                ...a,
                title: formTitle.trim(),
                content: formContent.trim(),
                category: formCategory,
                department: formDepartment,
                status: formStatus,
              }
            : a
        )
      )
    } else {
      const newAnn: Announcement = {
        id: "ann-" + Math.random().toString(36).substring(2, 9),
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
        department: formDepartment,
        date: new Date().toISOString().split("T")[0],
        author: "Alex Johnson",
        status: formStatus,
      }
      setAnnouncements(prev => [newAnn, ...prev])
    }

    setIsFormOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    }
  }

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch =
      ann.title.toLowerCase().includes(search.toLowerCase()) ||
      ann.content.toLowerCase().includes(search.toLowerCase()) ||
      ann.author.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = selectedStatus === "all" || ann.status === selectedStatus
    return matchesSearch && matchesStatus
  })


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
                {filteredAnnouncements.length > 0 ? (
                  filteredAnnouncements.map(ann => {
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
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="text-xs">
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
                <div className="flex items-center justify-end">
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
