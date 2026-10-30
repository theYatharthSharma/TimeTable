import React, { useState } from 'react';
import { CalendarPlus, Info, Send } from 'lucide-react';

/** Frontend-only teacher leave request form; submission is enabled after the API is implemented. */
export const TeacherLeavePage: React.FC = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: React.FormEvent) => { event.preventDefault(); setMessage('Leave submission will be enabled when the backend endpoint is connected. No request has been saved.'); };
  return <div className="space-y-6">
    <div><div className="flex items-center gap-2 text-sm font-medium text-blue-700"><CalendarPlus className="h-4 w-4" /> Time off</div><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">My Leave Requests</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Submit a leave application and track its review status.</p></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">New leave application</h2>
        <label className="block text-sm font-medium text-slate-700">Leave type<select required value={leaveType} onChange={e=>setLeaveType(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"><option value="">Select leave type</option><option value="casual">Casual leave</option><option value="sick">Sick leave</option><option value="personal">Personal leave</option><option value="other">Other</option></select></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Start date<input required type="date" value={startDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setStartDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label><label className="block text-sm font-medium text-slate-700">End date<input required type="date" value={endDate} min={startDate || new Date().toISOString().slice(0,10)} onChange={e=>setEndDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /></label></div>
        <label className="block text-sm font-medium text-slate-700">Reason<textarea required minLength={5} maxLength={1000} rows={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Briefly explain your leave request" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400" /></label>
        {message && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Send className="h-4 w-4" /> Submit request</button>
      </form>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Request history</h2><p className="mt-1 text-sm text-slate-500">Track pending, approved and rejected applications.</p><div className="mt-5 flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 text-center"><CalendarPlus className="h-8 w-8 text-slate-300"/><h3 className="mt-3 text-sm font-semibold text-slate-800">No requests loaded</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Your submitted leave history and decisions will appear here after backend integration.</p></div><div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0"/>The form is a UI preview. It does not save or send a request yet.</div></section>
    </div>
  </div>;
};
