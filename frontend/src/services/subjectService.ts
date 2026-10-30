import type { Subject } from '../types';
import API_BASE_URL from './apiConfig';
import { authenticatedFetch } from './authenticatedFetch';
import { schoolRequest } from './schoolApi';

interface BackendSubject {
  id: string;
  name: string;
  code: string;
  weekly_periods: number;
  standard_ids?: string[];
  standards?: Array<{ id: string; level?: number; name?: string }>;
  color_bg?: string;
  color_text?: string;
  color_border?: string;
}

const COLORS = [
  { bg: 'bg-blue-50/90', text: 'text-blue-700', border: 'border-blue-200/80' },
  { bg: 'bg-emerald-50/90', text: 'text-emerald-700', border: 'border-emerald-200/80' },
  { bg: 'bg-indigo-50/90', text: 'text-indigo-700', border: 'border-indigo-200/80' },
  { bg: 'bg-amber-50/90', text: 'text-amber-800', border: 'border-amber-200/80' },
  { bg: 'bg-teal-50/90', text: 'text-teal-700', border: 'border-teal-200/80' },
  { bg: 'bg-rose-50/90', text: 'text-rose-700', border: 'border-rose-200/80' },
  { bg: 'bg-purple-50/90', text: 'text-purple-700', border: 'border-purple-200/80' },
  { bg: 'bg-sky-50/90', text: 'text-sky-700', border: 'border-sky-200/80' },
];

function mapSubject(item: BackendSubject, index: number): Subject {
  const color = COLORS[index % COLORS.length];
  const standardIds = item.standard_ids ?? item.standards?.map(s => s.id) ?? [];
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    standardIds,
    weeklyPeriods: item.weekly_periods,
    colorBg: item.color_bg ?? color.bg,
    colorText: item.color_text ?? color.text,
    colorBorder: item.color_border ?? color.border,
  };
}

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    const data = await schoolRequest<BackendSubject[]>('/subjects');
    if (!Array.isArray(data)) throw new Error('Subjects API did not return a list.');
    return data.map(mapSubject);
  },

  async addSubject(input: Pick<Subject, 'name' | 'code' | 'standardIds' | 'weeklyPeriods'>): Promise<Subject> {
    const created = await schoolRequest<BackendSubject>('/subjects', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name.trim(),
        code: input.code.trim().toUpperCase(),
        weekly_periods: input.weeklyPeriods,
        standard_ids: input.standardIds,
      }),
    });
    return mapSubject(created, 0);
  },

  async updateSubject(
    id: string,
    input: Partial<Pick<Subject, 'name' | 'code' | 'standardIds' | 'weeklyPeriods'>>
  ): Promise<Subject> {
    const updated = await schoolRequest<BackendSubject>(`/subjects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
        ...(input.weeklyPeriods !== undefined ? { weekly_periods: input.weeklyPeriods } : {}),
        ...(input.standardIds !== undefined ? { standard_ids: input.standardIds } : {}),
      }),
    });
    return mapSubject(updated, 0);
  },

  async deleteSubject(id: string): Promise<void> {
    await schoolRequest<void>(`/subjects/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
