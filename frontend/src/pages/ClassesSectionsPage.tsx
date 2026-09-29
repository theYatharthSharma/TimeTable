import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Users,
  Check,
  GraduationCap
} from 'lucide-react';
import { Standard, Section } from '../types';
import { sectionService } from '../services/sectionService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { Modal } from '../components/common/Modal';

interface ClassesSectionsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  openAddModalOnMount?: boolean;
}

export const ClassesSectionsPage: React.FC<ClassesSectionsPageProps> = ({
  onShowToast,
  openAddModalOnMount = false,
}) => {
  const [standards, setStandards] = useState<Standard[]>(() => sectionService.getStandards());
  const [sections, setSections] = useState<Section[]>(() => sectionService.getSections());

  // Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(openAddModalOnMount);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form State for Section
  const [sectionFormData, setSectionFormData] = useState({
    standardId: 8,
    name: 'D',
    assignedSubjectIds: ['sub_math', 'sub_sci', 'sub_eng', 'sub_soc', 'sub_comp'],
    assignedTeacherIds: [] as string[],
  });

  // Form State for Standard
  const [newStandardLevel, setNewStandardLevel] = useState<number>(11);

  const subjects = subjectService.getSubjects();
  const teachers = teacherService.getTeachers();

  const handleOpenAddSection = (presetStdId?: number) => {
    setEditingSection(null);
    setSectionFormData({
      standardId: presetStdId || 8,
      name: 'D',
      assignedSubjectIds: subjects.map(s => s.id),
      assignedTeacherIds: teachers
        .filter(t => t.standardIds.includes(presetStdId || 8))
        .map(t => t.id),
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (sec: Section) => {
    setEditingSection(sec);
    setSectionFormData({
      standardId: sec.standardId,
      name: sec.name,
      assignedSubjectIds: [...sec.assignedSubjectIds],
      assignedTeacherIds: [...sec.assignedTeacherIds],
    });
    setIsSectionModalOpen(true);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm(`Are you sure you want to delete Section ${id}?`)) {
      sectionService.deleteSection(id);
      setSections(sectionService.getSections());
      onShowToast(`Section ${id} deleted`, 'info');
    }
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionFormData.name.trim()) {
      onShowToast('Please provide a section letter.', 'error');
      return;
    }

    if (editingSection) {
      sectionService.updateSection(editingSection.id, {
        name: sectionFormData.name.toUpperCase().trim(),
        assignedSubjectIds: sectionFormData.assignedSubjectIds,
        assignedTeacherIds: sectionFormData.assignedTeacherIds,
      });
      onShowToast(`Updated Section ${editingSection.id}`, 'success');
    } else {
      sectionService.addSection(
        sectionFormData.standardId,
        sectionFormData.name.toUpperCase().trim(),
        sectionFormData.assignedSubjectIds,
        sectionFormData.assignedTeacherIds
      );
      onShowToast(
        `Added Section ${sectionFormData.standardId}${sectionFormData.name.toUpperCase().trim()}`,
        'success'
      );
    }

    setSections(sectionService.getSections());
    setIsSectionModalOpen(false);
  };

  const handleAddStandard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStandardLevel || newStandardLevel < 1) {
      onShowToast('Please enter a valid standard level.', 'error');
      return;
    }
    const exists = standards.some(s => s.level === newStandardLevel);
    if (exists) {
      onShowToast(`Standard ${newStandardLevel} already exists.`, 'error');
      return;
    }

    sectionService.addStandard(newStandardLevel);
    // Add default Section A
    sectionService.addSection(newStandardLevel, 'A');
    setStandards(sectionService.getStandards());
    setSections(sectionService.getSections());
    setIsStandardModalOpen(false);
    onShowToast(`Added Standard ${newStandardLevel} with Section A`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Classes & Sections
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            School grade structures, divisions, and teacher/subject assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStandardModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Standard</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddSection()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Standards List with Nested Sections */}
      <div className="space-y-6">
        {standards.map(std => {
          const stdSections = sections.filter(s => s.standardId === std.id);

          return (
            <div
              key={std.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden"
            >
              {/* Standard Header */}
              <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {std.level}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{std.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {stdSections.length} Sections · Grade {std.level}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddSection(std.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section to {std.name}</span>
                </button>
              </div>

              {/* Sections Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stdSections.map(sec => {
                  const assignedSubjects = subjects.filter(s =>
                    sec.assignedSubjectIds.includes(s.id)
                  );
                  const assignedTeachers = teachers.filter(t =>
                    t.standardIds.includes(std.id)
                  );

                  return (
                    <div
                      key={sec.id}
                      className="p-4 rounded-xl border border-slate-200/70 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center font-mono">
                              {sec.id}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              Section {sec.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSection(sec)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                              title="Edit section"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSection(sec.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Assigned Subjects */}
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Curriculum Subjects ({assignedSubjects.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {assignedSubjects.map(s => (
                              <span
                                key={s.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${s.colorBg} ${s.colorText} ${s.colorBorder}`}
                              >
                                {s.code}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Assigned Teachers */}
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Assigned Faculty ({assignedTeachers.length})
                          </span>
                          <div className="text-[11px] text-slate-600 truncate">
                            {assignedTeachers.map(t => t.name.replace('Mr. ', '').replace('Mrs. ', '').replace('Ms. ', '')).slice(0, 3).join(', ')}
                            {assignedTeachers.length > 3 ? ` +${assignedTeachers.length - 3} more` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Weekly Periods</span>
                        <span className="font-semibold text-slate-700 tabular-nums">36 slots (6/day)</span>
                      </div>
                    </div>
                  );
                })}

                {stdSections.length === 0 && (
                  <div className="col-span-3 py-6 text-center text-xs text-slate-400 italic">
                    No sections added for this standard yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Section Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingSection ? `Edit Section ${editingSection.id}` : 'Add New Section'}
        subtitle="Specify standard level, section letter, and assigned courses"
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Standard</label>
            <select
              value={sectionFormData.standardId}
              disabled={!!editingSection}
              onChange={e =>
                setSectionFormData({ ...sectionFormData, standardId: Number(e.target.value) })
              }
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 disabled:bg-slate-100"
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
              Section Letter (e.g. A, B, C, D)
            </label>
            <input
              type="text"
              required
              maxLength={2}
              placeholder="e.g. D"
              value={sectionFormData.name}
              onChange={e =>
                setSectionFormData({ ...sectionFormData, name: e.target.value.toUpperCase() })
              }
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Subjects
            </label>
            <div className="space-y-1.5">
              {subjects.map(s => {
                const isSelected = sectionFormData.assignedSubjectIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? sectionFormData.assignedSubjectIds.filter(id => id !== s.id)
                        : [...sectionFormData.assignedSubjectIds, s.id];
                      setSectionFormData({
                        ...sectionFormData,
                        assignedSubjectIds: next.length ? next : [s.id],
                      });
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <span>
                      {s.name} ({s.code})
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {editingSection ? 'Save Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Standard Modal */}
      <Modal
        isOpen={isStandardModalOpen}
        onClose={() => setIsStandardModalOpen(false)}
        title="Add New Standard"
        subtitle="Expand school grade structure (e.g. Standard 11, 12)"
      >
        <form onSubmit={handleAddStandard} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Standard Grade Number
            </label>
            <input
              type="number"
              min="1"
              max="12"
              required
              value={newStandardLevel}
              onChange={e => setNewStandardLevel(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Will automatically create Standard {newStandardLevel} with initial Section A.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStandardModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Add Standard
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
