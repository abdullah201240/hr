import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateRequestMutation } from "@/hooks/useRegulations";
import type { RegulationPolicy } from "@/hooks/useRegulations";

interface RequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: RegulationPolicy;
}

export function RequestForm({ open, onOpenChange, policy }: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  // Category specific request fields
  const [requestedDays, setRequestedDays] = useState<number | "">("");
  const [equipmentName, setEquipmentName] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | "">("");

  const createMutation = useCreateRequestMutation();

  useEffect(() => {
    setTitle("");
    setReason("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setRequestedDays("");
    setEquipmentName("");
    setEstimatedCost("");
  }, [policy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Request Title is required");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    const metadata: Record<string, any> = {};

    // Validate metadata limits based on policy config
    const policyMeta = policy.metadata || {};

    if (policy.category === "Work From Home") {
      if (!effectiveFrom || !effectiveTo) {
        toast.error("WFH date range is required");
        return;
      }
      if (requestedDays === "" || Number(requestedDays) <= 0) {
        toast.error("Please enter WFH days count");
        return;
      }
      if (policyMeta.maxWfhDays && Number(requestedDays) > Number(policyMeta.maxWfhDays)) {
        toast.error(`Request exceeds maximum limit of ${policyMeta.maxWfhDays} days allowed.`);
        return;
      }
      metadata.wfhDaysCount = Number(requestedDays);
    }

    if (policy.category === "Equipment") {
      if (!equipmentName.trim()) {
        toast.error("Equipment Name is required");
        return;
      }
      if (estimatedCost === "" || Number(estimatedCost) <= 0) {
        toast.error("Estimated cost is required");
        return;
      }
      if (policyMeta.budgetLimit && Number(estimatedCost) > Number(policyMeta.budgetLimit)) {
        toast.error(`Estimated cost exceeds the allowed policy budget limit of ${policyMeta.budgetLimit.toLocaleString()} BDT.`);
        return;
      }
      metadata.equipmentName = equipmentName;
      metadata.estimatedCost = Number(estimatedCost);
    }

    const payload = {
      policyId: policy.id,
      title,
      reason,
      effectiveFrom: effectiveFrom || null,
      effectiveTo: effectiveTo || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Request submitted successfully");
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to submit request");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            Apply against policy: {policy.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submit your details. Applications route through the designated approval workflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="req-title" className="text-xs font-semibold text-foreground">
              Request Title
            </Label>
            <Input
              id="req-title"
              placeholder="e.g. Requesting WFH for July 4th week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Dynamic Inputs for WFH */}
          {policy.category === "Work From Home" && (
            <div className="space-y-3.5 p-3.5 bg-muted/40 rounded-lg border border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Work From Home Period Details
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="effectiveFrom" className="text-[10px] font-medium">Start Date</Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="text-xs bg-background"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="effectiveTo" className="text-[10px] font-medium">End Date</Label>
                  <Input
                    id="effectiveTo"
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="text-xs bg-background"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="requestedDays" className="text-[10px] font-medium">
                  Total WFH Days (Policy limit: {policy.metadata?.maxWfhDays || "Unlimited"})
                </Label>
                <Input
                  id="requestedDays"
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  value={requestedDays}
                  onChange={(e) => setRequestedDays(e.target.value === "" ? "" : Number(e.target.value))}
                  className="text-xs bg-background"
                  required
                />
              </div>
            </div>
          )}

          {/* Dynamic Inputs for Equipment */}
          {policy.category === "Equipment" && (
            <div className="space-y-3.5 p-3.5 bg-muted/40 rounded-lg border border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Equipment Reimbursement Details
              </span>
              <div className="space-y-1">
                <Label htmlFor="equipmentName" className="text-[10px] font-medium">Item / Asset Name</Label>
                <Input
                  id="equipmentName"
                  placeholder="e.g. Ergonomic Office Chair"
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="text-xs bg-background"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="estimatedCost" className="text-[10px] font-medium">
                  Estimated Cost (BDT) (Limit: {policy.metadata?.budgetLimit ? `${policy.metadata.budgetLimit.toLocaleString()} BDT` : "None"})
                </Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min={1}
                  placeholder="e.g. 12000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value === "" ? "" : Number(e.target.value))}
                  className="text-xs bg-background"
                  required
                />
              </div>
            </div>
          )}

          {/* Fallback general dates if not WFH (e.g. Equipment/Dress code might have effective dates but not required) */}
          {policy.category !== "Work From Home" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="effectiveFrom" className="text-[10px] font-medium text-muted-foreground">Effective From (Optional)</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="effectiveTo" className="text-[10px] font-medium text-muted-foreground">Effective To (Optional)</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={effectiveTo}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-xs font-semibold text-foreground">
              Reason / Justification
            </Label>
            <Textarea
              id="reason"
              placeholder="Provide context and explain the necessity of this request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs min-h-[90px]"
              required
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
