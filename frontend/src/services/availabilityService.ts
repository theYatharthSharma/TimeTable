import { TeacherAvailability, DayOfWeek } from '../types';
import { createDefaultAvailability } from '../data/mockData';

const AVAILABILITY_KEY = 'timegen_availability';

export const availabilityService = {
  getAllAvailability(): Record<string, TeacherAvailability> {
    const saved = localStorage.getItem(AVAILABILITY_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return {};
  },

  saveAllAvailability(data: Record<string, TeacherAvailability>): void {
    localStorage.setItem(AVAILABILITY_KEY, JSON.stringify(data));
  },

  getTeacherAvailability(teacherId: string, maxPeriods = 5): TeacherAvailability {
    const all = this.getAllAvailability();
    if (all[teacherId]) {
      return all[teacherId];
    }
    const defaultAvail = createDefaultAvailability(teacherId, maxPeriods);
    all[teacherId] = defaultAvail;
    this.saveAllAvailability(all);
    return defaultAvail;
  },

  updateAvailability(availability: TeacherAvailability): void {
    const all = this.getAllAvailability();
    all[availability.teacherId] = availability;
    this.saveAllAvailability(all);
  },

  toggleSlot(teacherId: string, day: DayOfWeek, period: number): TeacherAvailability {
    const avail = this.getTeacherAvailability(teacherId);
    if (!avail.schedule[day]) {
      avail.schedule[day] = {};
    }
    avail.schedule[day][period] = !avail.schedule[day][period];
    this.updateAvailability(avail);
    return avail;
  },

  setAllDay(teacherId: string, day: DayOfWeek, isAvailable: boolean): TeacherAvailability {
    const avail = this.getTeacherAvailability(teacherId);
    if (!avail.schedule[day]) {
      avail.schedule[day] = {};
    }
    for (let p = 1; p <= 6; p++) {
      avail.schedule[day][p] = isAvailable;
    }
    this.updateAvailability(avail);
    return avail;
  },

  updateMaxPeriods(teacherId: string, maxPeriods: number): TeacherAvailability {
    const avail = this.getTeacherAvailability(teacherId);
    avail.maxPeriodsPerDay = maxPeriods;
    this.updateAvailability(avail);
    return avail;
  },
};
