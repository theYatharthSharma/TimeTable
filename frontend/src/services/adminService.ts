import API_BASE_URL from './apiConfig';
import { authenticatedFetch } from './authenticatedFetch';

const ACCESS_TOKEN_KEY = 'timegen_access_token';

export interface Principal {
  id: string;
  full_name: string;
  email: string;
  role: 'principal';
  school_id: string | null;
  teacher_profile_id?: string | null;
  is_active: boolean;
}

export interface School {
  id: string;
  name: string;
  academic_year: string;
  working_days: string[];
  periods_per_day: number;
  period_duration_min: number;
  start_time: string;
}

export interface CreateSchoolRequest {
  name: string;
  academic_year?: string;
  working_days?: string[];
  periods_per_day?: number;
  period_duration_min?: number;
  start_time?: string;
}

export interface CreatePrincipalRequest {
  full_name: string;
  email: string;
  password: string;
  school_id: string;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(
    ACCESS_TOKEN_KEY
  );

  if (!token) {
    throw new Error('You are not authenticated.');
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    let message =
      `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // Keep default error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function getPrincipals(): Promise<Principal[]> {
  return apiRequest<Principal[]>(
    '/admin/principals'
  );
}

export async function getSchools(): Promise<School[]> {
  return apiRequest<School[]>('/admin/schools');
}

export async function createPrincipal(
  data: CreatePrincipalRequest
): Promise<Principal> {
  return apiRequest<Principal>(
    '/admin/principals',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function createSchool(data: CreateSchoolRequest): Promise<School> {
  return apiRequest<School>('/admin/schools', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSchool(schoolId: string): Promise<void> {
  await apiRequest<void>(`/admin/schools/${encodeURIComponent(schoolId)}`, {
    method: 'DELETE',
  });
}

export async function deactivatePrincipal(
  principalId: string
): Promise<void> {
  await apiRequest<void>(
    `/admin/principals/${encodeURIComponent(principalId)}/deactivate`,
    {
      method: 'PATCH',
    }
  );
}

export async function reactivatePrincipal(
  principalId: string
): Promise<void> {
  await apiRequest<void>(
    `/admin/principals/${encodeURIComponent(principalId)}/reactivate`,
    { method: 'PATCH' }
  );
}

export async function deletePrincipal(
  principalId: string
): Promise<void> {
  await apiRequest<void>(
    `/admin/principals/${encodeURIComponent(principalId)}`,
    { method: 'DELETE' }
  );
}
