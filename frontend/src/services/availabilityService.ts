import type { TeacherAvailability } from '../types';
import { schoolRequest } from './schoolApi';

interface BackendAvailability { teacher_id: string; max_periods_per_day: number; schedule: Record<string, Record<string, boolean>>; }
function mapAvailability(value: BackendAvailability): TeacherAvailability {
  return { teacherId: value.teacher_id, maxPeriodsPerDay: value.max_periods_per_day, schedule: value.schedule as TeacherAvailability['schedule'] };
}
export const availabilityService = {
  async getTeacherAvailability(teacherId: string): Promise<TeacherAvailability> {
    const value = await schoolRequest<BackendAvailability>(`/availability/${encodeURIComponent(teacherId)}`);
    return mapAvailability(value);
  },
  async updateAvailability(value: TeacherAvailability): Promise<TeacherAvailability> {
    const saved = await schoolRequest<BackendAvailability>(`/availability/${encodeURIComponent(value.teacherId)}`, {
      method: 'PUT', body: JSON.stringify({ schedule: value.schedule, max_periods_per_day: value.maxPeriodsPerDay }),
    });
    return mapAvailability(saved);
  },
};
