import React from 'react';
import { BookOpen, GraduationCap, Info, Layers3 } from 'lucide-react';

/** Teacher's own assigned classes and subjects. Populated from authenticated APIs in the backend phase. */
export const TeacherClassesPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-blue-700"><GraduationCap className="h-4 w-4" /> Teaching workspace</div>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">My Classes & Subjects</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">Review the classes, sections and subjects assigned to your teacher account.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><Layers3 className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">Assigned classes & sections</h2><p className="text-sm text-slate-500">Your teaching assignments</p></div></div><div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><p className="text-sm font-medium text-slate-700">No assignments loaded</p><p className="mt-1 text-xs leading-5 text-slate-500">Class and section assignments will appear here when connected to the authenticated API.</p></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-3 text-violet-600"><BookOpen className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">Assigned subjects</h2><p className="text-sm text-slate-500">Subjects you teach</p></div></div><div className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center"><p className="text-sm font-medium text-slate-700">No subjects loaded</p><p className="mt-1 text-xs leading-5 text-slate-500">Only subjects assigned to your profile will be displayed.</p></div></section>
    </div>
    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-4 w-4 shrink-0" />This page contains no sample academic data. The backend will enforce teacher-specific access to assignments.</div>
  </div>
);
