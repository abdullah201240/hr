import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, FolderKanban } from "lucide-react"

const projects = [
  {
    name: "Employee Portal Redesign",
    desc: "Modernize the internal employee self-service portal",
    lead: "Sarah Mitchell",
    initials: "SM",
    progress: 72,
    status: "On Track",
    due: "Jul 30",
    team: 6,
  },
  {
    name: "Annual Performance Framework",
    desc: "Implement new 360-degree review system",
    lead: "Emily Zhang",
    initials: "EZ",
    progress: 45,
    status: "On Track",
    due: "Aug 15",
    team: 4,
  },
  {
    name: "Benefits Platform Migration",
    desc: "Migrate to new benefits management platform",
    lead: "David Kim",
    initials: "DK",
    progress: 20,
    status: "At Risk",
    due: "Sep 1",
    team: 8,
  },
  {
    name: "DEI Initiative Q3",
    desc: "Diversity, equity, and inclusion program rollout",
    lead: "Lisa Johnson",
    initials: "LJ",
    progress: 90,
    status: "On Track",
    due: "Jun 30",
    team: 5,
  },
]

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage HR initiatives and cross-team projects</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.name} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <Badge
                  variant={project.status === "On Track" ? "default" : "destructive"}
                  className={project.status === "On Track" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" : ""}
                >
                  {project.status}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-base">{project.name}</CardTitle>
              <CardDescription>{project.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                      {project.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{project.lead}</span>
                </div>
                <span className="text-xs text-muted-foreground">Due {project.due}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
