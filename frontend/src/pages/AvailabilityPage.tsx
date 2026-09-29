import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Check,
  Calendar,
  AlertCircle,
  Sliders
} from 'lucide-react';
import { DayOfWeek, TeacherAvailability } from '../types';
import { teacherService } from '../services/teacherService';
import { availabilityService } from '../services/availabilityService';
import { DAYS_OF_WEEK, PERIOD_SLOTS } from '../data/mockData';

interface AvailabilityPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AvailabilityPage: React.FC<AvailabilityPageProps> = ({ onShowToast }) => {
  const teachers = teacherService.getTeachers();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[10]?.id || teachers[0]?.id || 't_11' // default Mr. Rahul Sharma
  );

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  const [availability, setAvailability] = useState<TeacherAvailability>(() =>
    availabilityService.getTeacherAvailability(selectedTeacherId)
  );

  const handleTeacherChange = (id: string) => {
    setSelectedTeacherId(id);
    const avail = availabilityService.getTeacherAvailability(id);
    setAvailability(avail);
  };

  const toggleSlot = (day: DayOfWeek, period: number) => {
    const updated = availabilityService.toggleSlot(selectedTeacherId, day, period);
    setAvailability({ ...updated });
  };

  const handleSetDay = (day: DayOfWeek, isAvailable: boolean) => {
    const updated = availabilityService.setAllDay(selectedTeacherId, day, isAvailable);
    setAvailability({ ...updated });
  };

  const handleMaxPeriodsChange = (newMax: number) => {
    const updated = availabilityService.updateMaxPeriods(selectedTeacherId, newMax);
    setAvailability({ ...updated });
  };

  const handleResetToAllAvailable = () => {
    DAYS_OF_WEEK.forEach(d => {
      availabilityService.setAllDay(selectedTeacherId, d, true);
    });
    const refreshed = availabilityService.getTeacherAvailability(selectedTeacherId);
    setAvailability({ ...refreshed });
    onShowToast(`Reset availability for ${selectedTeacher?.name}`, 'info');
  };

  const handleSave = () => {
    availabilityService.updateAvailability(availability);
    onShowToast(`Saved availability preferences for ${selectedTeacher?.name}`, 'success');
  };

  // Compute stats
  let totalAvailableSlots = 0;
  let totalSlots = DAYS_OF_WEEK.length * 6;
  DAYS_OF_WEEK.forEach(d => {
    for (let p = 1; p <= 6; p++) {
      if (availability.schedule[d]?.[p] !== false) totalAvailableSlots++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Teacher Availability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify working periods, weekly preferences, and maximum daily teaching load.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Teacher Selector Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Faculty Member
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => handleTeacherChange(e.target.value)}
              className="w-full sm:w-72 px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (Std {t.standardIds.join(',')})
                </option>
              ))}
            </select>
          </div>

          {selectedTeacher && (
            <div className="sm:border-l sm:border-slate-200 sm:pl-4 text-xs space-y-0.5">
              <div className="font-semibold text-slate-800">{selectedTeacher.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">{selectedTeacher.email}</div>
              <div className="text-slate-500 text-[11px]">
                Standards: {selectedTeacher.standardIds.join(', ')} · Sections: {selectedTeacher.sectionIds.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Max Periods per day control */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
          <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-slate-700">Max Periods / Day</div>
            <div className="text-[11px] text-slate-400">Hard constraint limit</div>
          </div>
          <select
            value={availability.maxPeriodsPerDay}
            onChange={e => handleMaxPeriodsChange(Number(e.target.value))}
            className="ml-2 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 tabular-nums"
          >
            {[3, 4, 5, 6].map(n => (
              <option key={n} value={n}>
                {n} periods
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Controls & Legend */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-semibold text-slate-700">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300 inline-block"></span>
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-300 inline-block"></span>
            <span className="text-slate-600">Unavailable</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {totalAvailableSlots} / {totalSlots} slots active
          </span>
          <button
            type="button"
            onClick={handleResetToAllAvailable}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Mark All Available</span>
          </button>
        </div>
      </div>

      {/* Availability Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-36">Day of Week</th>
                {PERIOD_SLOTS.map(slot => (
                  <th key={slot.periodNumber} className="py-3.5 px-3 text-center min-w-[110px]">
                    <div>{slot.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal font-mono lowercase">
                      {slot.startTime}
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center w-28">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DAYS_OF_WEEK.map(day => {
                const daySchedule = availability.schedule[day] || {};
                const allDayAvailable = [1, 2, 3, 4, 5, 6].every(p => daySchedule[p] !== false);

                return (
                  <tr key={day} className="hover:bg-slate-50/40 transition-colors">
                    {/* Day name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">{day}</td>

                    {/* Periods 1 to 6 */}
                    {[1, 2, 3, 4, 5, 6].map(pNum => {
                      const isAvailable = daySchedule[pNum] !== false;

                      return (
                        <td key={pNum} className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSlot(day, pNum)}
                            className={`w-full py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isAvailable
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/70 shadow-2xs'
                                : 'bg-rose-50 text-rose-700 border-rose-200/90 hover:bg-rose-100/70'
                            }`}
                            title={`Click to mark ${isAvailable ? 'Unavailable' : 'Available'}`}
                          >
                            <span className="flex items-center gap-1">
                              {isAvailable ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <XCircle className="w-3 h-3 text-rose-500" />
                              )}
                              <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
                            </span>
                          </button>
                        </td>
                      );
                    })}

                    {/* Quick day toggle */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleSetDay(day, !allDayAvailable)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        {allDayAvailable ? 'Block Day' : 'Enable Day'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-900">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Automated Scheduling Rule:</span> Marked unavailable periods will act as a strict hard constraint during AI timetable generation. The engine will guarantee that {selectedTeacher?.name} is never scheduled during blocked slots.
        </div>
      </div>
    </div>
  );
};
