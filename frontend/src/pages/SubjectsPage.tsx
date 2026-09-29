import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { Subject } from '../types';
import { subjectService } from '../services/subjectService';
import { sectionService } from '../services/sectionService';
import { Modal } from '../components/common/Modal';

interface SubjectsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openAddModalOnMount?: boolean;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onShowToast, openAddModalOnMount = false }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => subjectService.getSubjects());
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(openAddModalOnMount);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    standardIds: [6, 7, 8, 9, 10],
    weeklyPeriods: 5,
  });

  const standards = sectionService.getStandards();

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      standardIds: [6, 7, 8, 9, 10],
      weeklyPeriods: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setFormData({
      name: s.name,
      code: s.code,
      standardIds: [...s.standardIds],
      weeklyPeriods: s.weeklyPeriods,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      subjectService.deleteSubject(id);
      setSubjects(subjectService.getSubjects());
      onShowToast(`Deleted subject ${name}`, 'info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      onShowToast('Please specify subject name and code.', 'error');
      return;
    }

    if (editingSubject) {
      subjectService.updateSubject(editingSubject.id, {
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        standardIds: formData.standardIds,
        weeklyPeriods: formData.weeklyPeriods,
      });
      onShowToast(`Updated ${formData.name}`, 'success');
    } else {
      subjectService.addSubject({
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        standardIds: formData.standardIds,
        weeklyPeriods: formData.weeklyPeriods,
      });
      onShowToast(`Added subject ${formData.name}`, 'success');
    }

    setSubjects(subjectService.getSubjects());
    setIsModalOpen(false);
  };

  const filteredSubjects = subjects.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subjects or codes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono tabular-nums">
          {filteredSubjects.length} subjects configured
        </span>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map(s => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${s.colorBg} ${s.colorText} ${s.colorBorder}`}
                  >
                    {s.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{s.name}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit subject"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Weekly Periods:
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {s.weeklyPeriods} periods / week
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Applicable Standards:
                  </span>
                  <span className="font-medium text-slate-700">
                    Standards {s.standardIds.join(', ')}
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

      {/* Add / Edit Subject Modal */}
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
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Code (Acronym)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="e.g. MATH"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Weekly Period Requirement (per Section)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.weeklyPeriods}
                onChange={e =>
                  setFormData({ ...formData, weeklyPeriods: Number(e.target.value) })
                }
                className="w-24 px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
              <span className="text-xs text-slate-500">periods per week per section</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Standards Applying to This Subject
            </label>
            <div className="flex flex-wrap gap-2">
              {standards.map(s => {
                const isSelected = formData.standardIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const newIds = isSelected
                        ? formData.standardIds.filter(id => id !== s.id)
                        : [...formData.standardIds, s.id];
                      setFormData({ ...formData, standardIds: newIds });
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.name}
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
              {editingSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
