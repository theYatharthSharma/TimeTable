import API_BASE_URL from './apiConfig';
import { authenticatedFetch } from './authenticatedFetch';
import { authService } from './authService';

export function getActiveSchoolId(): string {
  const user = authService.getCurrentUser();
  if (!user) throw new Error('You are not authenticated. Please log in again.');
  const schoolId = user.role === 'admin'
    ? localStorage.getItem('timegen_selected_school_id')
    : authService.getSchoolId();
  if (!schoolId) {
    throw new Error(user.role === 'admin'
      ? 'Select a school from the school selector before continuing.'
      : 'Your account is not assigned to a school.');
  }
  return schoolId;
}

export async function schoolRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authService.getAccessToken();
  if (!token) throw new Error('You are not authenticated. Please log in again.');
  const separator = path.includes('?') ? '&' : '?';
  const url = `${API_BASE_URL}${path}${separator}school_id=${encodeURIComponent(getActiveSchoolId())}`;
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await authenticatedFetch(url, { ...init, headers });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === 'string') message = payload.detail;
      else if (Array.isArray(payload?.detail)) message = payload.detail.map((x: {msg?: string}) => x.msg ?? 'Invalid request').join(', ');
    } catch { /* use fallback */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
