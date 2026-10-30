import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check,
  Calendar,
  Clock,
  BookOpen
} from 'lucide-react';
import { Teacher, DayOfWeek, Standard, Section } from '../types';
import { teacherService } from '../services/teacherService';
import { authService } from '../services/authService';
import { subjectService } from '../services/subjectService';
import { sectionService } from '../services/sectionService';
import { DAYS_OF_WEEK } from '../data/mockData';
import { Modal } from '../components/common/Modal';

interface TeachersPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openAddModalOnMount?: boolean;
}

export const TeachersPage: React.FC<TeachersPageProps> = ({ onShowToast, openAddModalOnMount = false }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<import('../types').Subject[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [teacherPassword, setTeacherPassword] = useState('');
  const isAdmin = authService.getCurrentUser()?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStandardFilter, setSelectedStandardFilter] = useState<string | 'all'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(openAddModalOnMount);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string; email: string; standardIds: string[]; subjectIds: string[]; sectionIds: string[]; workingDays: DayOfWeek[]; maxPeriodsPerDay: number;
  }>({
    name: '',
    email: '',
    standardIds: [],
    subjectIds: [],
    sectionIds: [],
    workingDays: DAYS_OF_WEEK,
    maxPeriodsPerDay: 5,
  });

  const [standards, setStandards] = useState<Standard[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [isLoadingStandards, setIsLoadingStandards] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadAcademicData = async () => {
      setIsLoadingStandards(true);
      try {
        const [loadedStandards, loadedSections, loadedTeachers, loadedSubjects] = await Promise.all([
          sectionService.getStandards(), sectionService.getSections(),
          teacherService.getTeachers(), subjectService.getSubjects(),
        ]);
        if (!cancelled) {
          setStandards(loadedStandards);
          setAllSections(loadedSections);
          setTeachers(loadedTeachers);
          setSubjects(loadedSubjects);
        }
      } catch (error) {
        if (!cancelled) {
          onShowToast(
            error instanceof Error
              ? error.message
              : 'Failed to load standards and sections.',
            'error'
          );
        }
      } finally {
        if (!cancelled) setIsLoadingStandards(false);
      }
    };

    void loadAcademicData();
    return () => {
      cancelled = true;
    };
  }, [onShowToast]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setTeacherPassword('');
    setFormData({
      name: '',
      email: '',
      standardIds: [],
      subjectIds: [],
      sectionIds: [],
      workingDays: DAYS_OF_WEEK,
      maxPeriodsPerDay: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setTeacherPassword('');
    setFormData({
      name: t.name,
      email: t.email,
      standardIds: [...t.standardIds],
      subjectIds: [...t.subjectIds],
      sectionIds: [...t.sectionIds],
      workingDays: [...t.workingDays],
      maxPeriodsPerDay: t.maxPeriodsPerDay,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await teacherService.deleteTeacher(id);
      setTeachers(await teacherService.getTeachers());
      onShowToast(`${name} removed successfully`, 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to delete teacher.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      onShowToast('Please fill in name and email.', 'error');
      return;
    }
    if (!editingTeacher && isAdmin && teacherPassword.length < 8) {
      onShowToast('Set a teacher password with at least 8 characters.', 'error');
      return;
    }

    setIsSaving(true);
    try {
    if (editingTeacher) {
      await teacherService.updateTeacher(editingTeacher.id, {
        name: formData.name,
        email: formData.email,
        standardIds: formData.standardIds,
        subjectIds: formData.subjectIds,
        sectionIds: formData.sectionIds,
        workingDays: formData.workingDays,
        maxPeriodsPerDay: formData.maxPeriodsPerDay,
      });
      onShowToast(`Updated ${formData.name} successfully`, 'success');
    } else {
      await teacherService.addTeacher({
        name: formData.name,
        email: formData.email,
        standardIds: formData.standardIds,
        subjectIds: formData.subjectIds,
        sectionIds: formData.sectionIds,
        workingDays: formData.workingDays,
        maxPeriodsPerDay: formData.maxPeriodsPerDay,
        ...(isAdmin ? { password: teacherPassword } : {}),
      });
      onShowToast(`Added teacher ${formData.name}`, 'success');
    }

    setTeachers(await teacherService.getTeachers());
    setIsModalOpen(false);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to save teacher.', 'error');
    } finally { setIsSaving(false); }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStandard =
      selectedStandardFilter === 'all' ||
      t.standardIds.some(id => String(id) === selectedStandardFilter);
    return matchesSearch && matchesStandard;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Teachers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage faculty profiles, assigned subjects, and teaching capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 whitespace-nowrap">Standard:</span>
          <select
            value={selectedStandardFilter}
            onChange={e =>
              setSelectedStandardFilter(e.target.value === 'all' ? 'all' : e.target.value)
            }
            className="py-1.5 px-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Standards</option>
            {standards.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-mono tabular-nums ml-2">
            ({filteredTeachers.length} teachers)
          </span>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Teacher</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Standard</th>
                <th className="py-3.5 px-4">Subjects</th>
                <th className="py-3.5 px-4">Sections</th>
                <th className="py-3.5 px-4">Max/Day</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map(t => {
                const teacherSubjects = subjects.filter(s => t.subjectIds.includes(s.id));

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Teacher Name & Avatar */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {t.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className="font-semibold text-slate-900">{t.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {t.email}
                    </td>

                    {/* Standard */}
                    <td className="py-3.5 px-4 text-slate-700">
                      Standard {t.standardIds.join(', ')}
                    </td>

                    {/* Subjects */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {teacherSubjects.map(s => (
                          <span
                            key={s.id}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${s.colorBg} ${s.colorText} ${s.colorBorder}`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Sections */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {t.sectionIds.join(', ')}
                    </td>

                    {/* Max periods */}
                    <td className="py-3.5 px-4 text-slate-700 tabular-nums">
                      {t.maxPeriodsPerDay} periods
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit teacher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete teacher"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredTeachers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No teachers found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        subtitle="Configure teacher details, assignments, and daily period constraints"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mr. Rahul Sharma"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. rahul.sharma@greenwood.edu"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {!editingTeacher && isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={teacherPassword}
                onChange={e => setTeacherPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Share this password securely with the teacher. The system stores only a password hash.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard (Grade)
              </label>
              <select
                value={formData.standardIds[0] || ''}
                onChange={e => {
                  const standardId = e.target.value;
                  const validSectionIds = allSections.filter(section => section.standardId === standardId).map(section => section.id);
                  setFormData({ ...formData, standardIds: standardId ? [standardId] : [], sectionIds: validSectionIds.filter(id => formData.sectionIds.includes(id)) });
                }}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {standards.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Periods Per Day
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.maxPeriodsPerDay}
                onChange={e =>
                  setFormData({ ...formData, maxPeriodsPerDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Subjects Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Subjects
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjects.map(s => {
                const isSelected = formData.subjectIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const newSubs = isSelected
                        ? formData.subjectIds.filter(id => id !== s.id)
                        : [...formData.subjectIds, s.id];
                      setFormData({ ...formData, subjectIds: newSubs });
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{s.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sections Assigned */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Sections
            </label>
            <div className="flex flex-wrap gap-2">
              {allSections.filter(section => formData.standardIds.includes(section.standardId)).map(section => {
                const secId = section.id;
                const isSelected = formData.sectionIds.includes(secId);

                return (
                  <button
                    key={secId}
                    type="button"
                    onClick={() => {
                      const newSecs = isSelected
                        ? formData.sectionIds.filter(id => id !== secId)
                        : [...formData.sectionIds, secId];
                      setFormData({
                        ...formData,
                        sectionIds: newSecs,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Section {secId}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Working Days (Mon - Sat)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map(d => {
                const isSelected = formData.workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const newDays = isSelected
                        ? formData.workingDays.filter(day => day !== d)
                        : [...formData.workingDays, d];
                      setFormData({ ...formData, workingDays: newDays.length ? newDays : [d] });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'border-slate-800 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {editingTeacher ? 'Save Changes' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
