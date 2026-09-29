import { Standard, Section } from '../types';
import { INITIAL_STANDARDS, INITIAL_SECTIONS } from '../data/mockData';

const STANDARDS_KEY = 'timegen_standards';
const SECTIONS_KEY = 'timegen_sections';

export const sectionService = {
  getStandards(): Standard[] {
    const saved = localStorage.getItem(STANDARDS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_STANDARDS;
  },

  saveStandards(standards: Standard[]): void {
    localStorage.setItem(STANDARDS_KEY, JSON.stringify(standards));
  },

  addStandard(level: number, name?: string): Standard {
    const list = this.getStandards();
    const newStd: Standard = {
      id: level,
      level,
      name: name || `Standard ${level}`,
    };
    list.push(newStd);
    list.sort((a, b) => a.level - b.level);
    this.saveStandards(list);
    return newStd;
  },

  getSections(): Section[] {
    const saved = localStorage.getItem(SECTIONS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_SECTIONS;
  },

  saveSections(sections: Section[]): void {
    localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
  },

  getSectionsByStandard(standardId: number): Section[] {
    return this.getSections().filter(sec => sec.standardId === standardId);
  },

  addSection(standardId: number, sectionLetter: string, assignedSubjectIds: string[] = [], assignedTeacherIds: string[] = []): Section {
    const list = this.getSections();
    const cleanLetter = sectionLetter.toUpperCase().trim();
    const id = `${standardId}${cleanLetter}`;
    const newSection: Section = {
      id,
      standardId,
      name: cleanLetter,
      assignedSubjectIds,
      assignedTeacherIds,
    };
    list.push(newSection);
    this.saveSections(list);
    return newSection;
  },

  updateSection(id: string, updates: Partial<Section>): Section | undefined {
    const list = this.getSections();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    this.saveSections(list);
    return updated;
  },

  deleteSection(id: string): boolean {
    const list = this.getSections();
    const filtered = list.filter(s => s.id !== id);
    if (filtered.length !== list.length) {
      this.saveSections(filtered);
      return true;
    }
    return false;
  },
};
