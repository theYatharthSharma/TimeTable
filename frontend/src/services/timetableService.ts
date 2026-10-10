import {
  TimetableEntry,
  TimetableConflict,
  DayOfWeek,
  GenerationConfig,
} from '../types';

import { authService } from './authService';

import API_BASE_URL from './apiConfig';

const getAuthToken = (): string | null => {
  /*
   * Your existing authService may use a different localStorage key.
   * For now we support the common keys used by the frontend.
   */
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('timegen_access_token') ||
    localStorage.getItem('token')
  );
};


const getSchoolId = (): string | null => {
  return authService.getSchoolId();
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === 'string') {
        message = errorData.detail;
      } else if (Array.isArray(errorData?.detail)) {
        message = errorData.detail
          .map((item: any) => item.msg || JSON.stringify(item))
          .join(', ');
      }
    } catch {
      // Keep default error message
    }

    throw new Error(message);
  }

  return response.json();
};

const requireSchoolId = (): string => {
  const schoolId = getSchoolId();

  if (!schoolId) {
    throw new Error(
      'No school is selected. Please log in again or select a school.'
    );
  }

  return schoolId;
};

/*
 * Convert backend timetable entry into the frontend shape.
 *
 * Backend:
 *   day = "MONDAY"
 *
 * Frontend:
 *   day = "Monday"
 */
const normalizeDay = (day: string): DayOfWeek => {
  const normalized = day.toLowerCase();

  return (
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1)
  ) as DayOfWeek;
};

const mapBackendEntry = (entry: any): TimetableEntry => {
  return {
    id: entry.id,
    standardId: entry.standard_id,
    sectionId: entry.section_id,
    day: normalizeDay(entry.day),
    period: entry.period,
    subjectId: entry.subject_id,
    teacherId: entry.teacher_id,
  };
};

export const timetableService = {

  /**
   * Get the complete timetable from FastAPI.
   */
  async getEntries(): Promise<TimetableEntry[]> {
    const schoolId = requireSchoolId();

    const entries = await apiRequest<any[]>(
      `/timetable?school_id=${schoolId}`
    );

    return entries.map(mapBackendEntry);
  },

  /**
   * Kept for compatibility with existing components.
   *
   * Timetable persistence is now handled by PostgreSQL,
   * not localStorage.
   */
  async saveEntries(entries: TimetableEntry[]): Promise<void> {
    console.warn(
      'saveEntries() is no longer used for bulk persistence. ' +
      'Use the backend timetable API instead.',
      entries
    );
  },

  async getEntriesForSection(
    sectionId: string
  ): Promise<TimetableEntry[]> {
    const entries = await this.getEntries();

    return entries.filter(
      entry => entry.sectionId === sectionId
    );
  },

  async getEntriesForTeacher(
    teacherId: string
  ): Promise<TimetableEntry[]> {
    const entries = await this.getEntries();

    return entries.filter(
      entry => entry.teacherId === teacherId
    );
  },

  async getEntry(
    sectionId: string,
    day: DayOfWeek,
    period: number
  ): Promise<TimetableEntry | undefined> {
    const entries = await this.getEntries();

    return entries.find(
      entry =>
        entry.sectionId === sectionId &&
        entry.day === day &&
        entry.period === period
    );
  },

  /**
   * Update a single timetable slot through FastAPI.
   */
  async updateEntry(
    sectionId: string,
    day: DayOfWeek,
    period: number,
    newSubjectId: string,
    newTeacherId: string
  ): Promise<{
    success: boolean;
    entry?: TimetableEntry;
    conflict?: TimetableConflict;
  }> {
    const schoolId = requireSchoolId();

    try {
      const result = await apiRequest<any>(
        `/timetable/${sectionId}/${day}/${period}?school_id=${schoolId}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            subject_id: newSubjectId,
            teacher_id: newTeacherId,
          }),
        }
      );

      return {
        success: true,
        entry: mapBackendEntry(result),
      };
    } catch (error) {
      return {
        success: false,
        conflict: {
          id: `conf_${Date.now()}`,
          type: 'teacher_double_booking',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to update timetable entry.',
          severity: 'error',
          day,
          period,
          teacherId: newTeacherId,
          sectionId,
        },
      };
    }
  },

  /**
   * Check a proposed teacher assignment.
   *
   * The backend currently performs validation when the actual
   * timetable update is submitted. Therefore this method is
   * retained for UI compatibility and performs a lightweight
   * local check against the current backend timetable.
   */
  async checkProposedConflict(
    sectionId: string,
    day: DayOfWeek,
    period: number,
    teacherId: string
  ): Promise<TimetableConflict | null> {
    const entries = await this.getEntries();

    const doubleBooked = entries.find(
      entry =>
        entry.teacherId === teacherId &&
        entry.day === day &&
        entry.period === period &&
        entry.sectionId !== sectionId
    );

    if (doubleBooked) {
      return {
        id: `conf_${Date.now()}`,
        type: 'teacher_double_booking',
        message:
          `Selected teacher is already assigned during ` +
          `Period ${period} on ${day}.`,
        severity: 'error',
        day,
        period,
        teacherId,
        sectionId,
      };
    }

    return null;
  },

  /**
   * Generate timetable through the real backend solver.
   */
  async generateTimetable(
    config: GenerationConfig
  ): Promise<TimetableEntry[]> {
    const schoolId = requireSchoolId();

    const result = await apiRequest<any[]>(
      `/timetable/generate?school_id=${schoolId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          scope: config.scope,
          target_standard_id:
            config.targetStandardId || null,
          target_section_id:
            config.targetSectionId || null,
          custom_ai_constraints:
            config.customAiConstraints || [],
        }),
      }
    );

    return result.map(mapBackendEntry);
  },

  /**
   * Timetable reset is no longer a localStorage operation.
   *
   * The backend does not currently expose a reset endpoint,
   * so we deliberately don't fake one here.
   */
  async resetTimetable(): Promise<TimetableEntry[]> {
    throw new Error(
      'Timetable reset is not available from the backend yet.'
    );
  },
};
