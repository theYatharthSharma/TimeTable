
import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import type { Standard, Section } from '../types';
import { sectionService } from '../services/sectionService';
import { Modal } from '../components/common/Modal';

interface ClassesSectionsPageProps {
  onShowToast: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  openAddModalOnMount?: boolean;
}

export const ClassesSectionsPage: React.FC<ClassesSectionsPageProps> = ({
  onShowToast,
  openAddModalOnMount = false,
}) => {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isSectionModalOpen, setIsSectionModalOpen] =
    useState(openAddModalOnMount);
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [sectionFormData, setSectionFormData] = useState({
    standardId: '',
    name: 'A',
    roomNumber: '',
  });

  const [newStandardLevel, setNewStandardLevel] = useState(11);
  const [newStandardName, setNewStandardName] = useState('');

  const loadAcademicData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [loadedStandards, loadedSections] = await Promise.all([
        sectionService.getStandards(),
        sectionService.getSections(),
      ]);

      setStandards(loadedStandards);
      setSections(loadedSections);
    } catch (error) {
      onShowToast(
        error instanceof Error
          ? error.message
          : 'Failed to load standards and sections.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [onShowToast]);

  useEffect(() => {
    void loadAcademicData();
  }, [loadAcademicData]);

  const handleOpenAddSection = (standardId?: string) => {
    setEditingSection(null);
    setSectionFormData({
      standardId: standardId ?? standards[0]?.id ?? '',
      name: 'A',
      roomNumber: '',
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionFormData({
      standardId: section.standardId,
      name: section.name,
      roomNumber: section.roomNumber ?? '',
    });
    setIsSectionModalOpen(true);
  };

  const handleDeleteStandard = async (standard: Standard) => {
    if (!window.confirm(`Delete ${standard.name}? This is allowed only when no sections, subject/teacher assignments, or timetable entries depend on it.`)) return;
    setIsSaving(true);
    try {
      await sectionService.deleteStandard(standard.id);
      setStandards(current => current.filter(item => item.id !== standard.id));
      onShowToast(`${standard.name} deleted.`, 'success');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Failed to delete standard.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = async (section: Section) => {
    if (!window.confirm(`Delete Section ${section.name}?`)) return;

    try {
      await sectionService.deleteSection(section.id);
      setSections((current) =>
        current.filter((item) => item.id !== section.id)
      );
      onShowToast(`Section ${section.name} deleted.`, 'success');
    } catch (error) {
      onShowToast(
        error instanceof Error ? error.message : 'Failed to delete section.',
        'error'
      );
    }
  };

  const handleSaveSection = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = sectionFormData.name.trim().toUpperCase();
    const standardId = sectionFormData.standardId;

    if (!standardId) {
      onShowToast('Please select a standard first.', 'error');
      return;
    }

    if (!name) {
      onShowToast('Please enter a section name.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      if (editingSection) {
        const updated = await sectionService.updateSection(
          editingSection.id,
          {
            name,
            roomNumber: sectionFormData.roomNumber.trim() || undefined,
          }
        );

        setSections((current) =>
          current.map((item) =>
            item.id === updated.id ? updated : item
          )
        );

        onShowToast('Section updated successfully.', 'success');
      } else {
        const created = await sectionService.addSection(
          standardId,
          name,
          sectionFormData.roomNumber.trim() || undefined
        );

        setSections((current) => [...current, created]);
        onShowToast('Section created successfully.', 'success');
      }

      setIsSectionModalOpen(false);
      setEditingSection(null);
    } catch (error) {
      onShowToast(
        error instanceof Error ? error.message : 'Failed to save section.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStandard = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!Number.isInteger(newStandardLevel) ||
        newStandardLevel < 1 ||
        newStandardLevel > 12) {
      onShowToast('Enter a standard level between 1 and 12.', 'error');
      return;
    }

    if (standards.some((standard) => standard.level === newStandardLevel)) {
      onShowToast(`Standard ${newStandardLevel} already exists.`, 'error');
      return;
    }

    setIsSaving(true);

    try {
      const standard = await sectionService.addStandard(
        newStandardLevel,
        newStandardName.trim() || `Standard ${newStandardLevel}`
      );

      setStandards((current) =>
        [...current, standard].sort((a, b) => a.level - b.level)
      );

      setIsStandardModalOpen(false);
      setNewStandardName('');
      onShowToast(
        `Standard ${standard.level} created. Add its sections when ready.`,
        'success'
      );
    } catch (error) {
      // Reload in case the standard was created but section creation failed.
      await loadAcademicData();

      onShowToast(
        error instanceof Error ? error.message : 'Failed to create standard.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Classes &amp; Sections
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your school's standards and sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => setIsStandardModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Standard
          </button>

          <button
            type="button"
            disabled={standards.length === 0 || isSaving}
            onClick={() => handleOpenAddSection()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Section
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading standards and sections...
        </div>
      ) : standards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Layers className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <h2 className="font-semibold text-slate-800">
            No standards found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add a standard to begin setting up your school's classes.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {standards.map((standard) => {
            const standardSections = sections.filter(
              (section) => section.standardId === standard.id
            );

            return (
              <div
                key={standard.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
                      {standard.level}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {standard.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {standardSections.length} section(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void handleDeleteStandard(standard)}
                      title="Delete standard"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                    >
                      Delete Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAddSection(standard.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Section
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                  {standardSections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          Section {section.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {section.roomNumber
                            ? `Room ${section.roomNumber}`
                            : 'No room assigned'}
                        </p>
                      </div>

                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSection(section)}
                          title="Edit section"
                          className="rounded p-1 text-slate-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSection(section)}
                          title="Delete section"
                          className="rounded p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {standardSections.length === 0 && (
                    <p className="col-span-full py-5 text-center text-xs italic text-slate-400">
                      No sections have been added to this standard yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => {
          if (!isSaving) setIsSectionModalOpen(false);
        }}
        title={editingSection ? 'Edit Section' : 'Add New Section'}
        subtitle="Choose a standard and enter the section details."
      >
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Standard
            </label>
            <select
              required
              value={sectionFormData.standardId}
              disabled={!!editingSection || isSaving}
              onChange={(event) =>
                setSectionFormData((current) => ({
                  ...current,
                  standardId: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
            >
              <option value="">Select a standard</option>
              {standards.map((standard) => (
                <option key={standard.id} value={standard.id}>
                  {standard.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Section Name
            </label>
            <input
              required
              maxLength={2}
              value={sectionFormData.name}
              onChange={(event) =>
                setSectionFormData((current) => ({
                  ...current,
                  name: event.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. A"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Room Number (optional)
            </label>
            <input
              value={sectionFormData.roomNumber}
              onChange={(event) =>
                setSectionFormData((current) => ({
                  ...current,
                  roomNumber: event.target.value,
                }))
              }
              placeholder="e.g. 101"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsSectionModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving
                ? 'Saving...'
                : editingSection
                  ? 'Save Changes'
                  : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isStandardModalOpen}
        onClose={() => {
          if (!isSaving) setIsStandardModalOpen(false);
        }}
        title="Add New Standard"
        subtitle="Create a standard. Add its sections separately."
      >
        <form onSubmit={handleAddStandard} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Standard Level
            </label>
            <input
              type="number"
              min={1}
              max={12}
              required
              value={newStandardLevel}
              onChange={(event) =>
                setNewStandardLevel(Number(event.target.value))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Display Name (optional)
            </label>
            <input
              value={newStandardName}
              onChange={(event) => setNewStandardName(event.target.value)}
              placeholder={`Standard ${newStandardLevel}`}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setIsStandardModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Standard'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
