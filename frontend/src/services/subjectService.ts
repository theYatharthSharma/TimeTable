import { Subject } from '../types';
import { INITIAL_SUBJECTS } from '../data/mockData';

const SUBJECTS_KEY = 'timegen_subjects';

const COLOR_PALETTES = [
  { bg: 'bg-blue-50/90', text: 'text-blue-700', border: 'border-blue-200/80' },
  { bg: 'bg-emerald-50/90', text: 'text-emerald-700', border: 'border-emerald-200/80' },
  { bg: 'bg-indigo-50/90', text: 'text-indigo-700', border: 'border-indigo-200/80' },
  { bg: 'bg-amber-50/90', text: 'text-amber-800', border: 'border-amber-200/80' },
  { bg: 'bg-teal-50/90', text: 'text-teal-700', border: 'border-teal-200/80' },
  { bg: 'bg-rose-50/90', text: 'text-rose-700', border: 'border-rose-200/80' },
  { bg: 'bg-purple-50/90', text: 'text-purple-700', border: 'border-purple-200/80' },
  { bg: 'bg-sky-50/90', text: 'text-sky-700', border: 'border-sky-200/80' },
];

export const subjectService = {
  getSubjects(): Subject[] {
    const saved = localStorage.getItem(SUBJECTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_SUBJECTS;
  },

  saveSubjects(subjects: Subject[]): void {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(subjects));
  },

  getSubjectById(id: string): Subject | undefined {
    return this.getSubjects().find(s => s.id === id);
  },

  addSubject(subject: Omit<Subject, 'id' | 'colorBg' | 'colorText' | 'colorBorder'>): Subject {
    const list = this.getSubjects();
    const color = COLOR_PALETTES[list.length % COLOR_PALETTES.length];
    const newSub: Subject = {
      ...subject,
      id: `sub_${Date.now()}`,
      colorBg: color.bg,
      colorText: color.text,
      colorBorder: color.border,
    };
    list.push(newSub);
    this.saveSubjects(list);
    return newSub;
  },

  updateSubject(id: string, updates: Partial<Subject>): Subject | undefined {
    const list = this.getSubjects();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    this.saveSubjects(list);
    return updated;
  },

  deleteSubject(id: string): boolean {
    const list = this.getSubjects();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length !== list.length) {
      this.saveSubjects(filtered);
      return true;
    }
    return false;
  },
};
