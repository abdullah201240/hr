import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, UserCheck, ShieldAlert, ListChecks } from "lucide-react";
import { PolicyList } from "@/components/regulations/PolicyList";
import { MyRequests } from "@/components/regulations/MyRequests";
import { ApprovalQueue } from "@/components/regulations/ApprovalQueue";
import { usePermissions } from "@/hooks/usePermissions";

export default function RegulationsPage() {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const canReadPolicies = hasPermission("regulations:read");
  const canViewOwn = hasAnyPermission(["regulations:apply", "regulations:view_own"]);
  const canApprove = hasAnyPermission(["regulations:view_team", "regulations:approve"]);

  // Calculate default tab
  let defaultTab = "";
  if (canReadPolicies) defaultTab = "policies";
  else if (canViewOwn) defaultTab = "requests";
  else if (canApprove) defaultTab = "approvals";

  if (!defaultTab) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive animate-pulse" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          You do not have the required permissions to view Office Regulations. Please contact your system administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 shrink-0 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Office Regulations</h1>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              View and manage company policies, dress code, equipment setups, and submit or review requests.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-muted/40 border border-border/40 p-1 h-10 rounded-lg">
          {canReadPolicies && (
            <TabsTrigger value="policies" className="text-xs font-semibold px-4 gap-2">
              <BookOpen className="h-3.5 w-3.5" />
              Regulation Policies
            </TabsTrigger>
          )}
          {canViewOwn && (
            <TabsTrigger value="requests" className="text-xs font-semibold px-4 gap-2">
              <ListChecks className="h-3.5 w-3.5" />
              My Requests
            </TabsTrigger>
          )}
          {canApprove && (
            <TabsTrigger value="approvals" className="text-xs font-semibold px-4 gap-2">
              <UserCheck className="h-3.5 w-3.5" />
              Approval Queue
            </TabsTrigger>
          )}
        </TabsList>

        {canReadPolicies && (
          <TabsContent value="policies" className="outline-none">
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-6">
                <PolicyList />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canViewOwn && (
          <TabsContent value="requests" className="outline-none">
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-6">
                <MyRequests />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canApprove && (
          <TabsContent value="approvals" className="outline-none">
            <Card className="border border-border/40 shadow-xs">
              <CardContent className="p-6">
                <ApprovalQueue />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
