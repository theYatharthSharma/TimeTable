import { User, UserRole } from '../types';

import API_BASE_URL from './apiConfig';

const CURRENT_USER_KEY = 'timegen_current_user';
const ACCESS_TOKEN_KEY = 'timegen_access_token';
const REFRESH_TOKEN_KEY = 'timegen_refresh_token';
const SCHOOL_ID_KEY = 'timegen_school_id';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface BackendUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  school_id?: string | null;
  teacher_profile_id?: string | null;
}

const mapRole = (role: string): UserRole => {
  const normalized = role.toUpperCase();

  switch (normalized) {
    case 'PRINCIPAL':
      return 'principal';

    case 'TEACHER':
      return 'teacher';

    case 'ADMIN':
    default:
      return 'admin';
  }
};

const mapUser = (user: BackendUser): User => {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: mapRole(user.role),

    // Temporary static name until /settings is connected.
    schoolName: 'TimeGen Demo School',

    ...(user.school_id
      ? {
          schoolId: user.school_id,
        }
      : {}),

    ...(user.teacher_profile_id
      ? {
          teacherId: user.teacher_profile_id,
        }
      : {}),
  };
};

export const authService = {
  /**
   * Get the currently authenticated user
   * stored in localStorage.
   */
  getCurrentUser(): User | null {
    const saved = localStorage.getItem(CURRENT_USER_KEY);

    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved) as User;
    } catch {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  },

  /**
   * Get the current access token.
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  /**
   * Get the current refresh token.
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Get the currently selected school.
   *
   * Prefer the authenticated user's schoolId,
   * then fall back to the stored school ID.
   */
  getSchoolId(): string | null {
    const currentUser = this.getCurrentUser();

    if (currentUser?.schoolId) {
      return currentUser.schoolId;
    }

    return localStorage.getItem(SCHOOL_ID_KEY);
  },

  /**
   * Check whether an access token exists.
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  /**
   * Login against the real FastAPI backend.
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        return {
          success: false,
          error: 'Email is required.',
        };
      }

      if (!password) {
        return {
          success: false,
          error: 'Password is required.',
        };
      }

      /*
       * FastAPI OAuth2PasswordRequestForm expects
       * application/x-www-form-urlencoded.
       */
      const body = new URLSearchParams();

      body.append('username', trimmedEmail);
      body.append('password', password);

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Login failed.';

        try {
          const errorData = await response.json();

          if (typeof errorData?.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData?.detail)) {
            errorMessage = errorData.detail
              .map(
                (item: { msg?: string }) =>
                  item.msg || 'Invalid login request.'
              )
              .join(', ');
          }
        } catch {
          // Keep default error message.
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const loginData =
        (await response.json()) as LoginResponse;

      /*
       * Store authentication tokens.
       */
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        loginData.access_token
      );

      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        loginData.refresh_token
      );

      /*
       * Fetch the authenticated user from FastAPI.
       */
      const meResponse = await fetch(
        `${API_BASE_URL}/auth/me`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${loginData.access_token}`,
          },
        }
      );

      if (!meResponse.ok) {
        /*
         * Login succeeded, but /auth/me failed.
         * Don't leave half-authenticated state behind.
         */
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);

        throw new Error(
          'Login succeeded, but user information could not be loaded.'
        );
      }

      const backendUser =
        (await meResponse.json()) as BackendUser;

      const user = mapUser(backendUser);

      /*
       * Store current user.
       */
      this.setCurrentUser(user);

      /*
       * Store school ID separately as well.
       */
      if (backendUser.school_id) {
        localStorage.setItem(
          SCHOOL_ID_KEY,
          backendUser.school_id
        );
      } else {
        localStorage.removeItem(SCHOOL_ID_KEY);
      }

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to connect to the backend.',
      };
    }
  },

  /**
   * Store current user.
   */
  setCurrentUser(user: User): void {
    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify(user)
    );
  },

  /**
   * Temporary compatibility method.
   *
   * This no longer changes the authenticated user.
   * Real authentication must happen through login().
   */
  loginAs(role: UserRole): User | null {
    console.warn(
      `loginAs(${role}) is deprecated. ` +
      'Use authService.login(email, password) instead.'
    );

    const currentUser = this.getCurrentUser();

    if (!currentUser) {
      return null;
    }

    /*
     * Don't fake a different backend identity.
     */
    if (currentUser.role !== role) {
      console.warn(
        `Current authenticated user is ${currentUser.role}, ` +
        `not ${role}.`
      );
    }

    return currentUser;
  },

  /**
   * Update locally stored profile information.
   */
  updateProfile(updates: Partial<User>): User {
    const current = this.getCurrentUser();

    if (!current) {
      throw new Error('No authenticated user.');
    }

    const updated: User = {
      ...current,
      ...updates,
    };

    this.setCurrentUser(updated);

    return updated;
  },

  /**
   * Logout.
   */
  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SCHOOL_ID_KEY);
  },
};
