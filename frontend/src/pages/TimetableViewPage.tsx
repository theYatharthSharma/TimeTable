import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  User as UserIcon,
  Layers,
  Clock,
} from 'lucide-react';

import {
  TimetableEntry,
  TimetableConflict,
  DayOfWeek,
  User,
  Subject,
  Teacher,
} from '../types';

import { timetableService } from '../services/timetableService';
import { sectionService } from '../services/sectionService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { DAYS_OF_WEEK, PERIOD_SLOTS } from '../data/mockData';
import { Modal } from '../components/common/Modal';

interface TimetableViewPageProps {
  currentUser: User;
  onShowToast: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  onNavigateToGenerate: () => void;
}

interface BackendStandard {
  id: string;
  name: string;
  level: number;
}

interface BackendSection {
  id: string;
  name: string;
  standard_id: string;
  room_number?: string | null;
}

interface BackendSubject {
  id: string;
  name: string;
  code: string;
  weekly_periods: number;
}

interface BackendTeacher {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
}

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const getAuthToken = (): string | null => {
  return localStorage.getItem('timegen_access_token');
};

const getSchoolId = (): string | null => {
  return localStorage.getItem('timegen_school_id');
};

const backendRequest = async <T,>(
  endpoint: string
): Promise<T> => {
  const token = getAuthToken();
  const schoolId = getSchoolId();

  if (!token) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  if (!schoolId) {
    throw new Error(
      'No school is selected. Please log in again.'
    );
  }

  const separator = endpoint.includes('?') ? '&' : '?';

  const response = await fetch(
    `${API_BASE_URL}${endpoint}${separator}school_id=${schoolId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
};

const normalizeDay = (day: string): DayOfWeek => {
  const normalized = day.toLowerCase();

  return (
    normalized.charAt(0).toUpperCase() +
    normalized.slice(1)
  ) as DayOfWeek;
};

export const TimetableViewPage: React.FC<
  TimetableViewPageProps
> = ({
  currentUser,
  onShowToast,
  onNavigateToGenerate,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const isAdmin = currentUser.role === 'admin';

  /*
   * ============================================================
   * BACKEND DATA
   * ============================================================
   */

  const [standards, setStandards] = useState<BackendStandard[]>(
    []
  );

  const [sections, setSections] = useState<BackendSection[]>(
    []
  );

  const [subjects, setSubjects] = useState<BackendSubject[]>(
    []
  );

  const [teachers, setTeachers] = useState<BackendTeacher[]>(
    []
  );

  const [entries, setEntries] = useState<TimetableEntry[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * ============================================================
   * VIEW STATE
   * ============================================================
   */

  const [viewMode, setViewMode] = useState<
    'by_section' | 'by_teacher'
  >(isTeacher ? 'by_teacher' : 'by_section');

  const [selectedStandardId, setSelectedStandardId] =
    useState<string>('');

  const [selectedSectionId, setSelectedSectionId] =
    useState<string>('');

  const [selectedTeacherId, setSelectedTeacherId] =
    useState<string>(
      currentUser.teacherId || ''
    );

  /*
   * ============================================================
   * EDIT MODAL
   * ============================================================
   */

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);

  const [editingCell, setEditingCell] = useState<{
    sectionId: string;
    day: DayOfWeek;
    period: number;
    subjectId: string;
    teacherId: string;
  } | null>(null);

  const [simulatedConflict, setSimulatedConflict] =
    useState<TimetableConflict | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  /*
   * ============================================================
   * LOAD ALL BACKEND DATA
   * ============================================================
   */

  const loadTimetableData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        backendStandards,
        backendSections,
        backendSubjects,
        backendTeachers,
        backendEntries,
      ] = await Promise.all([
        backendRequest<BackendStandard[]>(
          '/academic/standards'
        ),
        backendRequest<BackendSection[]>(
          '/academic/sections'
        ),
        backendRequest<BackendSubject[]>(
          '/subjects'
        ),
        backendRequest<BackendTeacher[]>(
          '/teachers'
        ),
        timetableService.getEntries(),
      ]);

      setStandards(backendStandards);
      setSections(backendSections);
      setSubjects(backendSubjects);
      setTeachers(backendTeachers);
      setEntries(backendEntries);

      /*
       * Select first standard automatically.
       */
      if (
        backendStandards.length > 0 &&
        !selectedStandardId
      ) {
        setSelectedStandardId(
          backendStandards[0].id
        );
      }

      /*
       * Select first teacher automatically.
       */
      if (
        backendTeachers.length > 0 &&
        !selectedTeacherId
      ) {
        setSelectedTeacherId(
          currentUser.teacherId ||
            backendTeachers[0].id
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load timetable data.';

      console.error(
        'Failed to load timetable data:',
        err
      );

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimetableData();
  }, []);

  /*
   * ============================================================
   * DERIVED DATA
   * ============================================================
   */

  const standardSections = useMemo(() => {
    if (!selectedStandardId) {
      return [];
    }

    return sections.filter(
      section =>
        section.standard_id === selectedStandardId
    );
  }, [sections, selectedStandardId]);

  /*
   * Automatically select first section for selected standard.
   */
  useEffect(() => {
    if (
      standardSections.length > 0 &&
      !standardSections.some(
        section => section.id === selectedSectionId
      )
    ) {
      setSelectedSectionId(
        standardSections[0].id
      );
    }
  }, [
    standardSections,
    selectedSectionId,
  ]);

  const selectedStandard = standards.find(
    standard =>
      standard.id === selectedStandardId
  );

  const selectedSection = sections.find(
    section =>
      section.id === selectedSectionId
  );

  const currentTeacher = teachers.find(
    teacher =>
      teacher.id === selectedTeacherId
  );

  const currentEntries = useMemo(() => {
    if (viewMode === 'by_teacher') {
      return entries.filter(
        entry =>
          entry.teacherId === selectedTeacherId
      );
    }

    return entries.filter(
      entry =>
        entry.sectionId === selectedSectionId
    );
  }, [
    entries,
    viewMode,
    selectedTeacherId,
    selectedSectionId,
  ]);

  /*
   * ============================================================
   * SUBJECT / TEACHER HELPERS
   * ============================================================
   */

  const getSubject = (
    subjectId: string
  ): BackendSubject | undefined => {
    return subjects.find(
      subject =>
        subject.id === subjectId
    );
  };

  const getTeacher = (
    teacherId: string
  ): BackendTeacher | undefined => {
    return teachers.find(
      teacher =>
        teacher.id === teacherId
    );
  };

  /*
   * ============================================================
   * FIND ENTRY FOR SLOT
   * ============================================================
   */

  const getEntryForSlot = (
    day: DayOfWeek,
    period: number
  ): TimetableEntry | undefined => {
    return currentEntries.find(
      entry =>
        normalizeDay(String(entry.day)) === day &&
        entry.period === period
    );
  };

  /*
   * ============================================================
   * CELL CLICK
   * ============================================================
   */

  const handleCellClick = async (
    day: DayOfWeek,
    period: number
  ) => {
    if (!isAdmin) {
      return;
    }

    if (!selectedSectionId) {
      onShowToast(
        'Please select a section first.',
        'error'
      );
      return;
    }

    /*
     * Backend lookup instead of synchronous getEntry().
     */
    try {
      const existingEntry =
        await timetableService.getEntry(
          selectedSectionId,
          day,
          period
        );

      const firstSubjectId =
        subjects[0]?.id || '';

      const firstTeacherId =
        teachers[0]?.id || '';

      setEditingCell({
        sectionId: selectedSectionId,
        day,
        period,
        subjectId:
          existingEntry?.subjectId ||
          firstSubjectId,
        teacherId:
          existingEntry?.teacherId ||
          firstTeacherId,
      });

      setSimulatedConflict(null);
      setIsEditModalOpen(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load timetable slot.';

      onShowToast(message, 'error');
    }
  };

  /*
   * ============================================================
   * TEACHER CONFLICT CHECK
   * ============================================================
   */

  const handleTeacherSelectionChange = async (
    newTeacherId: string
  ) => {
    if (!editingCell) {
      return;
    }

    setEditingCell({
      ...editingCell,
      teacherId: newTeacherId,
    });

    try {
      const conflict =
        await timetableService.checkProposedConflict(
          editingCell.sectionId,
          editingCell.day,
          editingCell.period,
          newTeacherId
        );

      setSimulatedConflict(conflict);
    } catch (err) {
      console.error(
        'Conflict check failed:',
        err
      );

      setSimulatedConflict(null);
    }
  };

  /*
   * ============================================================
   * SAVE CELL
   * ============================================================
   */

  const handleSaveCell = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!editingCell) {
      return;
    }

    setIsSaving(true);

    try {
      const result =
        await timetableService.updateEntry(
          editingCell.sectionId,
          editingCell.day,
          editingCell.period,
          editingCell.subjectId,
          editingCell.teacherId
        );

      if (!result.success) {
        if (result.conflict) {
          setSimulatedConflict(
            result.conflict
          );

          onShowToast(
            result.conflict.message,
            'error'
          );
        } else {
          onShowToast(
            'Unable to update timetable entry.',
            'error'
          );
        }

        return;
      }

      /*
       * Reload timetable from PostgreSQL.
       */
      const refreshedEntries =
        await timetableService.getEntries();

      setEntries(refreshedEntries);

      setIsEditModalOpen(false);
      setEditingCell(null);
      setSimulatedConflict(null);

      onShowToast(
        `Updated Period ${editingCell.period} successfully.`,
        'success'
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save timetable entry.';

      onShowToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ============================================================
   * DOWNLOAD
   * ============================================================
   */

  const handleDownload = () => {
    onShowToast(
      'Export functionality will be connected in the next phase.',
      'info'
    );
  };

  /*
   * ============================================================
   * REGENERATE
   * ============================================================
   */

  const handleRegenerate = () => {
    onNavigateToGenerate();
  };

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading timetable...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Fetching schedule from the server
          </p>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR STATE
   * ============================================================
   */

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Unable to Load Timetable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadTimetableData}
            className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <div className="space-y-6">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {viewMode === 'by_section'
                ? selectedSection
                  ? `Class ${selectedStandard?.name || ''} - ${selectedSection.name}`
                  : 'Class / Section'
                : currentTeacher?.name ||
                  'Faculty'}
            </span>

            <span className="text-slate-300">
              ·
            </span>

            <span className="text-xs text-slate-500">
              Weekly Master Schedule
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            {viewMode === 'by_section'
              ? selectedSection
                ? `Class ${
                    selectedStandard?.name || ''
                  } ${
                    selectedSection.name
                  } — Weekly Timetable`
                : 'Weekly Timetable'
              : `${
                  currentTeacher?.name ||
                  'Faculty'
                } — Weekly Timetable`}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Monday through Saturday · 6 Periods per day · Backend-generated timetable
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">

          {isAdmin && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Regenerate</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      {!isTeacher && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* View mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">

            <button
              type="button"
              onClick={() =>
                setViewMode('by_section')
              }
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                viewMode === 'by_section'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  Class / Section
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setViewMode('by_teacher')
              }
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                viewMode === 'by_teacher'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                <span>
                  Teacher View
                </span>
              </span>
            </button>
          </div>

          {/* Selectors */}
          <div className="flex flex-wrap items-center gap-3">

            {viewMode === 'by_section' ? (
              <>
                {/* Standard */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    Standard:
                  </span>

                  <select
                    value={selectedStandardId}
                    onChange={e =>
                      setSelectedStandardId(
                        e.target.value
                      )
                    }
                    className="py-1.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl"
                  >
                    {standards.map(
                      standard => (
                        <option
                          key={standard.id}
                          value={standard.id}
                        >
                          {standard.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Section */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    Section:
                  </span>

                  <select
                    value={selectedSectionId}
                    onChange={e =>
                      setSelectedSectionId(
                        e.target.value
                      )
                    }
                    className="py-1.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl"
                  >
                    {standardSections.map(
                      section => (
                        <option
                          key={section.id}
                          value={section.id}
                        >
                          {section.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">
                  Teacher:
                </span>

                <select
                  value={selectedTeacherId}
                  onChange={e =>
                    setSelectedTeacherId(
                      e.target.value
                    )
                  }
                  className="py-1.5 px-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl"
                >
                  {teachers.map(
                    teacher => (
                      <option
                        key={teacher.id}
                        value={teacher.id}
                      >
                        {teacher.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {isAdmin && (
              <span className="text-[11px] text-slate-400 italic hidden sm:inline ml-2">
                Click any cell to edit or reassign faculty
              </span>
            )}
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* TIMETABLE */}
      {/* ====================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs border-collapse">

            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">

              <tr>

                <th className="py-3.5 px-4 w-36 border-r border-slate-100">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Period / Time
                    </span>
                  </div>
                </th>

                {DAYS_OF_WEEK.map(day => (
                  <th
                    key={day}
                    className="py-3.5 px-3 text-center min-w-[130px] border-r border-slate-100"
                  >
                    <span className="font-bold text-slate-900">
                      {day}
                    </span>
                  </th>
                ))}

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {PERIOD_SLOTS.map(
                slot => {
                  const isAfterPeriod2 =
                    slot.periodNumber === 3;

                  const isAfterPeriod4 =
                    slot.periodNumber === 5;

                  return (
                    <React.Fragment
                      key={
                        slot.periodNumber
                      }
                    >

                      {isAfterPeriod2 && (
                        <tr className="bg-slate-100/50">
                          <td
                            colSpan={7}
                            className="py-1 px-4 text-center text-[10px] font-semibold text-slate-400 uppercase"
                          >
                            Short Recess Break · 10:00 AM – 10:15 AM
                          </td>
                        </tr>
                      )}

                      {isAfterPeriod4 && (
                        <tr className="bg-slate-100/70">
                          <td
                            colSpan={7}
                            className="py-1.5 px-4 text-center text-[10px] font-bold text-slate-500 uppercase"
                          >
                            Lunch Break · 11:45 AM – 12:30 PM
                          </td>
                        </tr>
                      )}

                      <tr className="hover:bg-slate-50/30 transition-colors">

                        <td className="py-3 px-4 border-r border-slate-100 bg-slate-50/40">
                          <div className="font-bold text-slate-800">
                            {slot.label}
                          </div>

                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {slot.startTime} -{' '}
                            {slot.endTime}
                          </div>
                        </td>

                        {DAYS_OF_WEEK.map(
                          day => {
                            const entry =
                              getEntryForSlot(
                                day,
                                slot.periodNumber
                              );

                            const subject =
                              entry
                                ? getSubject(
                                    entry.subjectId
                                  )
                                : undefined;

                            const teacher =
                              entry
                                ? getTeacher(
                                    entry.teacherId
                                  )
                                : undefined;

                            return (
                              <td
                                key={day}
                                onClick={() =>
                                  handleCellClick(
                                    day,
                                    slot.periodNumber
                                  )
                                }
                                className={`p-2 border-r border-slate-100 align-top ${
                                  isAdmin
                                    ? 'cursor-pointer hover:bg-blue-50/20'
                                    : ''
                                }`}
                              >

                                {entry ? (
                                  <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50">

                                    <div className="flex items-center justify-between mb-1">

                                      <span className="text-xs font-bold text-blue-700">
                                        {subject?.name ||
                                          'Unknown Subject'}
                                      </span>

                                      {subject && (
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-blue-700">
                                          {subject.code}
                                        </span>
                                      )}

                                    </div>

                                    <div className="text-[11px] text-slate-700 font-medium truncate">

                                      {viewMode ===
                                      'by_teacher'
                                        ? `Class ${
                                            sections.find(
                                              section =>
                                                section.id ===
                                                entry.sectionId
                                            )?.name ||
                                            entry.sectionId
                                          }`
                                        : teacher?.name ||
                                          'Faculty Member'}

                                    </div>

                                  </div>
                                ) : (
                                  <div className="h-16 rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40 flex items-center justify-center text-[11px] text-slate-400 italic">
                                    Free Period
                                  </div>
                                )}

                              </td>
                            );
                          }
                        )}

                      </tr>
                    </React.Fragment>
                  );
                }
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* ====================================================== */}
      {/* FOOTER */}
      {/* ====================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">

        <div className="flex flex-wrap items-center gap-3">

          <span className="font-semibold text-slate-700">
            Subjects:
          </span>

          {subjects.map(subject => (
            <div
              key={subject.id}
              className="flex items-center gap-1.5"
            >
              <span className="w-3 h-3 rounded-full border bg-blue-50 border-blue-200" />

              <span className="text-slate-600">
                {subject.name}
              </span>
            </div>
          ))}

        </div>

        <div className="text-[11px] text-slate-400">
          Showing {currentEntries.length} generated periods · Academic Year 2026-27
        </div>
      </div>

      {/* ====================================================== */}
      {/* EDIT MODAL */}
      {/* ====================================================== */}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() =>
          !isSaving &&
          setIsEditModalOpen(false)
        }
        title={`Edit Slot — ${
          selectedSection?.name ||
          editingCell?.sectionId ||
          ''
        } (${editingCell?.day}, Period ${
          editingCell?.period || ''
        })`}
        subtitle="Modify subject assignment and faculty with backend validation"
      >

        {editingCell && (
          <form
            onSubmit={handleSaveCell}
            className="space-y-4"
          >

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">

              <div>
                <span className="text-slate-400 block text-[11px]">
                  Class & Day
                </span>

                <span className="font-bold text-slate-800">
                  {selectedSection?.name ||
                    editingCell.sectionId}{' '}
                  · {editingCell.day}
                </span>
              </div>

              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">
                  Period Slot
                </span>

                <span className="font-bold text-slate-800">
                  Period {editingCell.period}
                </span>
              </div>

            </div>

            {/* SUBJECT */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Subject
              </label>

              <select
                value={editingCell.subjectId}
                onChange={e =>
                  setEditingCell({
                    ...editingCell,
                    subjectId:
                      e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl"
              >

                {subjects.map(
                  subject => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name} (
                      {subject.code})
                    </option>
                  )
                )}

              </select>
            </div>

            {/* TEACHER */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Teacher
              </label>

              <select
                value={editingCell.teacherId}
                onChange={e =>
                  handleTeacherSelectionChange(
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl"
              >

                {teachers.map(
                  teacher => (
                    <option
                      key={teacher.id}
                      value={teacher.id}
                    >
                      {teacher.name}
                    </option>
                  )
                )}

              </select>
            </div>

            {/* CONFLICT */}

            {simulatedConflict ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">

                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />

                  <span>
                    Teacher Conflict Detected
                  </span>
                </div>

                <p className="text-[11px] leading-relaxed">
                  {simulatedConflict.message}
                </p>

              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                <span>
                  No faculty conflict detected for this period.
                </span>

              </div>
            )}

            {/* BUTTONS */}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">

              <button
                type="button"
                disabled={isSaving}
                onClick={() =>
                  setIsEditModalOpen(false)
                }
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
              >
                {isSaving
                  ? 'Saving...'
                  : 'Save Change'}
              </button>

            </div>

          </form>
        )}

      </Modal>
    </div>
  );
};