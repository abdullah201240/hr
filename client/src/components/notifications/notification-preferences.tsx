import { useState, useEffect } from 'react';
import { usePreferencesQuery, useUpdatePreferencesMutation } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Save, 
  BellRing, 
  VolumeX, 
  AppWindow,
  Bell,
  Calendar,
  Clock,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Target,
  TrendingUp,
  ShieldAlert,
  FileText,
  Settings,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationModule, NotificationCategory } from '@/types/notifications';

export function NotificationPreferences() {
  const { data: preferences, isLoading } = usePreferencesQuery();
  const updateMutation = useUpdatePreferencesMutation();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [digestFrequency, setDigestFrequency] = useState<'realtime' | 'hourly' | 'daily'>('realtime');
  const [disabledModules, setDisabledModules] = useState<NotificationModule[]>([]);
  const [disabledCategories, setDisabledCategories] = useState<NotificationCategory[]>([]);

  // Sync state with fetched preferences data
  useEffect(() => {
    if (preferences) {
      setPushEnabled(preferences.pushEnabled);
      setQuietHoursStart(preferences.quietHoursStart || '22:00');
      setQuietHoursEnd(preferences.quietHoursEnd || '08:00');
      setDigestFrequency(preferences.digestFrequency || 'realtime');
      setDisabledModules(preferences.disabledModules || []);
      setDisabledCategories(preferences.disabledCategories || []);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      pushEnabled,
      quietHoursStart,
      quietHoursEnd,
      digestFrequency,
      disabledModules,
      disabledCategories,
    }, {
      onSuccess: () => {
        toast.success('Notification preferences saved!', {
          description: 'Your notification settings have been updated successfully.',
        });
      },
      onError: (error: any) => {
        toast.error('Failed to save preferences', {
          description: error.message || 'An unexpected error occurred.',
        });
      },
    });
  };

  const toggleModule = (moduleName: NotificationModule) => {
    setDisabledModules((prev) =>
      prev.includes(moduleName)
        ? prev.filter((m) => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const toggleCategory = (categoryName: NotificationCategory) => {
    setDisabledCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Modules list with icons and colors
  const availableModules: { 
    key: NotificationModule; 
    label: string; 
    icon: React.ReactNode;
    color: string;
    description: string;
  }[] = [
    { key: 'leave', label: 'Leave Management', icon: <Calendar className="h-4 w-4" />, color: 'text-blue-500', description: 'Leave approvals & status' },
    { key: 'attendance', label: 'Attendance', icon: <Clock className="h-4 w-4" />, color: 'text-emerald-500', description: 'Check-in/out alerts' },
    { key: 'tasks', label: 'Tasks Management', icon: <Target className="h-4 w-4" />, color: 'text-purple-500', description: 'Assignments & updates' },
    { key: 'payroll', label: 'Salary & Payroll', icon: <TrendingUp className="h-4 w-4" />, color: 'text-amber-500', description: 'Payslips & adjustments' },
    { key: 'claims', label: 'Claims & Reimbursement', icon: <FileText className="h-4 w-4" />, color: 'text-cyan-500', description: 'Expense approvals' },
    { key: 'recruitment', label: 'Recruitment', icon: <UserCheck className="h-4 w-4" />, color: 'text-pink-500', description: 'Interviews & offers' },
    { key: 'announcements', label: 'Announcements', icon: <Bell className="h-4 w-4" />, color: 'text-orange-500', description: 'Company-wide news' },
    { key: 'performance', label: 'KPI & Performance', icon: <TrendingUp className="h-4 w-4" />, color: 'text-indigo-500', description: 'Review cycles' },
    { key: 'disciplinary', label: 'Disciplinary', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-500', description: 'Warnings & actions' },
    { key: 'separation', label: 'Separation', icon: <ShieldAlert className="h-4 w-4" />, color: 'text-slate-500', description: 'Exit process' },
  ];

  // Categories list with icons
  const availableCategories: { 
    key: NotificationCategory; 
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    { key: 'approval', label: 'Approval Requests', icon: <CheckCircle2 className="h-4 w-4" />, description: 'When action is needed' },
    { key: 'rejection', label: 'Rejection Alerts', icon: <AlertTriangle className="h-4 w-4" />, description: 'Denied requests' },
    { key: 'assignment', label: 'Task Assignments', icon: <Target className="h-4 w-4" />, description: 'New assignments' },
    { key: 'mention', label: 'User @Mentions', icon: <MessageSquare className="h-4 w-4" />, description: 'When mentioned' },
    { key: 'reminder', label: 'Deadlines & Reminders', icon: <Clock className="h-4 w-4" />, description: 'Upcoming due dates' },
    { key: 'status_change', label: 'Status Updates', icon: <TrendingUp className="h-4 w-4" />, description: 'State transitions' },
    { key: 'comment', label: 'New Comments', icon: <MessageSquare className="h-4 w-4" />, description: 'Activity replies' },
    { key: 'broadcast', label: 'Admin Broadcasts', icon: <Bell className="h-4 w-4" />, description: 'Company announcements' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Notification Preferences
        </h3>
        <p className="text-sm text-muted-foreground">
          Customize how and when you receive notifications across the platform.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Channels Card */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Delivery Channels
              </CardTitle>
              <CardDescription className="text-xs">
                Choose how you want to receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between p-3 rounded-lg border border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors">
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                    <AppWindow className="h-4.5 w-4.5 text-purple-500" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold">Browser Push</Label>
                    <p className="text-xs text-muted-foreground">Real-time popups while using the application.</p>
                  </div>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} className="ml-3" />
              </div>
            </CardContent>
          </Card>

          {/* Quiet Hours & Digest Card */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <VolumeX className="h-5 w-5 text-primary" />
                Quiet Hours & Digests
              </CardTitle>
              <CardDescription className="text-xs">
                Configure do-not-disturb times and notification aggregation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Quiet Start
                  </Label>
                  <Input
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Quiet End
                  </Label>
                  <Input
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <Separator className="bg-border/30" />

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Digest Frequency
                </Label>
                <p className="text-xs text-muted-foreground">Aggregate notifications into scheduled reports.</p>
                <Select value={digestFrequency} onValueChange={(val: any) => setDigestFrequency(val)}>
                  <SelectTrigger className="h-9 text-sm shadow-none">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    <SelectItem value="realtime">Deliver instantly</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Muted Subsystems Card */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Module Notifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Toggle notifications for specific business modules.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {availableModules.length - disabledModules.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableModules.map((mod) => {
                  const isMuted = disabledModules.includes(mod.key);
                  return (
                    <div 
                      key={mod.key} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all",
                        isMuted 
                          ? "border-border/20 bg-muted/10 opacity-60" 
                          : "border-border/30 bg-card hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isMuted ? "bg-muted/30" : "bg-primary/10", mod.color)}>
                          {mod.icon}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold">{mod.label}</span>
                          <p className="text-xs text-muted-foreground">{mod.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={!isMuted}
                        onCheckedChange={() => toggleModule(mod.key)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Width: Muted Categories Card */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Event Categories
              </CardTitle>
              <CardDescription className="text-xs">
                Silence notifications by event types (e.g. comments, assignments).
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {availableCategories.length - disabledCategories.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {availableCategories.map((cat) => {
              const isMuted = disabledCategories.includes(cat.key);
              return (
                <div 
                  key={cat.key} 
                  className={cn(
                    "flex flex-col gap-2 p-3 rounded-lg border transition-all",
                    isMuted 
                      ? "border-border/20 bg-muted/10 opacity-60" 
                      : "border-border/30 bg-card hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isMuted ? "bg-muted/30" : "bg-primary/10", "text-primary")}>
                      {cat.icon}
                    </div>
                    <Switch
                      checked={!isMuted}
                      onCheckedChange={() => toggleCategory(cat.key)}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold">{cat.label}</span>
                    <p className="text-[10px] text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Changes will apply to your account immediately after saving.
        </p>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="gap-2 h-9 text-sm"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
