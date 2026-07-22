import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Calendar, ChevronRight } from "lucide-react";
import { useRegulationRequestsQuery, useRegulationPoliciesQuery } from "@/hooks/useRegulations";
import type { RegulationRequest, RegulationPolicy } from "@/hooks/useRegulations";
import { useAuthStore } from "@/store/useAuthStore";
import { RequestForm } from "./RequestForm";
import { RequestDetail } from "./RequestDetail";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";



export function MyRequests() {
  const { user } = useAuthStore();

  const { data: requestsRes, isLoading: loadingRequests } = useRegulationRequestsQuery({ employeeId: user?.id });
  const { data: policies = [], isLoading: loadingPolicies } = useRegulationPoliciesQuery();


  const [selectedRequest, setSelectedRequest] = useState<RegulationRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Policy selector modal
  const [policySelectorOpen, setPolicySelectorOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<RegulationPolicy | null>(null);
  const [requestFormOpen, setRequestFormOpen] = useState(false);

  const requests = requestsRes?.data || [];

  const handleOpenDetail = (req: RegulationRequest) => {
    setSelectedRequest(req);
    setDetailOpen(true);
  };



  const handleSelectPolicy = (policy: RegulationPolicy) => {
    setSelectedPolicy(policy);
    setPolicySelectorOpen(false);
    setRequestFormOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 font-bold text-[9px] py-0 px-2">Awaiting Manager</Badge>;
      case "Pending_2nd":
        return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold text-[9px] py-0 px-2">Awaiting Final Approval</Badge>;
      case "Approved":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-[9px] py-0 px-2">Approved</Badge>;
      case "Rejected":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-[9px] py-0 px-2">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] font-bold py-0 px-2">{status}</Badge>;
    }
  };

  // Only show active policies that allow employee requests
  const eligiblePolicies = policies.filter(p => p.isActive && p.allowEmployeeRequests);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">My Regulation Requests</h3>
          <p className="text-[11px] text-muted-foreground">Monitor and submit requests against company regulations</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => setPolicySelectorOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Request
        </Button>
      </div>

      <div className="border border-border/40 rounded-lg overflow-hidden bg-card">
        <Table className="text-xs">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Request Title</TableHead>
              <TableHead className="font-bold">Regulation Policy</TableHead>
              <TableHead className="font-bold">Submitted Date</TableHead>
              <TableHead className="font-bold">Effective Period</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRequests ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading requests...
                  </div>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No submitted regulation requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/10">
                  <td className="p-3 font-semibold text-foreground">{req.title}</td>
                  <td className="p-3 text-muted-foreground font-medium">{req.policyTitle}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(req.requestDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-muted-foreground font-medium">
                    {req.effectiveFrom ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {new Date(req.effectiveFrom).toLocaleDateString()}
                        {req.effectiveTo ? ` - ${new Date(req.effectiveTo).toLocaleDateString()}` : ""}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3">{getStatusBadge(req.status)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenDetail(req)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Policy Selector Dialog */}
      <Dialog open={policySelectorOpen} onOpenChange={setPolicySelectorOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Select Policy for Request
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose an active policy to submit your application against.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4 flex-1 overflow-y-auto pr-1">
            {loadingPolicies ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : eligiblePolicies.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No policies currently allow requests.</p>
            ) : (
              eligiblePolicies.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPolicy(p)}
                  className="flex items-center justify-between p-3.5 border border-border/40 hover:border-primary hover:bg-primary/5 rounded-lg cursor-pointer transition-all duration-200"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-foreground block">{p.title}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[350px]">
                      {p.description}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Form Dialog */}
      {selectedPolicy && (
        <RequestForm
          open={requestFormOpen}
          onOpenChange={setRequestFormOpen}
          policy={selectedPolicy}
        />
      )}

      {/* Detail Dialog */}
      <RequestDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selectedRequest}
      />
    </div>
  );
}
