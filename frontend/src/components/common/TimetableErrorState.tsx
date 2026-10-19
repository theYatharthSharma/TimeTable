import React, { useEffect, useState } from 'react';
import { AlertTriangle, Activity } from 'lucide-react';
import { getSchools, School } from '../../services/adminService';
import { authService } from '../../services/authService';

interface TimetableErrorStateProps {
  message: string;
  isAdmin: boolean;
  onRetry: () => void | Promise<void>;
}

/** Shared error state keeps Dashboard and Timetable visually consistent. */
export const TimetableErrorState: React.FC<TimetableErrorStateProps> = ({
  message,
  isAdmin,
  onRetry,
}) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const needsSchool = isAdmin && !authService.getSchoolId();

  useEffect(() => {
    if (!needsSchool) return;
    let active = true;
    setSchoolsLoading(true);
    getSchools()
      .then((items) => { if (active) setSchools(items); })
      .catch((error: unknown) => {
        if (active) setSchoolsError(error instanceof Error ? error.message : 'Unable to load schools.');
      })
      .finally(() => { if (active) setSchoolsLoading(false); });
    return () => { active = false; };
  }, [needsSchool]);

  const handleSelectSchool = async () => {
    if (!selectedSchoolId) return;
    try {
      authService.setSelectedSchoolId(selectedSchoolId);
      setSchoolsError(null);
      await onRetry();
    } catch (error) {
      setSchoolsError(error instanceof Error ? error.message : 'Unable to select school.');
    }
  };

  return (
    <div className="w-full min-h-[500px] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md min-h-[212px] bg-white border border-red-200 rounded-2xl shadow-sm p-6 text-center flex flex-col items-center justify-center">
        <div className="w-11 h-11 mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          {isAdmin ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Activity className="w-5 h-5 text-red-600" />}
        </div>
        <h2 className="text-base font-bold text-slate-900">Unable to Load Timetable</h2>
        <p className="mt-2 text-sm text-slate-500">{message}</p>

        {needsSchool && (
          <div className="w-full mt-4 text-left">
            <label htmlFor="timetable-school-select" className="block text-sm font-medium text-slate-700 mb-1">
              Select a school
            </label>
            <select
              id="timetable-school-select"
              value={selectedSchoolId}
              onChange={(event) => setSelectedSchoolId(event.target.value)}
              disabled={schoolsLoading || schools.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">{schoolsLoading ? 'Loading schools…' : schools.length ? 'Choose a school' : 'No schools available'}</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
            {schoolsError && <p className="mt-2 text-xs text-red-600">{schoolsError}</p>}
            <button type="button" onClick={handleSelectSchool} disabled={!selectedSchoolId || schoolsLoading}
              className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              Use selected school
            </button>
          </div>
        )}

        <button type="button" onClick={() => void onRetry()}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700">
          Retry
        </button>
      </div>
    </div>
  );
};
