import API_BASE_URL from './apiConfig';

const ACCESS_TOKEN_KEY = 'timegen_access_token';

export interface Feature {
  code: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PermissionGrant {
  id: string;
  school_id: string;
  grantee_id: string;
  feature_code: string;
  granted_by_id: string | null;
  parent_grant_id: string | null;
  is_active: boolean;
  granted_at: string;
  revoked_at: string | null;
}

function getToken(): string {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!token) {
    throw new Error('You are not authenticated.');
  }

  return token;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function getFeatures(): Promise<Feature[]> {
  return apiRequest<Feature[]>('/admin/features');
}

export async function getUserPermissions(
  userId: string
): Promise<PermissionGrant[]> {
  return apiRequest<PermissionGrant[]>(
    `/admin/permissions?user_id=${encodeURIComponent(userId)}`
  );
}

export async function grantPermission(
  granteeId: string,
  featureCode: string
): Promise<PermissionGrant> {
  return apiRequest<PermissionGrant>('/admin/permissions/grant', {
    method: 'POST',
    body: JSON.stringify({
      grantee_id: granteeId,
      feature_code: featureCode,
    }),
  });
}

export async function revokePermission(
  grantId: string
): Promise<void> {
  await apiRequest<void>(
    `/admin/permissions/${encodeURIComponent(grantId)}/revoke`,
    {
      method: 'POST',
    }
  );
}
