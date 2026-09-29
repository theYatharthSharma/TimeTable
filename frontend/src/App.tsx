import React, { useState } from 'react';
import { User } from './types';
import { authService } from './services/authService';
import { AppLayout } from './components/layout/AppLayout';
import {
  ToastContainer,
  ToastMessage,
} from './components/common/Toast';

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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(
    () => {
      const user = authService.getCurrentUser();

      if (!user || !authService.isAuthenticated()) {
        return null;
      }

      return user;
    }
  );

  const [currentPage, setCurrentPage] =
    useState<string>('dashboard');

  const [loginError, setLoginError] =
    useState<string>('');

  const [toasts, setToasts] =
    useState<ToastMessage[]>([]);

  // Trigger state for opening modals when navigating
  const [openAddTeacherOnMount, setOpenAddTeacherOnMount] =
    useState(false);

  const [openAddSubjectOnMount, setOpenAddSubjectOnMount] =
    useState(false);

  const [openAddSectionOnMount, setOpenAddSectionOnMount] =
    useState(false);

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
        prev.filter(t => t.id !== id)
      );
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev =>
      prev.filter(t => t.id !== id)
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
  };

  const handleLogout = () => {
    authService.logout();

    setCurrentUser(null);
    setCurrentPage('dashboard');

    showToast(
      'You have been logged out',
      'info'
    );
  };

  /*
   * Role switching is no longer a fake local persona switch.
   *
   * The backend determines the authenticated user's role.
   */
  const handleRoleSwitch = () => {
    showToast(
      'Role switching is disabled. Sign in with the account for the required role.',
      'info'
    );
  };

  const handleNavigate = (page: string) => {
    setOpenAddTeacherOnMount(false);
    setOpenAddSubjectOnMount(false);
    setOpenAddSectionOnMount(false);

    setCurrentPage(page);
  };

  // Quick Action handlers
  const handleOpenAddTeacher = () => {
    setOpenAddTeacherOnMount(true);
    setCurrentPage('teachers');
  };

  const handleOpenAddSubject = () => {
    setOpenAddSubjectOnMount(true);
    setCurrentPage('subjects');
  };

  const handleOpenAddSection = () => {
    setOpenAddSectionOnMount(true);
    setCurrentPage('classes');
  };

  /*
   * Not authenticated → Login page.
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
   * Authenticated application.
   */
  return (
    <AppLayout
      currentUser={currentUser}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onRoleSwitch={handleRoleSwitch}
      onLogout={handleLogout}
    >
      {currentPage === 'dashboard' && (
        <DashboardPage
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onOpenAddTeacher={handleOpenAddTeacher}
          onOpenAddSubject={handleOpenAddSubject}
          onOpenAddSection={handleOpenAddSection}
        />
      )}

      {currentPage === 'timetable' && (
        <TimetableViewPage
          currentUser={currentUser}
          onShowToast={showToast}
          onNavigateToGenerate={() =>
            handleNavigate('generate')
          }
        />
      )}

      {currentPage === 'teachers' && (
        <TeachersPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddTeacherOnMount
          }
        />
      )}

      {currentPage === 'subjects' && (
        <SubjectsPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddSubjectOnMount
          }
        />
      )}

      {currentPage === 'classes' && (
        <ClassesSectionsPage
          onShowToast={showToast}
          openAddModalOnMount={
            openAddSectionOnMount
          }
        />
      )}

      {currentPage === 'availability' && (
        <AvailabilityPage
          onShowToast={showToast}
        />
      )}

      {currentPage === 'generate' && (
        <GenerateTimetablePage
          onGenerationComplete={() =>
            handleNavigate('timetable')
          }
          onShowToast={showToast}
        />
      )}

      {currentPage === 'profile' && (
        <ProfilePage
          currentUser={currentUser}
          onUpdateUser={setCurrentUser}
          onShowToast={showToast}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          onShowToast={showToast}
        />
      )}

      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />
    </AppLayout>
  );
}