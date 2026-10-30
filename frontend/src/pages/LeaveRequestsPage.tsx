import React, { useMemo, useState } from 'react';
import { CalendarCheck, Search, Filter, Clock3, CheckCircle2, XCircle, CalendarDays, Info } from 'lucide-react';

type LeaveStatus = 'all' | 'pending' | 'approved' | 'rejected';

/**
 * Principal leave-management UI shell.
 * Requests are intentionally not seeded with mock data. Connect this page to
 * the authenticated leave-request API when backend/database work begins.
 */
export const LeaveRequestsPage: React.FC = () => {
  const [status, setStatus] = useState<LeaveStatus>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Empty until loaded from the backend; no hardcoded teacher/request records.
  const requests: Array<{
    id: string;
    teacherName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: Exclude<LeaveStatus, 'all'>;
  }> = [];

  const filteredRequests = useMemo(() => requests.filter((request) => {
    const matchesStatus = status === 'all' || request.status === status;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [request.teacherName, request.leaveType, request.reason]
      .some((value) => value.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [requests, search, status]);

  const statusClass = (value: string) => {
    if (value === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    if (value === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-600/20';
    return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700"><CalendarCheck className="h-4 w-4" /> Staff management</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Leave Requests</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Review teachers’ leave applications and manage decisions for your school.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
          <Clock3 className="h-4 w-4 text-amber-500" /> <span>Pending review</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold tabular-nums">—</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'All requests', icon: CalendarDays, value: '—', tone: 'text-blue-600 bg-blue-50' },
          { label: 'Pending review', icon: Clock3, value: '—', tone: 'text-amber-600 bg-amber-50' },
          { label: 'Processed', icon: CheckCircle2, value: '—', tone: 'text-emerald-600 bg-emerald-50' },
        ].map((item) => {
          const Icon = item.icon;
          return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-500">{item.label}</span><span className={`rounded-xl p-2 ${item.tone}`}><Icon className="h-4 w-4" /></span></div>
            <div className="mt-3 text-2xl font-bold text-slate-900">{item.value}</div>
            <p className="mt-1 text-xs text-slate-400">Will update from school records</p>
          </div>;
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold text-slate-900">Applications</h2><p className="mt-0.5 text-xs text-slate-500">Requests will appear here when connected to the backend.</p></div>
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1 sm:w-64 sm:flex-none"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search teacher or reason" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Filter className="h-4 w-4" /><span className="hidden sm:inline">Filter</span></button>
          </div>
        </div>
        {showFilters && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
          {(['all', 'pending', 'approved', 'rejected'] as LeaveStatus[]).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${status === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>{value === 'all' ? 'All statuses' : value}</button>)}
        </div>}
        {filteredRequests.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><CalendarCheck className="h-7 w-7" /></div>
          <h3 className="mt-4 font-semibold text-slate-900">No leave requests to display</h3>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">There are no loaded requests matching your filters. Once the leave-request API is connected, teachers’ applications for your school will appear here.</p>
          <div className="mt-4 inline-flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>This screen currently contains no sample records. Approve and reject actions will be enabled after the backend supports them.</span></div>
        </div> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-100 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Teacher</th><th className="px-5 py-3 font-semibold">Leave type</th><th className="px-5 py-3 font-semibold">Dates</th><th className="px-5 py-3 font-semibold">Reason</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredRequests.map((request) => <tr key={request.id}><td className="px-5 py-4 font-medium text-slate-900">{request.teacherName}</td><td className="px-5 py-4 text-slate-600">{request.leaveType}</td><td className="px-5 py-4 whitespace-nowrap text-slate-600">{request.startDate} – {request.endDate}</td><td className="max-w-xs px-5 py-4 text-slate-600">{request.reason}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusClass(request.status)}`}>{request.status}</span></td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" disabled className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 opacity-50"><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button><button type="button" disabled className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 opacity-50"><XCircle className="h-3.5 w-3.5" /> Reject</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};
