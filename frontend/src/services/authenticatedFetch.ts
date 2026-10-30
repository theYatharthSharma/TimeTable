import API_BASE_URL from './apiConfig';

const ACCESS_TOKEN_KEY = 'timegen_access_token';
const REFRESH_TOKEN_KEY = 'timegen_refresh_token';
const CURRENT_USER_KEY = 'timegen_current_user';

let refreshInFlight: Promise<boolean> | null = null;

function endSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    // Keep the admin's selected school; it is a UI preference, not a credential.
    window.dispatchEvent(new Event('timegen:session-expired'));
}

async function refreshAccessToken(): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!response.ok) return false;

            const tokens = await response.json() as {
                access_token?: string;
                refresh_token?: string;
            };
            if (!tokens.access_token || !tokens.refresh_token) return false;

            localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
            localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
            return true;
        } catch {
            return false;
        }
    })();

    try {
        return await refreshInFlight;
    } finally {
        refreshInFlight = null;
    }
}

/**
 * Fetch an API endpoint with automatic one-time access-token refresh on 401.
 * The request body should be replayable (the app's JSON/string bodies are).
 */
export async function authenticatedFetch(
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> {
    const url = input instanceof Request ? input.url : String(input);
    const requestHeaders = new Headers(
        input instanceof Request ? input.headers : undefined
    );
    new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));

    const send = (token: string | null) => {
        const headers = new Headers(requestHeaders);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        else headers.delete('Authorization');
        return fetch(input, { ...init, headers });
    };

    const firstResponse = await send(localStorage.getItem(ACCESS_TOKEN_KEY));
    if (firstResponse.status !== 401 || /\/auth\/(login|refresh)(?:\?|$)/.test(url)) {
        return firstResponse;
    }

    const refreshed = await refreshAccessToken();
    if (!refreshed) {
        endSession();
        return firstResponse;
    }

    const retryResponse = await send(localStorage.getItem(ACCESS_TOKEN_KEY));
    if (retryResponse.status === 401) endSession();
    return retryResponse;
}
