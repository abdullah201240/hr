import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Swal from "sweetalert2"
import { toast } from "sonner"
import type { SalaryTemplate, CreateSalaryTemplateComponentPayload } from "@/types"

interface SalaryTemplatesTabProps {
  templates: SalaryTemplate[]
  templatesLoading: boolean
  createTemplateMutation: any
  updateTemplateMutation: any
  deleteTemplateMutation: any
  formatCurrency: (val: number) => string
}

const defaultComponents: CreateSalaryTemplateComponentPayload[] = [
  { name: "House Rent Allowance", type: "earning", calculationType: "percentage", value: 20, isTaxable: false, sortOrder: 0 },
  { name: "Transport Allowance", type: "earning", calculationType: "percentage", value: 10, isTaxable: false, sortOrder: 1 },
  { name: "Medical Allowance", type: "earning", calculationType: "percentage", value: 5, isTaxable: false, sortOrder: 2 },
]

export default function SalaryTemplatesTab({
  templates,
  templatesLoading,
  createTemplateMutation,
  updateTemplateMutation,
  deleteTemplateMutation,
  formatCurrency,
}: SalaryTemplatesTabProps) {
  // Expanded template cards
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Template Dialog State
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateComponents, setTemplateComponents] = useState<
    CreateSalaryTemplateComponentPayload[]
  >([])

  const handleOpenCreateTemplate = () => {
    setEditingTemplateId(null)
    setTemplateName("")
    setTemplateDescription("")
    setTemplateComponents([...defaultComponents])
    setIsTemplateDialogOpen(true)
  }

  const handleOpenEditTemplate = (template: SalaryTemplate) => {
    setEditingTemplateId(template.id)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateComponents(
      template.components.map((c) => ({
        name: c.name,
        type: c.type,
        calculationType: c.calculationType,
        value: c.value,
        isTaxable: c.isTaxable,
        sortOrder: c.sortOrder,
      }))
    )
    setIsTemplateDialogOpen(true)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Template name is required")
      return
    }

    const payload = {
      name: templateName.trim(),
      description: templateDescription.trim(),
      components: templateComponents,
    }

    if (editingTemplateId) {
      updateTemplateMutation.mutate(
        { id: editingTemplateId, payload },
        {
          onSuccess: () => {
            setIsTemplateDialogOpen(false)
            toast.success("Template updated successfully")
          },
          onError: (err: any) =>
            toast.error(err?.message || "Failed to update template"),
        }
      )
    } else {
      createTemplateMutation.mutate(payload, {
        onSuccess: () => {
          setIsTemplateDialogOpen(false)
          toast.success("Template created successfully")
        },
        onError: (err: any) =>
          toast.error(err?.message || "Failed to create template"),
      })
    }
  }

  const handleDeleteTemplate = (id: string, name: string) => {
    Swal.fire({
      title: `Delete "${name}"?`,
      text: "This will permanently remove the template and all its components.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton:
          "swal2-confirm swal2-styled bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton:
          "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        deleteTemplateMutation.mutate(id, {
          onSuccess: () => toast.success("Template deleted"),
          onError: (err: any) =>
            toast.error(err?.message || "Failed to delete template"),
        })
      }
    })
  }

  const addComponent = () => {
    setTemplateComponents((prev) => [
      ...prev,
      {
        name: "",
        type: "earning",
        calculationType: "percentage",
        value: 0,
        isTaxable: false,
        sortOrder: prev.length,
      },
    ])
  }

  const removeComponent = (idx: number) => {
    setTemplateComponents((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateComponent = (
    idx: number,
    field: string,
    value: string | number | boolean
  ) => {
    setTemplateComponents((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold">Salary Structure Templates</h3>
          <p className="text-xs text-muted-foreground">
            Create reusable salary packages with earnings and deductions.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 text-xs"
          onClick={handleOpenCreateTemplate}
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {templatesLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="shadow-none border-border/40">
          <CardContent className="p-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">
              No salary templates created yet
            </p>
            <p className="text-xs text-muted-foreground">
              Create your first template to standardize salary structures.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const isExpanded = expandedTemplates.has(template.id)
            const earnings = template.components.filter(
              (c) => c.type === "earning"
            )
            const deductions = template.components.filter(
              (c) => c.type === "deduction"
            )
            return (
              <Card
                key={template.id}
                className="shadow-none border-border/40 overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="text-[10px]">
                          {template.components.length} components ·{" "}
                          {earnings.length} earnings · {deductions.length}{" "}
                          deductions
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-bold py-0.5 px-2",
                          template.isActive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenEditTemplate(template)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() =>
                          handleDeleteTemplate(template.id, template.name)
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {template.description && (
                    <p className="text-[10px] text-muted-foreground mt-1 ml-10">
                      {template.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <button
                    className="flex items-center gap-1 text-[10px] text-primary hover:underline font-semibold"
                    onClick={() => toggleExpand(template.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    {isExpanded ? "Hide" : "Show"} Components
                  </button>
                  {isExpanded && (
                    <div className="mt-3 space-y-2">
                      {template.components.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground italic">
                          No components defined
                        </p>
                      ) : (
                        <div className="grid gap-1.5">
                          {template.components.map((comp) => (
                            <div
                              key={comp.id}
                              className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/20 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    comp.type === "earning"
                                      ? "bg-emerald-500"
                                      : "bg-rose-500"
                                  )}
                                />
                                <span className="font-medium">
                                  {comp.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-[10px]">
                                  {comp.calculationType === "percentage"
                                    ? `${comp.value}% of Basic`
                                    : formatCurrency(comp.value)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] font-bold py-0 px-1.5",
                                    comp.type === "earning"
                                      ? "text-emerald-600 border-emerald-500/20"
                                      : "text-rose-500 border-rose-500/20"
                                  )}
                                >
                                  {comp.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {editingTemplateId ? "Edit Template" : "Create Salary Template"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the earning and deduction components for this salary
              structure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Template Name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Standard Full-Time Package"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description</Label>
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Optional description"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Components */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Salary Components
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={addComponent}
                >
                  <Plus className="h-3 w-3" />
                  Add Component
                </Button>
              </div>

              {templateComponents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No components. Click "Add Component" to start.
                </p>
              ) : (
                <div className="space-y-2">
                  {templateComponents.map((comp, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_100px_100px_80px_32px] gap-2 items-end p-3 rounded-lg border border-border/30 bg-muted/10"
                    >
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Name
                        </Label>
                        <Input
                          value={comp.name}
                          onChange={(e) =>
                            updateComponent(idx, "name", e.target.value)
                          }
                          placeholder="Component name"
                          className="text-xs h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Type
                        </Label>
                        <select
                          value={comp.type}
                          onChange={(e) =>
                            updateComponent(idx, "type", e.target.value)
                          }
                          className="w-full bg-background border border-border/60 text-xs h-8 rounded-md px-2"
                        >
                          <option value="earning">Earning</option>
                          <option value="deduction">Deduction</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Calc
                        </Label>
                        <select
                          value={comp.calculationType}
                          onChange={(e) =>
                            updateComponent(
                              idx,
                              "calculationType",
                              e.target.value
                            )
                          }
                          className="w-full bg-background border border-border/60 text-xs h-8 rounded-md px-2"
                        >
                          <option value="percentage">%</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">
                          Value
                        </Label>
                        <Input
                          type="number"
                          value={comp.value || ""}
                          onChange={(e) =>
                            updateComponent(
                              idx,
                              "value",
                              Number(e.target.value)
                            )
                          }
                          className="text-xs h-8"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        onClick={() => removeComponent(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTemplate}
              disabled={
                createTemplateMutation.isPending ||
                updateTemplateMutation.isPending
              }
              className="text-xs"
            >
              {createTemplateMutation.isPending ||
              updateTemplateMutation.isPending
                ? "Saving..."
                : editingTemplateId
                ? "Update Template"
                : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
