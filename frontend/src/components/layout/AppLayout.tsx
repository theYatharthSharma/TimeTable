import React, { useState } from 'react';

import {
  LayoutDashboard,
  Calendar,
  Users,
  BookOpen,
  Layers,
  Clock,
  Sparkles,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  School,
  Check,
  ShieldCheck,
} from 'lucide-react';

import { User, UserRole } from '../../types';

interface AppLayoutProps {
  currentUser: User;
  currentPage: string;
  onNavigate: (page: string) => void;
  onRoleSwitch: (role: UserRole) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  currentPage,
  onNavigate,
  onRoleSwitch,
  onLogout,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [roleDropdownOpen, setRoleDropdownOpen] =
    useState(false);

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  const getNavItems = () => {
    if (currentUser.role === 'admin') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'timetable',
          label: 'Timetable',
          icon: Calendar,
        },
        {
          id: 'teachers',
          label: 'Teachers',
          icon: Users,
        },
        {
          id: 'subjects',
          label: 'Subjects',
          icon: BookOpen,
        },
        {
          id: 'classes',
          label: 'Classes & Sections',
          icon: Layers,
        },
        {
          id: 'availability',
          label: 'Availability',
          icon: Clock,
        },
        {
          id: 'generate',
          label: 'Generate Timetable',
          icon: Sparkles,
          highlight: true,
        },
        {
          id: 'permissions',
          label: 'Manage Access',
          icon: ShieldCheck,
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: UserIcon,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: SettingsIcon,
        },
      ];
    }

    if (currentUser.role === 'principal') {
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'timetable',
          label: 'Timetable',
          icon: Calendar,
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: UserIcon,
        },
      ];
    }

    // Teacher
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'timetable',
        label: 'My Timetable',
        icon: Calendar,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: UserIcon,
      },
    ];
  };

  const navItems = getNavItems();

  // --------------------------------------------------
  // Navigation handler
  // --------------------------------------------------

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col antialiased">

      {/* ==================================================
          TOP HEADER
      ================================================== */}

      <header className="shrink-0 h-15 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-30">

        {/* Left side */}
        <div className="flex items-center gap-3">

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() =>
              onNavigate('dashboard')
            }
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                TimeGen{' '}
                <span className="text-blue-600">
                  AI
                </span>
              </span>

              <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5">
                School Timetable Platform
              </span>
            </div>
          </div>

          {/* School */}
          <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-slate-200 text-xs text-slate-500">
            <School className="w-3.5 h-3.5 text-slate-400" />

            <span className="font-medium text-slate-700">
              {currentUser.schoolName}
            </span>
          </div>
        </div>

        {/* ==================================================
            RIGHT HEADER
        ================================================== */}

        <div className="flex items-center gap-3">

          {/* Role Switcher */}
          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setRoleDropdownOpen(
                  !roleDropdownOpen
                )
              }
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            >
              <span className="text-slate-400 font-normal">
                Role:
              </span>

              <span className="font-semibold text-slate-900 capitalize">
                {currentUser.role}
              </span>

              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <>
                {/* Click outside */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() =>
                    setRoleDropdownOpen(false)
                  }
                />

                {/* Dropdown */}
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30">

                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch MVP Role
                  </div>

                  {(
                    [
                      'admin',
                      'principal',
                      'teacher',
                    ] as UserRole[]
                  ).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        onRoleSwitch(role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        currentUser.role === role
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="capitalize">
                        {role}
                      </span>

                      {currentUser.role ===
                        role && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Profile */}
          <div
            className="flex items-center gap-2.5 pl-2 cursor-pointer"
            onClick={() =>
              onNavigate('profile')
            }
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs shadow-2xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.name}
              </span>

              <span className="text-[11px] text-slate-400 capitalize">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================
          MAIN APPLICATION AREA
      ================================================== */}

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ==================================================
            DESKTOP SIDEBAR
        ================================================== */}

        <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-slate-200/80">

          {/* ----------------------------------------------
              SCROLLABLE NAVIGATION
          ---------------------------------------------- */}

          <div className="flex-1 min-h-0 overflow-y-auto p-3">

            <div className="space-y-1">

              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Navigation
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  currentPage === item.id;

                const isHighlight =
                  item.highlight;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleNavClick(
                        item.id
                      )
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? isHighlight
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-blue-700 font-semibold'
                        : isHighlight
                          ? 'text-blue-700 bg-blue-50/70 hover:bg-blue-100/60 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? isHighlight
                            ? 'text-white'
                            : 'text-blue-600'
                          : isHighlight
                            ? 'text-blue-600'
                            : 'text-slate-400'
                      }`}
                    />

                    <span className="truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ----------------------------------------------
              FIXED LOGOUT AREA
          ---------------------------------------------- */}

          <div className="shrink-0 p-3 border-t border-slate-100">

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50/60 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-400" />

              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* ==================================================
            MOBILE DRAWER
        ================================================== */}

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">

            {/* Overlay */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() =>
                setMobileMenuOpen(false)
              }
            />

            {/* Drawer */}
            <div className="relative w-64 max-w-[80%] h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl z-50">

              {/* Scrollable mobile navigation */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">

                {/* Mobile header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">

                  <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                      TG
                    </div>

                    <span className="font-bold text-sm text-slate-900">
                      TimeGen AI
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMobileMenuOpen(
                        false
                      )
                    }
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Navigation */}
                <div className="space-y-1">

                  {navItems.map((item) => {
                    const Icon = item.icon;

                    const isActive =
                      currentPage ===
                      item.id;

                    const isHighlight =
                      item.highlight;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          handleNavClick(
                            item.id
                          )
                        }
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                          isActive
                            ? isHighlight
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-slate-100 text-blue-700 font-semibold'
                            : isHighlight
                              ? 'text-blue-700 bg-blue-50 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />

                        <span>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fixed mobile logout */}
              <div className="shrink-0 p-4 border-t border-slate-100">

                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 shrink-0" />

                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8">

          <div className="max-w-7xl mx-auto">
            {children}
          </div>

        </main>
      </div>
    </div>
  );
};