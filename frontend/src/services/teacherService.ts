import { Teacher } from '../types';
import { INITIAL_TEACHERS } from '../data/mockData';

const TEACHERS_KEY = 'timegen_teachers';

export const teacherService = {
  getTeachers(): Teacher[] {
    const saved = localStorage.getItem(TEACHERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_TEACHERS;
  },

  saveTeachers(teachers: Teacher[]): void {
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
  },

  getTeacherById(id: string): Teacher | undefined {
    return this.getTeachers().find(t => t.id === id);
  },

  addTeacher(teacher: Omit<Teacher, 'id'>): Teacher {
    const list = this.getTeachers();
    const newTeacher: Teacher = {
      ...teacher,
      id: `t_${Date.now()}`,
    };
    list.push(newTeacher);
    this.saveTeachers(list);
    return newTeacher;
  },

  updateTeacher(id: string, updates: Partial<Teacher>): Teacher | undefined {
    const list = this.getTeachers();
    const index = list.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    const updated = { ...list[index], ...updates };
    list[index] = updated;
    this.saveTeachers(list);
    return updated;
  },

  deleteTeacher(id: string): boolean {
    const list = this.getTeachers();
    const filtered = list.filter(t => t.id !== id);
    if (filtered.length !== list.length) {
      this.saveTeachers(filtered);
      return true;
    }
    return false;
  },

  resetToDefault(): void {
    localStorage.removeItem(TEACHERS_KEY);
  },
};
