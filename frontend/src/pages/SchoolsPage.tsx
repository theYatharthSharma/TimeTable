
import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  School,
  Trash2,
} from 'lucide-react';

import {
  createSchool,
  deleteSchool,
  getSchools,
  type School as SchoolRecord,
} from '../services/adminService';

const DEFAULT_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const SchoolsPage: React.FC<{ onSchoolsChanged?: () => void }> = ({
  onSchoolsChanged,
}) => {
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-27');

  const loadSchools = async () => {
    setLoading(true);
    setError('');

    try {
      setSchools(await getSchools());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load schools.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchools();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Enter a school name.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const school = await createSchool({
        name: name.trim(),
        academic_year: academicYear.trim() || '2026-27',
        working_days: DEFAULT_DAYS,
        periods_per_day: 6,
        period_duration_min: 45,
        start_time: '08:00',
      });

      setSchools((current) =>
        [...current, school].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );

      setName('');
      setSuccess(`${school.name} was created successfully.`);
      onSchoolsChanged?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not create school.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (school: SchoolRecord) => {
    if (
      !window.confirm(
        `Delete ${school.name} (ID: ${school.id})? Only schools with no users or academic data can be deleted.`,
      )
    ) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await deleteSchool(school.id);

      setSchools((current) =>
        current.filter((item) => item.id !== school.id),
      );

      setSuccess(`${school.name} was deleted.`);
      onSchoolsChanged?.();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not delete school.',
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              School Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage schools registered on TimeGen AI.
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <School className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* Add school form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Add a school
        </h2>

        <form
          onSubmit={handleCreate}
          className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end"
        >
          <label className="block text-sm font-medium text-slate-700">
            School name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greenwood Public School"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
              maxLength={200}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Academic year
            <input
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              maxLength={20}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create school
          </button>
        </form>
      </section>

      {/* Error and success messages */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      {/* Registered schools */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Registered schools
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {schools.length} school{schools.length === 1 ? '' : 's'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSchools()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : schools.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No schools found. Create the first school above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {schools.map((school) => (
              <div
                key={school.id}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                    <School className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    {/* School name and ID together */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {school.name}
                      </p>

                      <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        ID: {school.id}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Academic year {school.academic_year} ·{' '}
                      {school.periods_per_day} periods/day
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleDelete(school)}
                  title={`Delete ${school.name}`}
                  aria-label={`Delete ${school.name}`}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-slate-500">
        Safety rule: a school can only be deleted while it has no users
        or academic records. Existing schools with data are protected
        from accidental deletion.
      </p>
    </div>
  );
};

export default SchoolsPage;
