import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, User, FileText, CheckCircle2, AlertCircle, Bookmark, RefreshCw } from "lucide-react";
import { useUpdateRequestStatusMutation } from "@/hooks/useRegulations";
import type { RegulationRequest } from "@/hooks/useRegulations";
import { useAuthStore } from "@/store/useAuthStore";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

interface RequestDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RegulationRequest | null;
}

export function RequestDetail({ open, onOpenChange, request }: RequestDetailProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const updateStatusMutation = useUpdateRequestStatusMutation();

  if (!request) return null;

  const isLineManager = user?.id && request.employeeId !== user.id && request.firstApprovedById === null; // Can be line manager if not approved yet
  
  // Checking permissions
  const canApproveFinal = hasPermission("regulations:approve");

  const handleApprove = () => {
    updateStatusMutation.mutate(
      {
        id: request.id,
        payload: { status: "Approved" },
      },
      {
        onSuccess: () => {
          toast.success("Request approved successfully");
          onOpenChange(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to approve request");
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    updateStatusMutation.mutate(
      {
        id: request.id,
        payload: { status: "Rejected", rejectionReason },
      },
      {
        onSuccess: () => {
          toast.success("Request rejected");
          onOpenChange(false);
          setShowRejectForm(false);
          setRejectionReason("");
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to reject request");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 font-bold text-[10px]">Awaiting Manager</Badge>;
      case "Pending_2nd":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold text-[10px]">Awaiting Final Approval</Badge>;
      case "Approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-[10px]">Approved</Badge>;
      case "Rejected":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
    }
  };

  const isPending = updateStatusMutation.isPending;

  // Decide if current user has action buttons
  const showActions =
    !showRejectForm &&
    ((request.status === "Pending" && (isLineManager || canApproveFinal)) ||
      (request.status === "Pending_2nd" && canApproveFinal));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-md font-bold text-foreground flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary shrink-0" />
            Request: {request.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submitted on {new Date(request.requestDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin-slow" />
              <span className="text-xs font-semibold text-foreground">Current Status</span>
            </div>
            {getStatusBadge(request.status)}
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Applicant</span>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {request.employeeName} ({request.employeeIdCode})
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Policy Applied</span>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {request.policyTitle}
              </div>
            </div>

            {request.effectiveFrom && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Effective Period</span>
                <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {new Date(request.effectiveFrom).toLocaleDateString()}
                  {request.effectiveTo ? ` to ${new Date(request.effectiveTo).toLocaleDateString()}` : ""}
                </div>
              </div>
            )}
          </div>

          {/* Category-Specific Metadata Display */}
          {request.metadata && Object.keys(request.metadata).length > 0 && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border/30 text-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                Application Specifics
              </span>
              <div className="grid grid-cols-2 gap-2 font-medium">
                {request.policyCategory === "Work From Home" && request.metadata.wfhDaysCount && (
                  <div className="col-span-2 flex justify-between border-b border-border/10 py-1">
                    <span className="text-muted-foreground">Requested WFH Days:</span>
                    <span className="text-foreground font-bold">{request.metadata.wfhDaysCount} days</span>
                  </div>
                )}
                {request.policyCategory === "Equipment" && (
                  <>
                    {request.metadata.equipmentName && (
                      <div className="col-span-2 flex justify-between border-b border-border/10 py-1">
                        <span className="text-muted-foreground">Item Name:</span>
                        <span className="text-foreground font-bold">{request.metadata.equipmentName}</span>
                      </div>
                    )}
                    {request.metadata.estimatedCost && (
                      <div className="col-span-2 flex justify-between border-b border-border/10 py-1">
                        <span className="text-muted-foreground">Estimated Cost:</span>
                        <span className="text-foreground font-bold">{request.metadata.estimatedCost.toLocaleString()} BDT</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Reason Justification */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Reason / Justification</span>
            <p className="text-xs text-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30 font-medium">
              {request.reason}
            </p>
          </div>

          {/* Rejection / Approval History */}
          <div className="border-t border-border/30 pt-3.5 space-y-3 text-xs">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Approval Log</span>
            
            {request.firstApprovedByName && (
              <div className="flex items-start gap-2 text-[11px]">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Line Manager 1st Approval: </span>
                  <span className="text-muted-foreground">Approved by {request.firstApprovedByName} on {request.firstApprovedAt ? new Date(request.firstApprovedAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            )}

            {request.finalApprovedByName && (
              <div className="flex items-start gap-2 text-[11px]">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">HR / Admin Final Approval: </span>
                  <span className="text-muted-foreground">Approved by {request.finalApprovedByName} on {request.finalApprovedAt ? new Date(request.finalApprovedAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            )}

            {request.status === "Rejected" && (
              <div className="flex items-start gap-2 text-[11px] p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-red-700">Rejection details: </span>
                  <p className="text-muted-foreground mt-1 leading-relaxed font-medium">{request.rejectionReason || "No explanation provided"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Inline Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3 pt-3.5 border-t border-border/30">
              <Label htmlFor="reject-reason" className="text-xs font-semibold text-foreground">
                Rejection Reason
              </Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="text-xs min-h-[80px]"
                required
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => setShowRejectForm(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8"
                  onClick={handleReject}
                  disabled={isPending}
                >
                  {isPending ? "Submitting..." : "Reject Request"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {showActions && (
          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 border-destructive/20"
              onClick={() => setShowRejectForm(true)}
              disabled={isPending}
            >
              Reject
            </Button>
            <Button size="sm" className="h-8" onClick={handleApprove} disabled={isPending}>
              {isPending ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
