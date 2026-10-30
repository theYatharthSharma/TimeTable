import type { Teacher, DayOfWeek } from '../types';
import { getActiveSchoolId, schoolRequest } from './schoolApi';
import { authService } from './authService';

interface BackendTeacher {
  id: string; name: string; email: string; phone?: string | null;
  max_periods_per_day: number; working_days: string[];
  standard_ids?: string[]; subject_ids?: string[]; section_ids?: string[];
}

function mapTeacher(value: BackendTeacher): Teacher {
  return {
    id: value.id,
    name: value.name,
    email: value.email,
    phone: value.phone ?? undefined,
    standardIds: value.standard_ids ?? [],
    subjectIds: value.subject_ids ?? [],
    sectionIds: value.section_ids ?? [],
    workingDays: (value.working_days ?? []) as DayOfWeek[],
    maxPeriodsPerDay: value.max_periods_per_day,
  };
}

export const teacherService = {
  async getTeachers(): Promise<Teacher[]> {
    const data = await schoolRequest<BackendTeacher[]>('/teachers');
    if (!Array.isArray(data)) throw new Error('Teachers API did not return a list.');
    return data.map(mapTeacher);
  },
  async addTeacher(input: Omit<Teacher, 'id'> & { password?: string }): Promise<Teacher> {
    const currentUser = authService.getCurrentUser();

    // The master Admin creates the teacher profile and login together.
    // Principals retain the existing profile-only endpoint and workflow.
    if (currentUser?.role === 'admin') {
      if (!input.password || input.password.length < 8) {
        throw new Error('Set a teacher password with at least 8 characters.');
      }

      await schoolRequest<unknown>('/admin/teachers', {
        method: 'POST',
        body: JSON.stringify({
          school_id: getActiveSchoolId(),
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone ?? null,
          password: input.password,
          max_periods_per_day: input.maxPeriodsPerDay,
          working_days: input.workingDays,
          standard_ids: input.standardIds,
          subject_ids: input.subjectIds,
          section_ids: input.sectionIds,
        }),
      });

      // The combined endpoint returns the login account (UserOut), not TeacherOut.
      // Reload the school-scoped teacher list to return the newly created profile.
      const teachers = await this.getTeachers();
      const createdTeacher = teachers.find(
        teacher => teacher.email.toLowerCase() === input.email.trim().toLowerCase(),
      );
      if (!createdTeacher) {
        throw new Error('Teacher account was created, but the teacher profile could not be reloaded. Refresh the page and check the teacher list.');
      }
      return createdTeacher;
    }

    const created = await schoolRequest<BackendTeacher>('/teachers', {
      method: 'POST', body: JSON.stringify({
        name: input.name.trim(), email: input.email.trim(), phone: input.phone ?? null,
        max_periods_per_day: input.maxPeriodsPerDay, working_days: input.workingDays,
        standard_ids: input.standardIds, subject_ids: input.subjectIds, section_ids: input.sectionIds,
      }),
    });
    return mapTeacher(created);
  },
  async updateTeacher(id: string, input: Partial<Teacher>): Promise<Teacher> {
    const updated = await schoolRequest<BackendTeacher>(`/teachers/${encodeURIComponent(id)}`, {
      method: 'PATCH', body: JSON.stringify({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.email !== undefined ? { email: input.email.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.maxPeriodsPerDay !== undefined ? { max_periods_per_day: input.maxPeriodsPerDay } : {}),
        ...(input.workingDays !== undefined ? { working_days: input.workingDays } : {}),
        ...(input.standardIds !== undefined ? { standard_ids: input.standardIds } : {}),
        ...(input.subjectIds !== undefined ? { subject_ids: input.subjectIds } : {}),
        ...(input.sectionIds !== undefined ? { section_ids: input.sectionIds } : {}),
      }),
    });
    return mapTeacher(updated);
  },
  async deleteTeacher(id: string): Promise<void> {
    await schoolRequest<void>(`/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
