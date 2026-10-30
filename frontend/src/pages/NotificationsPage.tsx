import React, { useMemo, useState } from 'react';
import { Bell, CheckCheck, CalendarDays, ClipboardList, Info, Search, SlidersHorizontal } from 'lucide-react';

type NotificationFilter = 'all' | 'unread' | 'read';

/** Notification centre UI shell. Data and read-state persistence will come from the backend. */
export const NotificationsPage: React.FC = () => {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // No mock notifications: populate this collection from the authenticated API in the backend phase.
  const notifications: Array<{
    id: string;
    title: string;
    message: string;
    category: 'leave' | 'timetable' | 'system';
    createdAt: string;
    read: boolean;
  }> = [];

  const visibleNotifications = useMemo(() => notifications.filter((notification) => {
    const matchesFilter = filter === 'all' || (filter === 'unread' ? !notification.read : notification.read);
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${notification.title} ${notification.message}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  }), [notifications, filter, search]);

  const categoryIcon = (category: 'leave' | 'timetable' | 'system') => {
    if (category === 'leave') return CalendarDays;
    if (category === 'timetable') return ClipboardList;
    return Info;
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-blue-700"><Bell className="h-4 w-4" /> Updates and activity</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Stay informed about leave applications, timetable activity and important school updates.</p>
      </div>
      <button type="button" disabled title="Available when notifications are connected to the backend" className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400 shadow-sm"><CheckCheck className="h-4 w-4" /> Mark all as read</button>
    </div>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-semibold text-slate-900">Your activity</h2><p className="mt-0.5 text-xs text-slate-500">Only notifications authorized for your signed-in account should appear here.</p></div>
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1 sm:w-56 sm:flex-none"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <button type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Filter</span></button>
        </div>
      </div>
      {showFilters && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-3"><span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Show</span>{(['all', 'unread', 'read'] as NotificationFilter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>{value === 'all' ? 'All notifications' : value}</button>)}</div>}
      {visibleNotifications.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Bell className="h-7 w-7" /><span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-300" /></div>
        <h3 className="mt-4 font-semibold text-slate-900">You’re all caught up</h3>
        <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">No notifications are loaded yet. New leave requests and school activity will show here after the notification API is connected.</p>
        <div className="mt-4 inline-flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" /><span>This is the frontend layout only. Notification delivery, unread counts, and read-state updates will be implemented with the backend and database.</span></div>
      </div> : <div className="divide-y divide-slate-100">{visibleNotifications.map((notification) => { const Icon = categoryIcon(notification.category); return <article key={notification.id} className={`flex gap-3 px-4 py-4 sm:px-5 ${notification.read ? '' : 'bg-blue-50/30'}`}><div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{notification.title}</h3>{!notification.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}</div><p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p><p className="mt-2 text-xs text-slate-400">{notification.createdAt}</p></div><button type="button" disabled title="Available when notifications are connected to the backend" className="self-start rounded-lg px-2 py-1 text-xs font-medium text-slate-400">{notification.read ? 'Read' : 'Mark read'}</button></article>; })}</div>}
    </section>
  </div>;
};
