import {
  Calendar,
  Clock,
  CheckSquare,
  DollarSign,
  Receipt,
  UserPlus,
  Megaphone,
  TrendingUp,
  AlertTriangle,
  LogOut,
  Bell,
} from 'lucide-react';
import type { NotificationModule } from '@/types/notifications';

interface NotificationIconProps {
  module: NotificationModule;
  className?: string;
}

export function NotificationIcon({ module, className = 'h-5 w-5' }: NotificationIconProps) {
  switch (module) {
    case 'leave':
      return <Calendar className={`${className} text-blue-500`} />;
    case 'attendance':
      return <Clock className={`${className} text-emerald-500`} />;
    case 'tasks':
      return <CheckSquare className={`${className} text-indigo-500`} />;
    case 'payroll':
      return <DollarSign className={`${className} text-green-500`} />;
    case 'claims':
      return <Receipt className={`${className} text-amber-500`} />;
    case 'recruitment':
      return <UserPlus className={`${className} text-teal-500`} />;
    case 'announcements':
      return <Megaphone className={`${className} text-purple-500`} />;
    case 'performance':
      return <TrendingUp className={`${className} text-pink-500`} />;
    case 'disciplinary':
      return <AlertTriangle className={`${className} text-red-500`} />;
    case 'separation':
      return <LogOut className={`${className} text-slate-500`} />;
    default:
      return <Bell className={`${className} text-slate-400`} />;
  }
}
