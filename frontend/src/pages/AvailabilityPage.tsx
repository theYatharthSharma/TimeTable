import React, { useEffect, useMemo, useState } from 'react';
import { Save, RotateCcw, Sliders } from 'lucide-react';
import type { DayOfWeek, Teacher, TeacherAvailability } from '../types';
import { teacherService } from '../services/teacherService';
import { availabilityService } from '../services/availabilityService';
import { DAYS_OF_WEEK, PERIOD_SLOTS } from '../data/mockData';

interface AvailabilityPageProps { onShowToast: (message: string, type: 'success' | 'error' | 'info') => void; }
function emptyAvailability(teacherId: string, maxPeriodsPerDay: number): TeacherAvailability {
  return { teacherId, maxPeriodsPerDay, schedule: {} as TeacherAvailability['schedule'] };
}
export const AvailabilityPage: React.FC<AvailabilityPageProps> = ({ onShowToast }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [availability, setAvailability] = useState<TeacherAvailability | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  useEffect(() => {
    let cancelled = false;
    void teacherService.getTeachers().then(async result => {
      if (cancelled) return;
      setTeachers(result);
      if (result[0]) {
        setSelectedTeacherId(result[0].id);
        const record = await availabilityService.getTeacherAvailability(result[0].id);
        if (!cancelled) setAvailability(record);
      }
    }).catch(error => onShowToast(error instanceof Error ? error.message : 'Unable to load teachers.', 'error'))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [onShowToast]);

  const loadTeacherAvailability = async (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    if (!teacherId) { setAvailability(null); return; }
    setIsLoading(true);
    try { setAvailability(await availabilityService.getTeacherAvailability(teacherId)); }
    catch (error) { setAvailability(null); onShowToast(error instanceof Error ? error.message : 'Unable to load availability.', 'error'); }
    finally { setIsLoading(false); }
  };

  const setSlot = (day: DayOfWeek, period: number, available: boolean) => {
    setAvailability(current => {
      if (!current) return current;
      const daySchedule = { ...(current.schedule[day] ?? {}) };
      daySchedule[period] = available;
      return { ...current, schedule: { ...current.schedule, [day]: daySchedule } };
    });
  };
  const setDay = (day: DayOfWeek, available: boolean) => {
    setAvailability(current => {
      if (!current) return current;
      const daySchedule: Record<number, boolean> = {};
      for (let p = 1; p <= PERIOD_SLOTS.length; p++) daySchedule[p] = available;
      return { ...current, schedule: { ...current.schedule, [day]: daySchedule } };
    });
  };
  const totalSlots = DAYS_OF_WEEK.length * PERIOD_SLOTS.length;
  const totalAvailableSlots = useMemo(() => {
    if (!availability) return 0;
    let total = 0;
    DAYS_OF_WEEK.forEach(day => PERIOD_SLOTS.forEach(slot => {
      if (availability.schedule[day]?.[slot.periodNumber] !== false) total++;
    }));
    return total;
  }, [availability]);
  const handleSave = async () => {
    if (!availability) return;
    setIsSaving(true);
    try { setAvailability(await availabilityService.updateAvailability(availability)); onShowToast(`Saved availability preferences for ${selectedTeacher?.name ?? 'teacher'}.`, 'success'); }
    catch (error) { onShowToast(error instanceof Error ? error.message : 'Unable to save availability.', 'error'); }
    finally { setIsSaving(false); }
  };

  if (isLoading && !availability) return <div className="p-10 text-center text-sm text-slate-500">Loading teacher availability...</div>;
  if (!teachers.length) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">No teachers have been added for this school yet.</div>;
  if (!availability) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Availability could not be loaded. Select a teacher to retry.</div>;

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Teacher Availability</h1><p className="mt-1 text-xs text-slate-500">Availability is saved to the selected school's database.</p></div>
      <button type="button" disabled={isSaving} onClick={() => void handleSave()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{isSaving ? 'Saving...' : 'Save Preferences'}</button>
    </div>
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div><label className="mb-1 block text-xs font-semibold text-slate-700">Select Faculty Member</label><select value={selectedTeacherId} onChange={e => void loadTeacherAvailability(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:w-72">{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><Sliders className="h-4 w-4 text-slate-400" /><label className="text-xs font-semibold text-slate-700" htmlFor="max-periods">Max periods/day</label><select id="max-periods" value={availability.maxPeriodsPerDay} onChange={e => setAvailability({ ...availability, maxPeriodsPerDay: Number(e.target.value) })} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">{[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4"><span className="text-xs text-slate-500">{totalAvailableSlots} / {totalSlots} slots available</span><button type="button" onClick={() => DAYS_OF_WEEK.forEach(day => setDay(day, true))} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"><RotateCcw className="h-3 w-3" />Mark All Available</button></div>
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white"><div className="overflow-x-auto"><table className="w-full border-collapse text-left text-xs"><thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-600"><tr><th className="px-4 py-3">Day</th>{PERIOD_SLOTS.map(slot => <th key={slot.periodNumber} className="min-w-24 px-2 py-3 text-center">{slot.label}<div className="text-[10px] font-normal lowercase text-slate-400">{slot.startTime}</div></th>)}<th className="px-4 py-3">Quick action</th></tr></thead><tbody className="divide-y divide-slate-100">{DAYS_OF_WEEK.map(day => <tr key={day}><td className="px-4 py-3 font-semibold text-slate-900">{day}</td>{PERIOD_SLOTS.map(slot => { const active = availability.schedule[day]?.[slot.periodNumber] !== false; return <td key={slot.periodNumber} className="px-2 py-2 text-center"><button type="button" aria-pressed={active} onClick={() => setSlot(day, slot.periodNumber, !active)} className={`w-full rounded-lg border px-2 py-2 font-semibold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{active ? 'Available' : 'Unavailable'}</button></td>; })}<td className="px-3 py-2"><div className="flex gap-1"><button type="button" onClick={() => setDay(day, true)} className="rounded-lg px-2 py-1 text-emerald-700 hover:bg-emerald-50">All in</button><button type="button" onClick={() => setDay(day, false)} className="rounded-lg px-2 py-1 text-rose-700 hover:bg-rose-50">All out</button></div></td></tr>)}</tbody></table></div></div>
  </div>;
};
