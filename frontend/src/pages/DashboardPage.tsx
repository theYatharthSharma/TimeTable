import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Users,
  BookOpen,
  Layers,
  ArrowRight,
  Plus,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Activity,
} from 'lucide-react';

import {
  User,
  DayOfWeek,
  TimetableEntry,
} from '../types';

import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';
import { sectionService } from '../services/sectionService';
import { timetableService } from '../services/timetableService';
import { DAYS_OF_WEEK } from '../data/mockData';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (page: string) => void;
  onOpenAddTeacher?: () => void;
  onOpenAddSubject?: () => void;
  onOpenAddSection?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onNavigate,
  onOpenAddTeacher,
  onOpenAddSubject,
  onOpenAddSection,
}) => {
  /*
   * --------------------------------------------------------------------------
   * Existing local/frontend data
   * --------------------------------------------------------------------------
   */

  const teachers = teacherService.getTeachers();
  const standards = sectionService.getStandards();
  const sections = sectionService.getSections();
  const subjects = subjectService.getSubjects();

  /*
   * --------------------------------------------------------------------------
   * Backend timetable state
   *
   * timetableService.getEntries() is async because timetable data now comes
   * from FastAPI/PostgreSQL instead of localStorage.
   * --------------------------------------------------------------------------
   */

  const [allEntries, setAllEntries] = useState<TimetableEntry[]>([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [timetableError, setTimetableError] = useState<string | null>(null);

  /*
   * Load timetable whenever the authenticated user changes.
   *
   * We intentionally use currentUser.id rather than schoolId here because
   * schoolId is not currently part of the frontend User type.
   *
   * timetableService itself gets the school ID from authService.
   */
  useEffect(() => {
    let cancelled = false;

    const loadTimetable = async () => {
      try {
        setTimetableLoading(true);
        setTimetableError(null);

        const entries = await timetableService.getEntries();

        if (!cancelled) {
          setAllEntries(entries);
        }
      } catch (error) {
        if (!cancelled) {
          setAllEntries([]);

          setTimetableError(
            error instanceof Error
              ? error.message
              : 'Unable to load timetable.'
          );
        }
      } finally {
        if (!cancelled) {
          setTimetableLoading(false);
        }
      }
    };

    loadTimetable();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  /*
   * --------------------------------------------------------------------------
   * Teacher-specific information
   * --------------------------------------------------------------------------
   */

  const teacherProfile = teachers.find(
    t => t.id === (currentUser.teacherId || 't_11')
  );

  const currentDayIndex = new Date().getDay();

  const todayName: DayOfWeek =
    currentDayIndex >= 1 && currentDayIndex <= 6
      ? DAYS_OF_WEEK[currentDayIndex - 1]
      : 'Monday';

  const teacherTodayClasses = teacherProfile
    ? allEntries
        .filter(
          entry =>
            entry.teacherId === teacherProfile.id &&
            entry.day === todayName
        )
        .sort((a, b) => a.period - b.period)
    : [];

  const teacherWeeklyEntries = teacherProfile
    ? allEntries.filter(
        entry => entry.teacherId === teacherProfile.id
      )
    : [];

  /*
   * --------------------------------------------------------------------------
   * Loading state
   *
   * Do this AFTER all hooks have been called.
   * --------------------------------------------------------------------------
   */

  if (timetableLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs px-8 py-6 text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />

          <h2 className="text-sm font-bold text-slate-900">
            Loading Dashboard
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Fetching timetable data...
          </p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Error state
   * --------------------------------------------------------------------------
   */

  if (timetableError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-2xl shadow-2xs px-8 py-6 text-center max-w-md">
          <div className="w-10 h-10 mx-auto mb-4 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
            <Activity className="w-5 h-5 text-red-600" />
          </div>

          <h2 className="text-sm font-bold text-slate-900">
            Unable to Load Timetable
          </h2>

          <p className="text-xs text-slate-500 mt-2">
            {timetableError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------------------------------
   * Recent mock activities for admin
   *
   * These remain frontend-only for now.
   * --------------------------------------------------------------------------
   */

  const recentActivities = [
    {
      id: '1',
      action: 'Timetable generated for Academic Year 2026-27',
      time: '10 mins ago',
      type: 'generate',
    },
    {
      id: '2',
      action: 'Teacher availability updated: Mr. Rahul Sharma',
      time: '1 hour ago',
      type: 'teacher',
    },
    {
      id: '3',
      action: 'New section 10C verified with 5 assigned subjects',
      time: '3 hours ago',
      type: 'section',
    },
    {
      id: '4',
      action: 'Subject curriculum quota synchronized for Mathematics',
      time: 'Yesterday',
      type: 'subject',
    },
  ];

  /*
   * ==========================================================================
   * 1. TEACHER VIEW
   * ==========================================================================
   */

  if (currentUser.role === 'teacher') {
    return (
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good Morning, {currentUser.name}
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Mathematics Faculty · Greenwood International School
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('timetable')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Open Full Timetable</span>
          </button>
        </div>

        {/* Teacher Stat Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Today's Teaching Load
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {teacherTodayClasses.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                / 6 periods
              </span>
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              Active day: {todayName}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Weekly Total Periods
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {teacherWeeklyEntries.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                periods/wk
              </span>
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              Max allowed: 25 periods/wk
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Assigned Sections
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {teacherProfile?.sectionIds.length || 3}
            </div>

            <div className="text-[11px] text-slate-500 mt-2">
              Sections:{' '}
              {teacherProfile?.sectionIds.join(', ') || '8A, 8B, 8C'}
            </div>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Today's Classes — {todayName}
              </h2>

              <p className="text-xs text-slate-500">
                Your scheduled periods for today
              </p>
            </div>

            <span className="text-xs font-medium text-slate-500">
              {teacherTodayClasses.length} scheduled periods
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

            {[1, 2, 3, 4, 5, 6].map(pNum => {
              const entry = teacherTodayClasses.find(
                e => e.period === pNum
              );

              const subject = entry
                ? subjects.find(s => s.id === entry.subjectId)
                : null;

              return (
                <div
                  key={pNum}
                  className={`p-4 rounded-xl border transition-all ${
                    entry
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-slate-50/60 border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">

                    <span className="text-xs font-bold text-slate-700">
                      Period {pNum}
                    </span>

                    <span className="text-[11px] text-slate-500 font-mono">
                      {pNum === 1
                        ? '08:30 - 09:15'
                        : pNum === 2
                        ? '09:15 - 10:00'
                        : pNum === 3
                        ? '10:15 - 11:00'
                        : pNum === 4
                        ? '11:00 - 11:45'
                        : pNum === 5
                        ? '12:30 - 01:15'
                        : '01:15 - 02:00'}
                    </span>
                  </div>

                  {entry ? (
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        Class {entry.sectionId}
                      </div>

                      <div className="text-xs font-medium text-blue-700 mt-0.5">
                        {subject?.name || 'Mathematics'} (
                        {subject?.code || 'MATH'})
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">
                      Free Period / Planning
                    </div>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================================
   * 2. PRINCIPAL VIEW
   * ==========================================================================
   */

  if (currentUser.role === 'principal') {
    return (
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Good Morning, {currentUser.name}
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              Greenwood International School — Academic Overview &
              Timetable Health
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('timetable')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>View School Timetable</span>
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Total Teachers
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {teachers.length}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Active across 5 standards
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Total Standards
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {standards.length}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Grade 6 through 10
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Total Sections
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {sections.length}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              3 sections per standard
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-medium text-slate-500">
              Total Subjects
            </div>

            <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
              {subjects.length}
            </div>

            <div className="text-[11px] text-slate-500 mt-1">
              Curriculum courses
            </div>
          </div>

        </div>

        {/* Timetable Status Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">

          <div className="flex items-start gap-4">

            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">

                <h3 className="text-sm font-bold text-slate-900">
                  School Timetable: Active & Conflict-Free
                </h3>

                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Ready
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-1">
                All 15 sections have full 6-period allocations for Monday
                through Saturday with 0 teacher double-bookings.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('timetable')}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>Inspect Class 8A Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>
      </div>
    );
  }

  /*
   * ==========================================================================
   * 3. ADMIN VIEW
   * ==========================================================================
   */

  return (
    <div className="space-y-6">

      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Good Morning, {currentUser.name}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Manage your school's timetable.
          </p>
        </div>

        {/* Main CTA */}
        <button
          type="button"
          onClick={() => onNavigate('generate')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate Timetable</span>
        </button>

      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Teachers */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">

            <span className="text-xs font-medium text-slate-500">
              Teachers
            </span>

            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {teachers.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            5 per standard
          </div>
        </div>

        {/* Standards */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">

            <span className="text-xs font-medium text-slate-500">
              Standards
            </span>

            <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {standards.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Standard 6 to 10
          </div>
        </div>

        {/* Sections */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">

            <span className="text-xs font-medium text-slate-500">
              Sections
            </span>

            <Calendar className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {sections.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            3 sections per standard
          </div>
        </div>

        {/* Subjects */}
        <div
          onClick={() => onNavigate('subjects')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">

            <span className="text-xs font-medium text-slate-500">
              Subjects
            </span>

            <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>

          <div className="text-2xl font-bold text-slate-900 mt-2 tabular-nums">
            {subjects.length * standards.length}
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            5 core subjects across standards
          </div>
        </div>

      </div>

      {/* Middle Row: Quick Actions & Timetable Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs lg:col-span-2">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Quick Actions
            </h2>

            <span className="text-xs text-slate-400">
              Core administrative tasks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <button
              type="button"
              onClick={
                onOpenAddTeacher ||
                (() => onNavigate('teachers'))
              }
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold text-slate-900">
                Add Teacher
              </span>

              <span className="text-[11px] text-slate-500 mt-1">
                Register faculty and subjects
              </span>
            </button>

            <button
              type="button"
              onClick={
                onOpenAddSubject ||
                (() => onNavigate('subjects'))
              }
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold text-slate-900">
                Add Subject
              </span>

              <span className="text-[11px] text-slate-500 mt-1">
                Set weekly period requirements
              </span>
            </button>

            <button
              type="button"
              onClick={
                onOpenAddSection ||
                (() => onNavigate('classes'))
              }
              className="flex flex-col items-start p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>

              <span className="text-xs font-bold text-slate-900">
                Add Section
              </span>

              <span className="text-[11px] text-slate-500 mt-1">
                Assign standard and division
              </span>
            </button>

          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">

            <span>
              Need to mark faculty leaves or period blocks?
            </span>

            <button
              type="button"
              onClick={() => onNavigate('availability')}
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              <span>Teacher Availability Grid</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* Timetable Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">

          <div>

            <div className="flex items-center justify-between mb-3">

              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Timetable Status
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Ready to Generate
              </span>

            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 mt-2">

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Configured Scope
                </span>

                <span className="font-semibold text-slate-800">
                  Entire School
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Total Weekly Periods
                </span>

                <span className="font-semibold text-slate-800 tabular-nums">
                  540 slots
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Conflicts Detected
                </span>

                <span className="font-semibold text-emerald-600">
                  0 Conflicts
                </span>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">

            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <span>View Active Timetable</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />

            <h2 className="text-sm font-bold text-slate-900">
              Recent Activity
            </h2>
          </div>

          <span className="text-xs text-slate-400">
            Audit trail
          </span>
        </div>

        <div className="divide-y divide-slate-100">

          {recentActivities.map(item => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">

                <div className="w-2 h-2 rounded-full bg-blue-600"></div>

                <span className="text-xs font-medium text-slate-700">
                  {item.action}
                </span>

              </div>

              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {item.time}
              </span>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};