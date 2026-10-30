
import type { Standard, Section } from '../types';
import API_BASE_URL from './apiConfig';
import { authenticatedFetch } from './authenticatedFetch';
import { authService } from './authService';

interface BackendStandard {
  id: string;
  level: number;
  name: string;
}

interface BackendSection {
  id: string;
  standard_id: string;
  name: string;
  room_number?: string | null;
}

function getSchoolId(): string {
  const user = authService.getCurrentUser();

  if (!user) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  // Admins must explicitly select a school.
  const schoolId =
    user.role === 'admin'
      ? localStorage.getItem('timegen_selected_school_id')
      : authService.getSchoolId();

  if (!schoolId) {
    throw new Error(
      user.role === 'admin'
        ? 'Please select a school before managing academic structure.'
        : 'Your account is not assigned to a school.'
    );
  }

  return schoolId;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authService.getAccessToken();

  if (!token) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  // Include the selected school in the query string because
  // get_scoped_school_id reads school_id as a query parameter.
  const separator = endpoint.includes('?') ? '&' : '?';
  const url =
    `${API_BASE_URL}${endpoint}${separator}` +
    `school_id=${encodeURIComponent(getSchoolId())}`;

  const response = await authenticatedFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const data = await response.json();

      if (typeof data?.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // Keep the fallback error.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function mapStandard(item: BackendStandard): Standard {
  return {
    id: item.id,
    level: item.level,
    name: item.name,
  };
}

function mapSection(item: BackendSection): Section {
  return {
    id: item.id,
    standardId: item.standard_id,
    name: item.name,
    roomNumber: item.room_number ?? undefined,
    assignedSubjectIds: [],
    assignedTeacherIds: [],
  };
}

export const sectionService = {
  async getStandards(): Promise<Standard[]> {
    const items = await apiRequest<BackendStandard[]>(
      '/academic/standards'
    );

    return items.map(mapStandard);
  },

  async getSections(standardId?: string): Promise<Section[]> {
    const query = standardId
      ? `?standard_id=${encodeURIComponent(standardId)}`
      : '';

    const items = await apiRequest<BackendSection[]>(
      `/academic/sections${query}`
    );

    return items.map(mapSection);
  },

  async addStandard(
    level: number,
    name?: string
  ): Promise<Standard> {
    const item = await apiRequest<BackendStandard>(
      '/academic/standards',
      {
        method: 'POST',
        body: JSON.stringify({
          level,
          name: name?.trim() || `Standard ${level}`,
        }),
      }
    );

    return mapStandard(item);
  },

  async deleteStandard(id: string): Promise<void> {
    await apiRequest<void>(`/academic/standards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async addSection(
    standardId: string,
    sectionLetter: string,
    roomNumber?: string
  ): Promise<Section> {
    const name = sectionLetter.trim().toUpperCase();

    if (!name) {
      throw new Error('Section name is required.');
    }

    const item = await apiRequest<BackendSection>(
      '/academic/sections',
      {
        method: 'POST',
        body: JSON.stringify({
          standard_id: standardId,
          name,
          room_number: roomNumber?.trim() || null,
        }),
      }
    );

    return mapSection(item);
  },

  async updateSection(
    id: string,
    updates: { name?: string; roomNumber?: string }
  ): Promise<Section> {
    const item = await apiRequest<BackendSection>(
      `/academic/sections/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name: updates.name,
          room_number: updates.roomNumber,
        }),
      }
    );

    return mapSection(item);
  },

  async deleteSection(id: string): Promise<void> {
    await apiRequest<void>(
      `/academic/sections/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    );
  },
};
