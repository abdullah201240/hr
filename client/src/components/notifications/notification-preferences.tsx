import { useState, useEffect } from 'react';
import { usePreferencesQuery, useUpdatePreferencesMutation } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, BellRing, VolumeX, Mail, AppWindow } from 'lucide-react';
import type { NotificationModule, NotificationCategory } from '@/types/notifications';

export function NotificationPreferences() {
  const { data: preferences, isLoading } = usePreferencesQuery();
  const updateMutation = useUpdatePreferencesMutation();

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [digestFrequency, setDigestFrequency] = useState<'realtime' | 'hourly' | 'daily'>('realtime');
  const [disabledModules, setDisabledModules] = useState<NotificationModule[]>([]);
  const [disabledCategories, setDisabledCategories] = useState<NotificationCategory[]>([]);

  // Sync state with fetched preferences data
  useEffect(() => {
    if (preferences) {
      setEmailEnabled(preferences.emailEnabled);
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
      emailEnabled,
      pushEnabled,
      quietHoursStart,
      quietHoursEnd,
      digestFrequency,
      disabledModules,
      disabledCategories,
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

  // Modules list
  const availableModules: { key: NotificationModule; label: string }[] = [
    { key: 'leave', label: 'Leave Management' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'tasks', label: 'Tasks Management' },
    { key: 'payroll', label: 'Salary & Payroll' },
    { key: 'claims', label: 'Claims & Reimbursement' },
    { key: 'recruitment', label: 'Recruitment' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'performance', label: 'KPI & Performance' },
    { key: 'disciplinary', label: 'Disciplinary' },
    { key: 'separation', label: 'Separation' },
  ];

  // Categories list
  const availableCategories: { key: NotificationCategory; label: string }[] = [
    { key: 'approval', label: 'Approval Requests' },
    { key: 'rejection', label: 'Rejection Alerts' },
    { key: 'assignment', label: 'Task Assignments' },
    { key: 'mention', label: 'User @Mentions' },
    { key: 'reminder', label: 'Deadlines & Reminders' },
    { key: 'status_change', label: 'Status Updates' },
    { key: 'comment', label: 'New Comments' },
    { key: 'broadcast', label: 'Admin Broadcasts' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Channels Card */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BellRing className="h-4.5 w-4.5 text-primary" />
            Notification Delivery Channels
          </CardTitle>
          <CardDescription className="text-xs">
            Choose how you would like to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Alerts
              </Label>
              <p className="text-[10px] text-muted-foreground">Receive daily summaries or critical alerts via email.</p>
            </div>
            <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <AppWindow className="h-3.5 w-3.5 text-muted-foreground" />
                Browser Push Notifications
              </Label>
              <p className="text-[10px] text-muted-foreground">Receive real-time popups while using the application.</p>
            </div>
            <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours & Digest Card */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <VolumeX className="h-4.5 w-4.5 text-primary" />
            Do Not Disturb & Digests
          </CardTitle>
          <CardDescription className="text-xs">
            Mute sound/real-time push during quiet hours and configure digests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Quiet Hours Start</Label>
              <Input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Quiet Hours End</Label>
              <Input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/20">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Digest Frequency</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Aggregate notifications into a single report rather than sending them one-by-one.</p>
            <Select value={digestFrequency} onValueChange={(val: any) => setDigestFrequency(val)}>
              <SelectTrigger className="h-9 text-xs max-w-xs shadow-none">
                <SelectValue placeholder="Select digest frequency" />
              </SelectTrigger>
              <SelectContent className="text-xs">
                <SelectItem value="realtime">Deliver instantly</SelectItem>
                <SelectItem value="hourly">Hourly Digest</SelectItem>
                <SelectItem value="daily">Daily Digest Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Muted Subsystems Card */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-bold">Mute Specific Modules</CardTitle>
          <CardDescription className="text-xs">
            Turn off notifications for specific business modules you do not follow.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableModules.map((mod) => {
              const isMuted = disabledModules.includes(mod.key);
              return (
                <div key={mod.key} className="flex items-center justify-between p-2 rounded-lg border border-border/20 bg-muted/10">
                  <span className="text-xs font-medium">{mod.label}</span>
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

      {/* Muted Categories Card */}
      <Card className="border-border/40 shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base font-bold">Mute Categories</CardTitle>
          <CardDescription className="text-xs">
            Silence notifications by event types (e.g. comments, assignments).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableCategories.map((cat) => {
              const isMuted = disabledCategories.includes(cat.key);
              return (
                <div key={cat.key} className="flex items-center justify-between p-2 rounded-lg border border-border/20 bg-muted/10">
                  <span className="text-xs font-medium">{cat.label}</span>
                  <Switch
                    checked={!isMuted}
                    onCheckedChange={() => toggleCategory(cat.key)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="gap-2 h-9 text-xs"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Notification Preferences
        </Button>
      </div>
    </div>
  );
}
