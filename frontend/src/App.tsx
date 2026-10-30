import React, { useEffect, useState } from 'react';
import { User } from './types';
import { authService } from './services/authService';
import { AppLayout } from './components/layout/AppLayout';

import {
  ToastContainer,
  ToastMessage,
} from './components/common/Toast';

import { ErrorPage } from './components/common/ErrorPage';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TeachersPage } from './pages/TeachersPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ClassesSectionsPage } from './pages/ClassesSectionsPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { GenerateTimetablePage } from './pages/GenerateTimetablePage';
import { TimetableViewPage } from './pages/TimetableViewPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TeacherClassesPage } from './pages/TeacherClassesPage';
import { TeacherLeavePage } from './pages/TeacherLeavePage';
import { TeacherSwapsPage } from './pages/TeacherSwapsPage';
import { TeacherAvailabilityPage } from './pages/TeacherAvailabilityPage';
import PermissionsPage from './pages/PermissionsPage';
import SchoolsPage from './pages/SchoolsPage';
import { getSchools, type School } from './services/adminService';

/*
 * Pages currently supported by the application.
 *
 * If currentPage somehow contains another value,
 * the 404 page will be displayed instead of a blank screen.
 */
const VALID_PAGES = [
  'dashboard',
  'timetable',
  'teachers',
  'subjects',
  'classes',
  'availability',
  'generate',
  'leave-requests',
  'notifications',
  'my-classes',
  'my-availability',
  'teacher-leave',
  'swaps',
  'permissions',
  'schools',
  'profile',
  'settings',
];

export default function App() {
  /*
   * Restore authenticated user from localStorage.
   */
  const [currentUser, setCurrentUser] =
    useState<User | null>(() => {
      const user = authService.getCurrentUser();

      if (!user || !authService.isAuthenticated()) {
        return null;
      }

      return user;
    });

  /*
   * Current application page.
   */
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setCurrentPage('dashboard');
      setLoginError('Your session expired. Please sign in again.');
    };
    window.addEventListener('timegen:session-expired', handleSessionExpired);
    return () => window.removeEventListener('timegen:session-expired', handleSessionExpired);
  }, []);

  const [currentPage, setCurrentPage] =
    useState<string>('dashboard');

  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(() =>
    localStorage.getItem('timegen_selected_school_id') || ''
  );

  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      setSchools([]);
      return;
    }
    getSchools().then((items) => {
      setSchools(items);
      setSelectedSchoolId((current) => {
        const saved = items.some((school) => school.id === current) ? current : (items[0]?.id || '');
        if (saved) localStorage.setItem('timegen_selected_school_id', saved);
        else localStorage.removeItem('timegen_selected_school_id');
        return saved;
      });
    }).catch((error) => console.error('Unable to load schools for selector:', error));
  }, [currentUser]);

  const handleSelectSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    if (schoolId) localStorage.setItem('timegen_selected_school_id', schoolId);
    else localStorage.removeItem('timegen_selected_school_id');
  };

  const refreshSchools = async () => {
    try {
      const items = await getSchools();
      setSchools(items);
      setSelectedSchoolId((current) => {
        const next = items.some((school) => school.id === current) ? current : (items[0]?.id || '');
        if (next) localStorage.setItem('timegen_selected_school_id', next);
        else localStorage.removeItem('timegen_selected_school_id');
        return next;
      });
    } catch (error) {
      console.error('Unable to refresh schools:', error);
    }
  };

  /*
   * Login error shown on LoginPage.
   */
  const [loginError, setLoginError] =
    useState<string>('');

  /*
   * Toast notifications.
   */
  const [toasts, setToasts] =
    useState<ToastMessage[]>([]);

  /*
   * One-time modal triggers.
   */
  const [openAddTeacherOnMount, setOpenAddTeacherOnMount] =
    useState(false);

  const [openAddSubjectOnMount, setOpenAddSubjectOnMount] =
    useState(false);

  const [openAddSectionOnMount, setOpenAddSectionOnMount] =
    useState(false);

  /*
   * Show toast.
   */
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    const id =
      `toast_${Date.now()}_${Math.random()}`;

    setToasts(prev => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      setToasts(prev =>
        prev.filter(toast => toast.id !== id)
      );
    }, 4500);
  };

  /*
   * Dismiss toast.
   */
  const handleDismissToast = (id: string) => {
    setToasts(prev =>
      prev.filter(toast => toast.id !== id)
    );
  };

  /*
   * Real backend login.
   */
  const handleLogin = async (
    email: string,
    password: string
  ) => {
    setLoginError('');

    try {
      const result = await authService.login(
        email,
        password
      );

      if (!result.success || !result.user) {
        setLoginError(
          result.error || 'Login failed.'
        );

        return;
      }

      setCurrentUser(result.user);
      setCurrentPage('dashboard');

      showToast(
        `Signed in as ${result.user.name}`,
        'success'
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to sign in.';

      setLoginError(message);
    }
  };

  /*
   * Logout.
   */
  const handleLogout = () => {
    authService.logout();

    setCurrentUser(null);
    setCurrentPage('dashboard');
    setLoginError('');

    showToast(
      'You have been logged out',
      'info'
    );
  };

  /*
   * Role switching is intentionally disabled.
   *
   * The backend determines the authenticated user's role.
   */
  const handleRoleSwitch = () => {
    showToast(
      'Role switching is disabled. Sign in with the account for the required role.',
      'info'
    );
  };

  /*
   * Navigate between application pages.
   */
  const handleNavigate = (page: string) => {
    /*
     * Reset one-time modal triggers.
     */
    setOpenAddTeacherOnMount(false);
    setOpenAddSubjectOnMount(false);
    setOpenAddSectionOnMount(false);

    setCurrentPage(page);
  };

  /*
   * Quick Action:
   * Open Add Teacher modal.
   */
  const handleOpenAddTeacher = () => {
    setOpenAddTeacherOnMount(true);
    setCurrentPage('teachers');
  };

  /*
   * Quick Action:
   * Open Add Subject modal.
   */
  const handleOpenAddSubject = () => {
    setOpenAddSubjectOnMount(true);
    setCurrentPage('subjects');
  };

  /*
   * Quick Action:
   * Open Add Section modal.
   */
  const handleOpenAddSection = () => {
    setOpenAddSectionOnMount(true);
    setCurrentPage('classes');
  };

  /*
   * -------------------------------------------------------
   * AUTHENTICATION GUARD
   * -------------------------------------------------------
   *
   * If there is no authenticated user,
   * show the login page.
   */
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          loginError={loginError}
        />

        <ToastContainer
          toasts={toasts}
          onDismiss={handleDismissToast}
        />
      </>
    );
  }

  /*
   * -------------------------------------------------------
   * TEACHER PAGE ACCESS GUARD
   * -------------------------------------------------------
   *
   * Teachers can access only their dashboard, own timetable,
   * and profile. Backend authorization remains authoritative.
   */
  if (
    currentUser.role === 'teacher' &&
    !['dashboard', 'timetable', 'profile', 'my-classes', 'my-availability', 'teacher-leave', 'swaps', 'notifications'].includes(currentPage)
  ) {
    return (
      <AppLayout
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        schools={schools}
        selectedSchoolId={selectedSchoolId}
        onSelectSchool={handleSelectSchool}
      >
        <ErrorPage
          type="403"
          title="Access Denied"
          message="This page is not available to teacher accounts."
          onGoHome={() => handleNavigate('dashboard')}
        />
        <ToastContainer
          toasts={toasts}
          onDismiss={handleDismissToast}
        />
      </AppLayout>
    );
  }

  if (
    ['my-classes', 'my-availability', 'teacher-leave', 'swaps'].includes(currentPage) &&
    currentUser.role !== 'teacher'
  ) {
    return (
      <AppLayout currentUser={currentUser} currentPage={currentPage} onNavigate={handleNavigate} onRoleSwitch={handleRoleSwitch} onLogout={handleLogout} schools={schools} selectedSchoolId={selectedSchoolId} onSelectSchool={handleSelectSchool}>
        <ErrorPage type="403" title="Access Denied" message="This page is available to Teacher accounts." onGoHome={() => handleNavigate('dashboard')} />
      </AppLayout>
    );
  }

  if (currentPage === 'leave-requests' && currentUser.role !== 'principal') {
    return (
      <AppLayout currentUser={currentUser} currentPage={currentPage} onNavigate={handleNavigate} onRoleSwitch={handleRoleSwitch} onLogout={handleLogout} schools={schools} selectedSchoolId={selectedSchoolId} onSelectSchool={handleSelectSchool}>
        <ErrorPage type="403" title="Access Denied" message="Leave request management is available to Principal accounts." onGoHome={() => handleNavigate('dashboard')} />
      </AppLayout>
    );
  }



  /*
   * -------------------------------------------------------
   * PAGE ACCESS GUARD
   * -------------------------------------------------------
   *
   * Permissions page is an ADMIN-only page.
   *
   * Even if someone manually sets:
   *
   * currentPage = "permissions"
   *
   * a Principal or Teacher should not see the page.
   */
  if (
    ['permissions', 'schools'].includes(currentPage) &&
    currentUser.role !== 'admin'
  ) {
    return (
      <AppLayout
        currentUser={currentUser}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onRoleSwitch={handleRoleSwitch}
        onLogout={handleLogout}
        schools={schools}
        selectedSchoolId={selectedSchoolId}
        onSelectSchool={handleSelectSchool}
      >
        <ErrorPage
          type="403"
          title="Access Denied"
          message="This page is restricted to administrators."
          onGoHome={() =>
            handleNavigate('dashboard')
          }
        />

        <ToastContainer
          toasts={toasts}
          onDismiss={handleDismissToast}
        />
      </AppLayout>
    );
  }

  /*
   * -------------------------------------------------------
   * UNKNOWN PAGE DETECTION
   * -------------------------------------------------------
   */
  const isValidPage =
    VALID_PAGES.includes(currentPage);

  /*
   * -------------------------------------------------------
   * AUTHENTICATED APPLICATION
   * -------------------------------------------------------
   */
  return (
    <AppLayout
      currentUser={currentUser}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onRoleSwitch={handleRoleSwitch}
      onLogout={handleLogout}
      schools={schools}
      selectedSchoolId={selectedSchoolId}
      onSelectSchool={handleSelectSchool}
    >

      {/* DASHBOARD */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onOpenAddTeacher={
            handleOpenAddTeacher
          }
          onOpenAddSubject={
            handleOpenAddSubject
          }
          onOpenAddSection={
            handleOpenAddSection
          }
        />
      )}

      {/* TIMETABLE */}
      {currentPage === 'timetable' && (
        <TimetableViewPage
          currentUser={currentUser}
          onShowToast={showToast}
          onNavigateToGenerate={() =>
            handleNavigate('generate')
          }
        />
      )}

      {/* TEACHERS */}
      {currentPage === 'teachers' && (
        <TeachersPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddTeacherOnMount
          }
        />
      )}

      {/* SUBJECTS */}
      {currentPage === 'subjects' && (
        <SubjectsPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddSubjectOnMount
          }
        />
      )}

      {/* CLASSES / SECTIONS */}
      {currentPage === 'classes' && (
        <ClassesSectionsPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddSectionOnMount
          }
        />
      )}

      {/* PRINCIPAL - LEAVE REQUESTS */}
      {currentPage === 'leave-requests' && currentUser.role === 'principal' && (
        <LeaveRequestsPage />
      )}

      {/* PRINCIPAL - NOTIFICATIONS */}
      {currentPage === 'notifications' && (
        <NotificationsPage />
      )}

      {/* TEACHER AVAILABILITY */}
      {currentPage === 'availability' && (
        <AvailabilityPage
          onShowToast={showToast}
        />
      )}

      {/* GENERATE TIMETABLE */}
      {currentPage === 'generate' && (
        <GenerateTimetablePage
          onGenerationComplete={() =>
            handleNavigate('timetable')
          }
          onShowToast={showToast}
        />
      )}

      {/* ADMIN - MANAGE ACCESS */}
      {currentPage === 'permissions' && (
        <PermissionsPage />
      )}

      {/* ADMIN - SCHOOL MANAGEMENT */}
      {currentPage === 'schools' && currentUser.role === 'admin' && (
        <SchoolsPage onSchoolsChanged={refreshSchools} />
      )}

      {/* TEACHER - ASSIGNED CLASSES AND SUBJECTS */}
      {currentPage === 'my-classes' && currentUser.role === 'teacher' && (
        <TeacherClassesPage />
      )}

      {/* TEACHER - PERSONAL AVAILABILITY */}
      {currentPage === 'my-availability' && currentUser.role === 'teacher' && (
        <TeacherAvailabilityPage />
      )}

      {/* TEACHER - LEAVE REQUESTS */}
      {currentPage === 'teacher-leave' && currentUser.role === 'teacher' && (
        <TeacherLeavePage />
      )}

      {/* TEACHER - TIMETABLE SWAPS */}
      {currentPage === 'swaps' && currentUser.role === 'teacher' && (
        <TeacherSwapsPage />
      )}

      {/* PROFILE */}
      {currentPage === 'profile' && (
        <ProfilePage
          currentUser={currentUser}
          onUpdateUser={setCurrentUser}
          onShowToast={showToast}
        />
      )}

      {/* SETTINGS */}
      {currentPage === 'settings' && (
        <SettingsPage
          onShowToast={showToast}
        />
      )}

      {/* -------------------------------------------------
          404 FALLBACK
          ------------------------------------------------- */}
      {!isValidPage && (
        <ErrorPage
          type="404"
          title="Page Not Found"
          message="The page you are trying to access does not exist or is no longer available."
          onGoHome={() =>
            handleNavigate('dashboard')
          }
        />
      )}

      {/* GLOBAL TOASTS */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />

    </AppLayout>
  );
}