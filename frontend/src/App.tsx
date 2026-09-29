import React, { useState } from 'react';
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
  const [currentPage, setCurrentPage] =
    useState<string>('dashboard');

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
   * UNKNOWN PAGE DETECTION
   * -------------------------------------------------------
   *
   * This prevents an invalid currentPage from producing
   * a blank application area.
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