import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCreatePolicyMutation, useUpdatePolicyMutation } from "@/hooks/useRegulations";
import type { RegulationPolicy } from "@/hooks/useRegulations";

interface PolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy?: RegulationPolicy | null;
}

export function PolicyForm({ open, onOpenChange, policy }: PolicyFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [allowEmployeeRequests, setAllowEmployeeRequests] = useState(true);

  // Category specific metadata fields
  const [maxWfhDays, setMaxWfhDays] = useState<number | "">("");
  const [budgetLimit, setBudgetLimit] = useState<number | "">("");

  const createMutation = useCreatePolicyMutation();
  const updateMutation = useUpdatePolicyMutation();

  useEffect(() => {
    if (policy) {
      setTitle(policy.title);
      setCategory(policy.category);
      setDescription(policy.description);
      setIsActive(policy.isActive);
      setRequiresApproval(policy.requiresApproval);
      setAllowEmployeeRequests(policy.allowEmployeeRequests);

      // Populate metadata
      const meta = policy.metadata || {};
      setMaxWfhDays(meta.maxWfhDays !== undefined ? meta.maxWfhDays : "");
      setBudgetLimit(meta.budgetLimit !== undefined ? meta.budgetLimit : "");
    } else {
      setTitle("");
      setCategory("General");
      setDescription("");
      setIsActive(true);
      setRequiresApproval(true);
      setAllowEmployeeRequests(true);
      setMaxWfhDays("");
      setBudgetLimit("");
    }
  }, [policy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!category) {
      toast.error("Category is required");
      return;
    }

    const metadata: Record<string, any> = {};
    if (category === "Work From Home" && maxWfhDays !== "") {
      metadata.maxWfhDays = Number(maxWfhDays);
    }
    if (category === "Equipment" && budgetLimit !== "") {
      metadata.budgetLimit = Number(budgetLimit);
    }

    const payload = {
      title,
      category,
      description,
      isActive,
      requiresApproval,
      allowEmployeeRequests,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };

    if (policy) {
      updateMutation.mutate(
        { id: policy.id, payload },
        {
          onSuccess: () => {
            toast.success("Policy updated successfully");
            onOpenChange(false);
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to update policy");
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Policy created successfully");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to create policy");
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {policy ? `Edit Policy: ${policy.title}` : "Create Regulation Policy"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Set company guidelines, approval routing, and policy boundaries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground">
              Policy Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Work From Home Policy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold text-foreground">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="text-xs">
                <SelectValue placeholder="Select policy category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Work From Home">Work From Home</SelectItem>
                <SelectItem value="Equipment">Equipment & Assets</SelectItem>
                <SelectItem value="Dress Code">Dress Code</SelectItem>
                <SelectItem value="General">General / Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Category Specific Metadata Fields */}
          {category === "Work From Home" && (
            <div className="space-y-1.5 p-3.5 bg-muted/40 rounded-lg border border-border/50">
              <Label htmlFor="maxWfhDays" className="text-xs font-semibold text-foreground">
                Max Allowed WFH Days per Month
              </Label>
              <Input
                id="maxWfhDays"
                type="number"
                min={1}
                max={31}
                placeholder="e.g. 8"
                value={maxWfhDays}
                onChange={(e) => setMaxWfhDays(e.target.value === "" ? "" : Number(e.target.value))}
                className="text-xs bg-background"
              />
            </div>
          )}

          {category === "Equipment" && (
            <div className="space-y-1.5 p-3.5 bg-muted/40 rounded-lg border border-border/50">
              <Label htmlFor="budgetLimit" className="text-xs font-semibold text-foreground">
                Equipment Budget Limit (BDT)
              </Label>
              <Input
                id="budgetLimit"
                type="number"
                min={0}
                placeholder="e.g. 50000"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value === "" ? "" : Number(e.target.value))}
                className="text-xs bg-background"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Outline details, eligibility requirements, and procedures..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[100px]"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Active Status</Label>
                <p className="text-[10px] text-muted-foreground">Allows requests or policy visibility</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Requires Approval</Label>
                <p className="text-[10px] text-muted-foreground">Enforces manager & HR review workflow</p>
              </div>
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold text-foreground">Allow Employee Requests</Label>
                <p className="text-[10px] text-muted-foreground">Employees can submit applications</p>
              </div>
              <Switch checked={allowEmployeeRequests} onCheckedChange={setAllowEmployeeRequests} />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving..." : policy ? "Update Policy" : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
