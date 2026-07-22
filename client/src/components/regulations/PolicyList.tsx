import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { useRegulationPoliciesQuery, useDeletePolicyMutation } from "@/hooks/useRegulations";
import type { RegulationPolicy } from "@/hooks/useRegulations";
import { usePermissions } from "@/hooks/usePermissions";
import { PolicyForm } from "./PolicyForm";
import { toast } from "sonner";
import Swal from "sweetalert2";

export function PolicyList() {
  const { data: policies = [], isLoading, error } = useRegulationPoliciesQuery();
  const deleteMutation = useDeletePolicyMutation();
  const { hasPermission } = usePermissions();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<RegulationPolicy | null>(null);

  const canCreate = hasPermission("regulations:create");
  const canUpdate = hasPermission("regulations:update");
  const canDelete = hasPermission("regulations:delete");

  const handleEdit = (policy: RegulationPolicy) => {
    setSelectedPolicy(policy);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedPolicy(null);
    setFormOpen(true);
  };

  const handleDelete = (policy: RegulationPolicy) => {
    Swal.fire({
      title: "Delete Policy?",
      text: `Are you sure you want to delete "${policy.title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal2-confirm swal2-styled bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-md px-4 py-2 mr-2",
        cancelButton: "swal2-cancel swal2-styled bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-md px-4 py-2"
      }
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(policy.id, {
          onSuccess: () => {
            toast.success("Policy deleted successfully");
          },
          onError: (err: any) => {
            toast.error(err.message || "Failed to delete policy. It may have active employee requests.");
          }
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading policies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <span className="text-sm font-semibold">Error loading regulation policies</span>
        <span className="text-xs text-muted-foreground">{error.message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Company Regulation Policies</h3>
          <p className="text-[11px] text-muted-foreground">Policies and guidelines for workforce compliance and requests</p>
        </div>
        {canCreate && (
          <Button size="sm" className="h-8 gap-1.5" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" />
            Add Policy
          </Button>
        )}
      </div>

      <div className="border border-border/40 rounded-lg overflow-hidden bg-card">
        <Table className="text-xs">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Policy Title</TableHead>
              <TableHead className="font-bold">Category</TableHead>
              <TableHead className="font-bold">Requests Allowed</TableHead>
              <TableHead className="font-bold">Approval Required</TableHead>
              <TableHead className="font-bold">Rules / Limits</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {(canUpdate || canDelete) && <TableHead className="font-bold text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6} className="text-center py-10 text-muted-foreground">
                  No regulation policies found.
                </TableCell>
              </TableRow>
            ) : (
              policies.map((policy) => {
                const meta = policy.metadata || {};
                let limitText = "Standard";
                if (policy.category === "Work From Home" && meta.maxWfhDays) {
                  limitText = `Max ${meta.maxWfhDays} WFH days/mo`;
                } else if (policy.category === "Equipment" && meta.budgetLimit) {
                  limitText = `Budget limit: ${meta.budgetLimit.toLocaleString()} BDT`;
                }

                return (
                  <TableRow key={policy.id} className="hover:bg-muted/10">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{policy.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 max-w-[250px]">{policy.description}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] font-medium py-0 px-2">
                        {policy.category}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {policy.allowEmployeeRequests ? (
                        <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium">
                          <CheckCircle className="h-3 w-3 shrink-0" /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <XCircle className="h-3 w-3 shrink-0" /> Admin Only
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {policy.requiresApproval ? (
                        <Badge variant="secondary" className="text-[9px] font-semibold py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          2-Step Review
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] font-semibold py-0.5 bg-green-500/10 text-green-600 border border-green-500/20">
                          Auto-Approved
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground font-medium">{limitText}</td>
                    <td className="p-3">
                      {policy.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canUpdate && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(policy)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(policy)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PolicyForm open={formOpen} onOpenChange={setFormOpen} policy={selectedPolicy} />
    </div>
  );
}
