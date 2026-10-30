import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import type { Subject, Standard } from '../types';
import { subjectService } from '../services/subjectService';
import { sectionService } from '../services/sectionService';
import { Modal } from '../components/common/Modal';

interface SubjectsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openAddModalOnMount?: boolean;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onShowToast,
  openAddModalOnMount = false,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [standardsError, setStandardsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(openAddModalOnMount);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form state. IDs are populated from standards loaded for the selected school.
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    standardIds: [] as string[],
    weeklyPeriods: 1,
  });

  // Fetch subjects from the backend; no localStorage/mock fallback.
  const loadSubjects = async () => {
    setSubjectsLoading(true);
    try {
      const result = await subjectService.getSubjects();
      setSubjects(Array.isArray(result) ? result : []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load subjects.';
      onShowToast(message, 'error');
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjects();
    // Load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Standards are fetched asynchronously from the backend.
  useEffect(() => {
    let cancelled = false;

    const loadStandards = async () => {
      setStandardsLoading(true);
      setStandardsError(null);

      try {
        const result = await sectionService.getStandards();
        if (!Array.isArray(result)) {
          throw new Error('The standards API did not return a list.');
        }

        if (!cancelled) {
          setStandards(result);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error
            ? error.message
            : 'Unable to load standards.';
          setStandardsError(message);
          setStandards([]);
          console.error('Failed to load standards:', error);
          onShowToast(message, 'error');
        }
      } finally {
        if (!cancelled) setStandardsLoading(false);
      }
    };

    void loadStandards();
    return () => {
      cancelled = true;
    };
  }, [onShowToast]);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      standardIds: [],
      weeklyPeriods: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      standardIds: [...subject.standardIds],
      weeklyPeriods: subject.weeklyPeriods,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await subjectService.deleteSubject(id);
      await loadSubjects();
      onShowToast(`Deleted subject ${name}`, 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Unable to delete subject.', 'error');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = formData.name.trim();
    const code = formData.code.toUpperCase().trim();

    if (!name || !code) {
      onShowToast('Please specify subject name and code.', 'error');
      return;
    }

    if (formData.standardIds.length === 0) {
      onShowToast('Please select at least one standard.', 'error');
      return;
    }

    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject.id, {
          name,
          code,
          standardIds: formData.standardIds,
          weeklyPeriods: formData.weeklyPeriods,
        });
        onShowToast(`Updated ${name}`, 'success');
      } else {
        await subjectService.addSubject({
          name,
          code,
          standardIds: formData.standardIds,
          weeklyPeriods: formData.weeklyPeriods,
        });
        onShowToast(`Added subject ${name}`, 'success');
      }

      await loadSubjects();
      setIsModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save subject.';
      onShowToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Subjects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Curriculum subject codes and weekly period quota requirements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects or codes..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono tabular-nums whitespace-nowrap">
          {filteredSubjects.length} subjects configured
        </span>
      </div>

      {/* Subject cards */}
      {subjectsLoading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-sm text-slate-500">
          Loading subjects from the database...
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-sm text-slate-500">
          {searchQuery ? 'No subjects match your search.' : 'No subjects have been configured for this school yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map(subject => (
            <div
              key={subject.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${subject.colorBg} ${subject.colorText} ${subject.colorBorder}`}>
                      {subject.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{subject.name}</h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(subject)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit subject"
                      aria-label={`Edit ${subject.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(subject.id, subject.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete subject"
                      aria-label={`Delete ${subject.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs gap-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Weekly Periods:
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {subject.weeklyPeriods} periods / week
                    </span>
                  </div>

                  <div className="flex items-start justify-between text-xs gap-3">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Applicable Standards:
                    </span>
                    <span className="font-medium text-slate-700 text-right">
                      Standards {subject.standardIds.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                <span>Scheduling engine constraint</span>
                <span className="font-mono text-emerald-600 font-medium">Strict Requirement</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit subject modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        subtitle="Configure subject curriculum details and weekly allocation quotas"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mathematics"
              value={formData.name}
              onChange={event => setFormData({ ...formData, name: event.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code (Acronym)</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. MATH"
              value={formData.code}
              onChange={event => setFormData({ ...formData, code: event.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Period Requirement (per Section)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.weeklyPeriods}
                onChange={event => setFormData({ ...formData, weeklyPeriods: Number(event.target.value) })}
                className="w-24 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-xs text-slate-500">periods per week per section</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Standards Applying to This Subject</label>
            {standardsLoading ? (
              <p className="text-xs text-slate-500 py-2">Loading standards…</p>
            ) : standardsError ? (
              <div className="text-xs text-rose-600 py-2">
                Could not load standards: {standardsError}
                <button
                  type="button"
                  className="ml-2 underline font-semibold"
                  onClick={() => {
                    setStandardsLoading(true);
                    setStandardsError(null);
                    void sectionService.getStandards()
                      .then(result => {
                        if (!Array.isArray(result)) throw new Error('The standards API did not return a list.');
                        setStandards(result);
                      })
                      .catch(error => {
                        const message = error instanceof Error ? error.message : 'Unable to load standards.';
                        setStandardsError(message);
                        onShowToast(message, 'error');
                      })
                      .finally(() => setStandardsLoading(false));
                  }}
                >
                  Retry
                </button>
              </div>
            ) : standards.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No standards exist for this school yet. Add standards in Classes &amp; Sections first.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {standards.map(standard => {
                  const isSelected = formData.standardIds.includes(standard.id);
                  return (
                    <button
                      key={standard.id}
                      type="button"
                      onClick={() => {
                        const nextIds = isSelected
                          ? formData.standardIds.filter(id => id !== standard.id)
                          : [...formData.standardIds, standard.id];
                        setFormData({ ...formData, standardIds: nextIds });
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {standard.name}
                    </button>
                  );
                })}
              </div>
            )}
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
              disabled={isSaving || standardsLoading || standards.length === 0}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isSaving ? 'Saving...' : editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
