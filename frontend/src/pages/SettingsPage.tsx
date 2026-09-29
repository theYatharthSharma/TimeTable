import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Calendar, Clock, School, Check } from 'lucide-react';
import { SchoolSettings, DayOfWeek } from '../types';
import { settingsService } from '../services/settingsService';
import { DAYS_OF_WEEK } from '../data/mockData';

interface SettingsPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<SchoolSettings>(() => settingsService.getSettings());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsService.updateSettings(settings);
    onShowToast('School configuration updated successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            School Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global academic calendar, bell schedule, and operational constraints.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Identity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <School className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Institutional Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Name
              </label>
              <input
                type="text"
                required
                value={settings.schoolName}
                onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                required
                value={settings.academicYear}
                onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Bell Schedule Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Daily Bell Schedule & Periods</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Periods Per Day
              </label>
              <select
                value={settings.periodsPerDay}
                onChange={e =>
                  setSettings({ ...settings, periodsPerDay: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 tabular-nums"
              >
                <option value={6}>6 Periods (Standard)</option>
                <option value={7}>7 Periods</option>
                <option value={8}>8 Periods</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Period Duration (Minutes)
              </label>
              <input
                type="number"
                min="30"
                max="60"
                value={settings.periodDurationMin}
                onChange={e =>
                  setSettings({ ...settings, periodDurationMin: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                School Start Time
              </label>
              <input
                type="text"
                value={settings.startTime}
                onChange={e => setSettings({ ...settings, startTime: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Working Days</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const isSelected = settings.workingDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const newDays = isSelected
                      ? settings.workingDays.filter(d => d !== day)
                      : [...settings.workingDays, day];
                    setSettings({ ...settings, workingDays: newDays });
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
