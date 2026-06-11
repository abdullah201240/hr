import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload, Search, FolderOpen, File, Image } from "lucide-react"

const documents = [
  { name: "Employee Handbook 2026", type: "PDF", size: "2.4 MB", updated: "Jun 1, 2026", icon: FileText },
  { name: "Onboarding Checklist", type: "DOCX", size: "156 KB", updated: "May 28, 2026", icon: File },
  { name: "Benefits Overview", type: "PDF", size: "1.8 MB", updated: "May 15, 2026", icon: FileText },
  { name: "Remote Work Policy", type: "PDF", size: "320 KB", updated: "Jun 5, 2026", icon: FileText },
  { name: "Company Logo Pack", type: "ZIP", size: "12.5 MB", updated: "Apr 20, 2026", icon: Image },
  { name: "Performance Review Template", type: "DOCX", size: "98 KB", updated: "May 10, 2026", icon: File },
]

const folders = [
  { name: "Policies & Procedures", count: 14 },
  { name: "Contracts & Agreements", count: 42 },
  { name: "Training Materials", count: 23 },
  { name: "Reports & Analytics", count: 18 },
]

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">Manage company documents and policies</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {folders.map((folder) => (
          <Card key={folder.name} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{folder.name}</p>
                <p className="text-xs text-muted-foreground">{folder.count} files</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search documents..." className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc, i) => {
              const Icon = doc.icon
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type} · {doc.size}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{doc.updated}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
