import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { getSchools, School } from '../../services/adminService';
import { authService } from '../../services/authService';

interface TimetableErrorStateProps {
  message: string;
  isAdmin: boolean;
  onRetry: () => void | Promise<void>;
}

export const TimetableErrorState: React.FC<TimetableErrorStateProps> = ({
  message, isAdmin, onRetry,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(authService.getSchoolId() || '');
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const needsSchool = isAdmin && !authService.getSchoolId();

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoadingSchools(true);
    getSchools()
      .then((result) => {
        if (!cancelled) {
          setSchools(result);
          setSchoolError(result.length ? null : 'No schools are available for this account.');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) setSchoolError(error instanceof Error ? error.message : 'Unable to load schools.');
      })
      .finally(() => { if (!cancelled) setLoadingSchools(false); });
    return () => { cancelled = true; };
  }, [isAdmin]);

  const handleContinue = async () => {
    if (isAdmin && !authService.getSchoolId()) {
      if (!selectedSchoolId) {
        setSchoolError('Select a school before continuing.');
        return;
      }
      try { authService.setSelectedSchoolId(selectedSchoolId); }
      catch (error) { setSchoolError(error instanceof Error ? error.message : 'Unable to select school.'); return; }
    }
    await onRetry();
  };

  return (
    <div className="min-h-[500px] w-full flex items-center justify-center px-4 py-8">
      <section className="w-full max-w-md min-h-[212px] rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm flex flex-col items-center justify-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-red-100 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-base font-bold text-slate-900">Unable to Load Timetable</h2>
        <p className="mt-2 text-sm leading-5 text-slate-500">{message}</p>

        {needsSchool && (
          <div className="mt-4 w-full text-left">
            <label htmlFor="timetable-school-select" className="mb-1.5 block text-xs font-semibold text-slate-700">Select school</label>
            <select id="timetable-school-select" value={selectedSchoolId} onChange={(event) => setSelectedSchoolId(event.target.value)} disabled={loadingSchools} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">{loadingSchools ? 'Loading schools...' : 'Choose a school'}</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          </div>
        )}

        {schoolError && <p className="mt-2 w-full text-left text-xs text-red-600">{schoolError}</p>}
        <button type="button" onClick={handleContinue} disabled={loadingSchools} className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {needsSchool ? 'Select School & Retry' : 'Retry'}
        </button>
      </section>
    </div>
  );
};
