import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MoreHorizontal,
  Plus,
  Minus,
  Maximize2,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  RotateCcw,
  Crown,
  Shield,
  Star,
  Zap,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useOrgChartQuery,
  useCreateOrgNodeMutation,
  useUpdateOrgNodeMutation,
  useDeleteOrgNodeMutation,
  useResetOrgChartMutation,
} from "@/hooks/useOrgChart"

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string
  personName: string
  title: string
  department: string
  grade: string
  headcount: number
  openRoles: number
  avatarColor: string
  children: OrgNode[]
}

// ── Department Colors ──────────────────────────────────────────────────────────

const DEPT_COLORS: Record<string, string> = {
  Executive: "bg-gradient-to-br from-violet-500 to-purple-600",
  Engineering: "bg-gradient-to-br from-blue-500 to-indigo-600",
  Product: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
  Marketing: "bg-gradient-to-br from-pink-500 to-rose-600",
  Sales: "bg-gradient-to-br from-emerald-500 to-teal-600",
  HR: "bg-gradient-to-br from-amber-500 to-orange-600",
  Finance: "bg-gradient-to-br from-cyan-500 to-sky-600",
  Operations: "bg-gradient-to-br from-slate-500 to-zinc-600",
  Legal: "bg-gradient-to-br from-red-500 to-rose-700",
  "Board of Directors": "bg-gradient-to-br from-yellow-500 to-amber-600",
}

const DEPT_BORDER: Record<string, string> = {
  Executive: "border-violet-500/30",
  Engineering: "border-blue-500/30",
  Product: "border-purple-500/30",
  Marketing: "border-pink-500/30",
  Sales: "border-emerald-500/30",
  HR: "border-amber-500/30",
  Finance: "border-cyan-500/30",
  Operations: "border-slate-500/30",
  Legal: "border-red-500/30",
  "Board of Directors": "border-yellow-500/30",
}

// ── Grade Helpers ──────────────────────────────────────────────────────────────

function gradeInfo(grade: string): { label: string; color: string; icon: React.ReactNode } {
  const g = grade.toUpperCase()
  if (g === "C-SUITE" || g === "CEO" || g === "CTO" || g === "CFO" || g === "COO" || g === "CHRO" || g === "CMO")
    return { label: grade, color: "bg-violet-500/15 text-violet-700 dark:text-violet-400", icon: <Crown className="h-2.5 w-2.5" /> }
  if (g.startsWith("VP") || g === "VICE PRESIDENT")
    return { label: "VP", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: <Shield className="h-2.5 w-2.5" /> }
  if (g.startsWith("DIR") || g === "DIRECTOR")
    return { label: "Dir", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: <Star className="h-2.5 w-2.5" /> }
  if (g.startsWith("MGR") || g === "MANAGER")
    return { label: "Mgr", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400", icon: <Zap className="h-2.5 w-2.5" /> }
  if (g.startsWith("L4")) return { label: "L4", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400", icon: null }
  if (g.startsWith("L3")) return { label: "L3", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400", icon: null }
  if (g.startsWith("L2")) return { label: "L2", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", icon: null }
  return { label: g || "L1", color: "bg-muted text-muted-foreground", icon: null }
}

// ── Tree Node Card (Compact) ─────────────────────────────────────────────────

function OrgCard({
  node,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: OrgNode
  onAdd?: (parentId: string, parentName: string) => void
  onEdit?: (node: OrgNode) => void
  onDelete?: (node: OrgNode) => void
}) {
  const initials = node.personName === "—"
    ? "—"
    : node.personName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const gi = gradeInfo(node.grade)
  const borderColor = DEPT_BORDER[node.department] || "border-border/50"

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 w-[150px] sm:w-[160px] rounded-xl border bg-card/90 shadow-xs hover:shadow-sm transition-all overflow-hidden",
        borderColor,
      )}
    >
      {/* Left color strip */}
      <div className={cn("w-1 self-stretch shrink-0", node.avatarColor)} />

      <div className="flex items-center gap-2 py-2 pr-1.5 flex-1 min-w-0">
        {/* Avatar */}
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0", node.avatarColor)}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-foreground truncate leading-tight">
            {node.personName === "—" ? node.title : node.personName}
          </p>
          {node.personName !== "—" && (
            <p className="text-[8px] text-muted-foreground truncate leading-tight">{node.title}</p>
          )}
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn("text-[7px] font-bold px-1 py-px rounded", gi.color)}>
              {gi.label}
            </span>
            <span className="text-[7px] text-muted-foreground flex items-center gap-px">
              <Users className="h-2 w-2" />{node.headcount}
            </span>
            {node.openRoles > 0 && (
              <span className="text-[7px] font-bold text-emerald-600">+{node.openRoles}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions menu */}
      {(onAdd || onEdit || onDelete) && (
        <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-4 w-4 rounded bg-background/80 border border-border/40 flex items-center justify-center hover:bg-muted transition-colors">
                <MoreHorizontal className="h-2 w-2" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {onAdd && (
                <DropdownMenuItem onClick={() => onAdd(node.id, node.personName)}>
                  <Plus className="mr-2 h-3 w-3" /> Add Report
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="mr-2 h-3 w-3" /> Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                  <Trash2 className="mr-2 h-3 w-3" /> Remove
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ── Recursive Tree Layout ──────────────────────────────────────────────────────

function TreeBranch({
  node,
  onAdd,
  onEdit,
  onDelete,
  collapsed,
  toggleCollapse,
}: {
  node: OrgNode
  onAdd?: (parentId: string, parentName: string) => void
  onEdit?: (node: OrgNode) => void
  onDelete?: (node: OrgNode) => void
  collapsed: Set<string>
  toggleCollapse: (id: string) => void
}) {
  const isCollapsed = collapsed.has(node.id)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <OrgCard node={node} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />

      {/* Toggle button – in flex flow for perfect centering */}
      {hasChildren && (
        <button
          onClick={() => toggleCollapse(node.id)}
          className="relative z-10 -mt-1.5 h-5 w-5 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-xs hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground rotate-90" />
          ) : (
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
          )}
          {isCollapsed && (
            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[7px] font-bold flex items-center justify-center">
              {node.children.length}
            </span>
          )}
        </button>
      )}

      {/* Connector line down from card/toggle */}
      {hasChildren && !isCollapsed && (
        <div className="w-[2px] h-2.5 bg-muted-foreground/40" />
      )}

      {/* Children with connector lines */}
      {hasChildren && !isCollapsed && (
        <div className="relative pt-2.5">
          {/* Horizontal connector bar (spans between child centers) */}
          {node.children.length > 1 && (
            <div
              className="absolute top-2.5 h-[2px] bg-muted-foreground/40"
              style={{
                left: `calc(50% / ${node.children.length})`,
                right: `calc(50% / ${node.children.length})`,
              }}
            />
          )}

          <div className="flex items-start gap-2 sm:gap-3">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                {/* Vertical line down to child */}
                <div className="w-[2px] h-2.5 bg-muted-foreground/40" />
                <TreeBranch
                  node={child}
                  onAdd={onAdd}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  collapsed={collapsed}
                  toggleCollapse={toggleCollapse}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main OrgChart Component ────────────────────────────────────────────────────

export default function OrgChart() {
  const { data: tree, isLoading, isError, refetch } = useOrgChartQuery()
  const createNodeMutation = useCreateOrgNodeMutation()
  const updateNodeMutation = useUpdateOrgNodeMutation()
  const deleteNodeMutation = useDeleteOrgNodeMutation()
  const resetOrgChartMutation = useResetOrgChartMutation()

  const [filterDept, setFilterDept] = useState<string>("all")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [hasInitializedCollapse, setHasInitializedCollapse] = useState(false)

  useEffect(() => {
    if (tree && !hasInitializedCollapse) {
      const ids = new Set<string>()
      const collectAll = (n: OrgNode) => {
        if (n.children && n.children.length > 0) {
          if (n.id !== tree.id) {
            ids.add(n.id)
          }
        }
        n.children?.forEach(collectAll)
      }
      collectAll(tree)
      setCollapsed(ids)
      setHasInitializedCollapse(true)
    }
  }, [tree, hasInitializedCollapse])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)
  const [parentInfo, setParentInfo] = useState<{ id: string; name: string } | null>(null)
  const [formName, setFormName] = useState("")
  const [formTitle, setFormTitle] = useState("")
  const [formDept, setFormDept] = useState("Engineering")
  const [formGrade, setFormGrade] = useState("L1")
  const [formCount, setFormCount] = useState("1")
  const [formOpenRoles, setFormOpenRoles] = useState("0")
  const [zoomScale, setZoomScale] = useState(0.7)

  // ── Zoom helpers ─────────────────────────────────────────────────────────────
  const ZOOM_STEPS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]

  const zoomIn = () => {
    setZoomScale((s) => ZOOM_STEPS.find((z) => z > s + 0.01) ?? 1.0)
  }
  const zoomOut = () => {
    setZoomScale((s) => [...ZOOM_STEPS].reverse().find((z) => z < s - 0.01) ?? 0.3)
  }
  const zoomReset = () => setZoomScale(0.7)

  const toggleCollapse = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const openAddDialog = (parentId: string, parentName: string) => {
    setDialogMode("add")
    setParentInfo({ id: parentId, name: parentName })
    setFormName("")
    setFormTitle("")
    setFormDept("Engineering")
    setFormGrade("L1")
    setFormCount("1")
    setFormOpenRoles("0")
    setDialogOpen(true)
  }

  const openEditDialog = (node: OrgNode) => {
    setDialogMode("edit")
    setEditingNode(node)
    setFormName(node.personName)
    setFormTitle(node.title)
    setFormDept(node.department)
    setFormGrade(node.grade)
    setFormCount(String(node.headcount))
    setFormOpenRoles(String(node.openRoles))
    setDialogOpen(true)
  }

  const handleDelete = (node: OrgNode) => {
    deleteNodeMutation.mutate(node.id)
  }

  const handleSave = () => {
    if (!formName.trim() || !formTitle.trim()) return
    const deptColor = DEPT_COLORS[formDept] || DEPT_COLORS["Engineering"]

    if (dialogMode === "add" && parentInfo) {
      createNodeMutation.mutate({
        id: `node-${Date.now()}`,
        parentId: parentInfo.id,
        personName: formName.trim(),
        title: formTitle.trim(),
        department: formDept,
        grade: formGrade,
        headcount: parseInt(formCount) || 1,
        openRoles: parseInt(formOpenRoles) || 0,
        avatarColor: deptColor,
      })
    }

    if (dialogMode === "edit" && editingNode) {
      updateNodeMutation.mutate({
        id: editingNode.id,
        personName: formName.trim(),
        title: formTitle.trim(),
        department: formDept,
        grade: formGrade,
        headcount: parseInt(formCount) || 1,
        openRoles: parseInt(formOpenRoles) || 0,
        avatarColor: deptColor,
      })
    }

    setDialogOpen(false)
    setEditingNode(null)
    setParentInfo(null)
  }

  const handleReset = () => {
    resetOrgChartMutation.mutate(undefined, {
      onSuccess: () => {
        setCollapsed(new Set())
        setHasInitializedCollapse(false)
      }
    })
  }

  const handleCollapseAll = () => {
    if (!tree) return
    const ids = new Set<string>()
    const collect = (n: OrgNode) => {
      if (n.children && n.children.length) ids.add(n.id)
      n.children?.forEach(collect)
    }
    collect(tree)
    setCollapsed(ids)
  }

  const handleExpandAll = () => setCollapsed(new Set())

  if (isLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading organization chart...</p>
      </div>
    )
  }

  if (isError || !tree) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-500">Failed to load organization chart.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  // ── Filtered tree ────────────────────────────────────────────────────────

  const filteredTree: OrgNode = filterDept === "all"
    ? tree
    : {
        ...tree,
        children: tree.children.filter(
          (c) => c.department === filterDept || c.children.some((gc) => gc.department === filterDept),
        ).map((c) => ({
          ...c,
          children: c.children.filter((gc) => gc.department === filterDept),
        })),
      }

  // ── Stats ────────────────────────────────────────────────────────────────

  const countAll = (n: OrgNode): { nodes: number; people: number; open: number } => {
    let nodes = 1
    let people = tree?.isRealData ? 1 : n.headcount
    let open = n.openRoles
    n.children?.forEach((c) => {
      const r = countAll(c)
      nodes += r.nodes
      people += r.people
      open += r.open
    })
    return { nodes, people, open }
  }
  const stats = countAll(filteredTree)

  // Unique departments in filtered tree
  const allDepts = new Set<string>()
  const collectDepts = (n: OrgNode) => { allDepts.add(n.department); n.children.forEach(collectDepts) }
  collectDepts(tree)

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-200px)]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {[...allDepts].sort().map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExpandAll}>
            <ChevronDown className="h-3 w-3" /> Expand All
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCollapseAll}>
            <ChevronRight className="h-3 w-3" /> Collapse All
          </Button>
          {!tree?.isRealData && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3 w-3" /> Reset
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold">{stats.nodes} positions</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            {stats.people} people
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
            {stats.open} open roles
          </span>
        </div>
      </div>

      {/* Org Chart Canvas with Zoom */}
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border/40 bg-muted/20">
        {/* Zoom Controls floating top-right */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-card/95 backdrop-blur rounded-lg border border-border/50 shadow-sm p-0.5">
          <button
            onClick={zoomOut}
            disabled={zoomScale <= 0.3}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-bold text-muted-foreground min-w-[32px] text-center select-none">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={zoomScale >= 1.0}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors disabled:opacity-30"
          >
            <Plus className="h-3 w-3" />
          </button>
          <div className="w-px h-4 bg-border/50" />
          <button
            onClick={zoomReset}
            className="h-7 px-1.5 flex items-center justify-center rounded hover:bg-muted transition-colors text-[9px] font-bold text-muted-foreground"
            title="Fit to screen"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        </div>

        {/* Scrollable canvas */}
        <div className="h-full overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div
            className="inline-flex justify-center p-6 origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
          >
            <TreeBranch
              node={filteredTree}
              onAdd={tree?.isRealData ? undefined : openAddDialog}
              onEdit={tree?.isRealData ? undefined : openEditDialog}
              onDelete={tree?.isRealData ? undefined : handleDelete}
              collapsed={collapsed}
              toggleCollapse={toggleCollapse}
            />
          </div>
        </div>
      </div>

      {/* Legend - compact */}
      <div className="flex items-center gap-2 flex-wrap text-[9px] shrink-0">
        <span className="font-bold text-foreground/40 uppercase tracking-wider mr-1">Grade:</span>
        {[
          { grade: "CEO", label: "CEO" },
          { grade: "VP", label: "VP" },
          { grade: "Director", label: "Dir" },
          { grade: "Manager", label: "Mgr" },
          { grade: "L3", label: "Sr" },
          { grade: "L2", label: "Mid" },
          { grade: "L1", label: "Jr" },
        ].map(({ grade, label }) => {
          const gi = gradeInfo(grade)
          return (
            <span key={grade} className="flex items-center gap-0.5">
              <span className={cn("text-[8px] font-bold px-1 py-px rounded", gi.color)}>
                {gi.label}
              </span>
              <span className="text-muted-foreground">{label}</span>
            </span>
          )
        })}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Direct Report" : "Edit Position"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? `Adding a new position under "${parentInfo?.name}"`
                : "Update position details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Person Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. John Smith" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Job Title</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Department</Label>
                <Select value={formDept} onValueChange={setFormDept}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...allDepts].sort().map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Grade Level</Label>
                <Select value={formGrade} onValueChange={setFormGrade}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C-SUITE">C-Suite</SelectItem>
                    <SelectItem value="VP">Vice President</SelectItem>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="L4">L4 – Senior Lead</SelectItem>
                    <SelectItem value="L3">L3 – Senior</SelectItem>
                    <SelectItem value="L2">L2 – Mid</SelectItem>
                    <SelectItem value="L1">L1 – Junior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Headcount</Label>
                <Input type="number" min={0} value={formCount} onChange={(e) => setFormCount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Open Roles</Label>
                <Input type="number" min={0} value={formOpenRoles} onChange={(e) => setFormOpenRoles(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!formName.trim() || !formTitle.trim()}>
              {dialogMode === "add" ? "Add Position" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
