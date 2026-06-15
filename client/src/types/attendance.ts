export interface AttendanceSettings {
  id: string;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  lateThreshold: number;
  halfDayThreshold: number;
  weeklyHolidays: string[];
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAttendanceSettingsPayload {
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  lateThreshold?: number;
  halfDayThreshold?: number;
  weeklyHolidays?: string[];
}

export interface CreateHolidayPayload {
  name: string;
  startDate: string;
  endDate: string;
}

export interface UpdateHolidayPayload {
  name?: string;
  startDate?: string;
  endDate?: string;
}
