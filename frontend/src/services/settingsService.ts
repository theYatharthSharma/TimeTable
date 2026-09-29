import { SchoolSettings } from '../types';
import { INITIAL_SCHOOL_SETTINGS } from '../data/mockData';

const SETTINGS_KEY = 'timegen_school_settings';

export const settingsService = {
  getSettings(): SchoolSettings {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_SCHOOL_SETTINGS;
  },

  updateSettings(updates: Partial<SchoolSettings>): SchoolSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  },
};
