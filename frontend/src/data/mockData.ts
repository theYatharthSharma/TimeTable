import type { DayOfWeek, PeriodSlot } from '../types';

// Static UI vocabulary only. These are not school records and are never persisted as academic data.
export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Display fallback labels for the timetable grid. School settings control period count and start time in the database.
export const PERIOD_SLOTS: PeriodSlot[] = [
  { periodNumber: 1, label: 'Period 1', startTime: '', endTime: '' },
  { periodNumber: 2, label: 'Period 2', startTime: '', endTime: '' },
  { periodNumber: 3, label: 'Period 3', startTime: '', endTime: '' },
  { periodNumber: 4, label: 'Period 4', startTime: '', endTime: '' },
  { periodNumber: 5, label: 'Period 5', startTime: '', endTime: '' },
  { periodNumber: 6, label: 'Period 6', startTime: '', endTime: '' },
];
