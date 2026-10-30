import type { SchoolSettings } from '../types';
import { schoolRequest } from './schoolApi';

interface BackendSchoolSettings {
  id: string; name: string; academic_year: string; working_days: string[];
  periods_per_day: number; period_duration_min: number; start_time: string;
}
const mapSettings = (s: BackendSchoolSettings): SchoolSettings => ({
  schoolName: s.name, academicYear: s.academic_year,
  workingDays: s.working_days as SchoolSettings['workingDays'],
  periodsPerDay: s.periods_per_day, periodDurationMin: s.period_duration_min,
  startTime: s.start_time,
});
export const settingsService = {
  async getSettings(): Promise<SchoolSettings> {
    return mapSettings(await schoolRequest<BackendSchoolSettings>('/settings'));
  },
  async updateSettings(updates: SchoolSettings): Promise<SchoolSettings> {
    const saved = await schoolRequest<BackendSchoolSettings>('/settings', {
      method: 'PATCH', body: JSON.stringify({
        name: updates.schoolName, academic_year: updates.academicYear,
        working_days: updates.workingDays, periods_per_day: updates.periodsPerDay,
        period_duration_min: updates.periodDurationMin, start_time: updates.startTime,
      }),
    });
    return mapSettings(saved);
  },
};
