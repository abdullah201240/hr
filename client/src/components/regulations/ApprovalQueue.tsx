import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, UserCheck } from "lucide-react";
import { useRegulationRequestsQuery } from "@/hooks/useRegulations";
import type { RegulationRequest } from "@/hooks/useRegulations";
import { RequestDetail } from "./RequestDetail";

interface ApprovalQueueProps {
  type: "manager" | "final";
}

export function ApprovalQueue({ type }: ApprovalQueueProps) {
  const { data: requestsRes, isLoading } = useRegulationRequestsQuery();
  const [selectedRequest, setSelectedRequest] = useState<RegulationRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const requests = requestsRes?.data || [];

  const handleOpenDetail = (req: RegulationRequest) => {
    setSelectedRequest(req);
    setDetailOpen(true);
  };

  // Filter requests based on the step queue type
  const pendingApprovals = requests.filter((req) => {
    if (req.status === "Approved" || req.status === "Rejected" || req.status === "Cancelled") {
      return false;
    }

    if (type === "manager") {
      return req.status === "Pending";
    }

    if (type === "final") {
      return req.status === "Pending_2nd";
    }

    return false;
  });

  const getStepBadge = (req: RegulationRequest) => {
    if (req.status === "Pending") {
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold text-[9px] py-0 px-2">
          Step 1: Line Manager
        </Badge>
      );
    }
    if (req.status === "Pending_2nd") {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-bold text-[9px] py-0 px-2">
          Step 2: HR / Admin Final
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <UserCheck className="h-4.5 w-4.5 text-primary shrink-0" />
          Approval Queue
        </h3>
        <p className="text-[11px] text-muted-foreground">Regulation requests awaiting your review and approval decision</p>
      </div>

      <div className="border border-border/40 rounded-lg overflow-hidden bg-card">
        <Table className="text-xs">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold">Applicant</TableHead>
              <TableHead className="font-bold">Request Title</TableHead>
              <TableHead className="font-bold">Policy Category</TableHead>
              <TableHead className="font-bold">Submitted Date</TableHead>
              <TableHead className="font-bold">Required Step</TableHead>
              <TableHead className="font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading approval queue...
                  </div>
                </TableCell>
              </TableRow>
            ) : pendingApprovals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No pending regulation requests require your approval.
                </TableCell>
              </TableRow>
            ) : (
              pendingApprovals.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/10">
                  <td className="p-3">
                    <div className="font-semibold text-foreground">{req.employeeName}</div>
                    <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{req.employeeIdCode}</div>
                  </td>
                  <td className="p-3 font-semibold text-foreground">{req.title}</td>
                  <td className="p-3 font-medium text-muted-foreground">{req.policyCategory}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(req.requestDate).toLocaleDateString()}
                  </td>
                  <td className="p-3">{getStepBadge(req)}</td>
                  <td className="p-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleOpenDetail(req)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Review
                    </Button>
                  </td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RequestDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selectedRequest}
      />
    </div>
  );
}
