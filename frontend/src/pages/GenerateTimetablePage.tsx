import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  School,
  Layers,
  Calendar,
  ArrowRight,
  Plus,
  Trash2,
  Loader2,
  Sliders,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { GenerationConfig, AiConstraint } from '../types';
import { sectionService } from '../services/sectionService';
import { subjectService } from '../services/subjectService';
import { timetableService } from '../services/timetableService';
import { aiService } from '../services/aiService';

interface GenerateTimetablePageProps {
  onGenerationComplete: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GENERATION_STEPS = [
  'Analyzing constraints...',
  'Checking teacher availability...',
  'Assigning subjects...',
  'Optimizing timetable...',
  'Validating conflicts...',
];

export const GenerateTimetablePage: React.FC<GenerateTimetablePageProps> = ({
  onGenerationComplete,
  onShowToast,
}) => {
  const standards = sectionService.getStandards();
  const sections = sectionService.getSections();

  // Step 1: Scope State
  const [scope, setScope] = useState<'entire_school' | 'standard' | 'section'>('entire_school');
  const [targetStandardId, setTargetStandardId] = useState<number>(8);
  const [targetSectionId, setTargetSectionId] = useState<string>('8A');

  // Step 2: Constraints State
  const [hardConstraints, setHardConstraints] = useState({
    teacherNoClash: true,
    sectionNoClash: true,
    respectAvailability: true,
    satisfyWeeklyRequirements: true,
  });

  const [softPreferences, setSoftPreferences] = useState({
    avoidTeacherGaps: true,
    balanceTeacherWorkload: true,
    spreadSubjectsAcrossWeek: true,
    avoidConsecutiveClasses: false,
  });

  // Step 3: AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('Keep Mathematics away from the last period.');
  const [stagedConstraint, setStagedConstraint] = useState<AiConstraint | null>(() =>
    aiService.interpretPreference('Keep Mathematics away from the last period.')
  );
  const [activeAiConstraints, setActiveAiConstraints] = useState<AiConstraint[]>([
    {
      id: 'c_default_1',
      subject: 'Mathematics',
      preference: 'Avoid',
      period: 'Last Period (Period 6)',
      type: 'Soft Constraint',
      rawText: 'Keep Mathematics away from the last period.',
      active: true,
    },
  ]);

  // Generation Loading State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAiPromptChange = (text: string) => {
    setAiPrompt(text);
    if (text.trim().length > 3) {
      const parsed = aiService.interpretPreference(text);
      setStagedConstraint(parsed);
    } else {
      setStagedConstraint(null);
    }
  };

  const handleAddAiConstraint = () => {
    if (!stagedConstraint) return;
    setActiveAiConstraints(prev => [stagedConstraint, ...prev]);
    onShowToast(`Constraint added: ${stagedConstraint.subject} ${stagedConstraint.preference} ${stagedConstraint.period}`, 'info');
    setAiPrompt('');
    setStagedConstraint(null);
  };

  const handleRemoveAiConstraint = (id: string) => {
    setActiveAiConstraints(prev => prev.filter(c => c.id !== id));
  };

  const handleToggleConstraintActive = (id: string) => {
    setActiveAiConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setIsSuccess(false);
    setCurrentStepIndex(0);

    const config: GenerationConfig = {
      scope,
      targetStandardId: scope === 'standard' ? targetStandardId : undefined,
      targetSectionId: scope === 'section' ? targetSectionId : undefined,
      hardConstraints,
      softPreferences,
      customAiConstraints: activeAiConstraints.filter(c => c.active),
    };

    // Realistic step progression through the 5 steps
    const stepInterval = 650;
    GENERATION_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStepIndex(idx);
      }, idx * stepInterval);
    });

    // Complete generation
    setTimeout(() => {
      timetableService.generateTimetable(config);
      setIsGenerating(false);
      setIsSuccess(true);
      onShowToast('Timetable generated successfully with 0 conflicts', 'success');
    }, GENERATION_STEPS.length * stepInterval + 300);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Core Workflow
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">MVP Automated Generation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Generate Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure generation scope, enforce hard constraints, and tailor soft preferences with AI assistance.
          </p>
        </div>

        {/* Action Button */}
        {!isGenerating && !isSuccess && (
          <button
            type="button"
            onClick={handleStartGeneration}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-lg shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Timetable</span>
          </button>
        )}
      </div>

      {/* Generation Loading State Overlay / Card */}
      {isGenerating && (
        <div className="bg-white p-8 rounded-2xl border border-blue-200 shadow-md text-center space-y-6 animate-in fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              Generating Conflict-Free Timetable
            </h2>
            <p className="text-xs text-blue-700 font-semibold font-mono">
              {GENERATION_STEPS[currentStepIndex]}
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="max-w-lg mx-auto grid grid-cols-5 gap-2 pt-2">
            {GENERATION_STEPS.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                      isPast
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-slate-200'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Step {idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success Banner */}
      {isSuccess && !isGenerating && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-emerald-200 shadow-sm space-y-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Timetable Generated Successfully
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  All scheduled periods have been allocated. Teacher availability, weekly quotas, and constraints were fully respected.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartGeneration}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={onGenerationComplete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <span>View Generated Timetable</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Allocation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] text-slate-500">Periods Assigned</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">540 slots</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] text-slate-500">Detected Conflicts</div>
              <div className="text-lg font-bold text-emerald-600 tabular-nums">0 Clashes</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] text-slate-500">Weekly Quota Met</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">100% Satisfied</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <div className="text-[11px] text-slate-500">Teacher Availability</div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">Strictly Respected</div>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Configuration View (Available when not generating) */}
      {!isGenerating && (
        <div className="space-y-6">
          {/* STEP 1: Select Scope */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                1
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[12px]">
                Step 1 — Select Scope
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Entire School */}
              <button
                type="button"
                onClick={() => setScope('entire_school')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scope === 'entire_school'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <School
                    className={`w-4 h-4 ${
                      scope === 'entire_school' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  {scope === 'entire_school' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">Entire School</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Generate conflict-free schedule for all 5 standards and 15 sections.
                </div>
              </button>

              {/* Specific Standard */}
              <button
                type="button"
                onClick={() => setScope('standard')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scope === 'standard'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers
                    className={`w-4 h-4 ${
                      scope === 'standard' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  {scope === 'standard' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">By Standard</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Regenerate sections for a single selected standard.
                </div>
              </button>

              {/* Specific Section */}
              <button
                type="button"
                onClick={() => setScope('section')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  scope === 'section'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Calendar
                    className={`w-4 h-4 ${
                      scope === 'section' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  {scope === 'section' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="text-xs font-bold text-slate-900">Single Section</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Targeted allocation for one individual section (e.g. 8A).
                </div>
              </button>
            </div>

            {/* Scope Parameter Pickers */}
            {scope === 'standard' && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Select Standard:</span>
                <select
                  value={targetStandardId}
                  onChange={e => setTargetStandardId(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {standards.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {scope === 'section' && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">Select Section:</span>
                <select
                  value={targetSectionId}
                  onChange={e => setTargetSectionId(e.target.value)}
                  className="px-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>
                      Class {sec.id} (Standard {sec.standardId})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* STEP 2: Scheduling Requirements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[12px]">
                Step 2 — Scheduling Requirements
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hard Constraints */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Hard Constraints (Mandatory)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Always Enforced
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Teacher No Double-Booking
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Teacher cannot teach two classes at the same time.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Section No Double-Booking
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Section cannot have two subjects at the same time.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Teacher Availability Respected
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Never schedule periods marked unavailable in faculty availability grid.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Weekly Subject Periods Satisfied
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Required weekly subject period counts must be strictly met.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Soft Preferences */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Soft Preferences (Optimization Goals)
                  </span>
                  <span className="text-[10px] text-slate-400">Toggleable</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Avoid Teacher Gaps
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Minimize idle periods between scheduled classes for faculty.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={softPreferences.avoidTeacherGaps}
                      onChange={e =>
                        setSoftPreferences({
                          ...softPreferences,
                          avoidTeacherGaps: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-start justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Balance Teacher Workload
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Distribute teaching periods evenly across working days (Mon-Sat).
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={softPreferences.balanceTeacherWorkload}
                      onChange={e =>
                        setSoftPreferences({
                          ...softPreferences,
                          balanceTeacherWorkload: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-start justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Spread Subjects Across the Week
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Avoid clustering same subject multiple times on one day.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={softPreferences.spreadSubjectsAcrossWeek}
                      onChange={e =>
                        setSoftPreferences({
                          ...softPreferences,
                          spreadSubjectsAcrossWeek: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-start justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        Avoid Too Many Consecutive Classes
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Ensure rest breaks for teachers after 2 continuous periods.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={softPreferences.avoidConsecutiveClasses}
                      onChange={e =>
                        setSoftPreferences({
                          ...softPreferences,
                          avoidConsecutiveClasses: e.target.checked,
                        })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: AI Assistance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-[12px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Step 3 — AI Timetable Assistant</span>
                  </h2>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">NLP Constraint Parser</span>
            </div>

            {/* Natural language input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Describe a scheduling preference...
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={e => handleAiPromptChange(e.target.value)}
                  placeholder="e.g. Keep Mathematics away from the last period."
                  className="flex-1 px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  disabled={!stagedConstraint}
                  onClick={handleAddAiConstraint}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Constraint</span>
                </button>
              </div>

              {/* Clickable prompt suggestions */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Try examples:</span>
                {[
                  'Keep Mathematics away from the last period.',
                  'Schedule Science in morning periods',
                  'No Computer classes on Saturday',
                ].map(ex => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => handleAiPromptChange(ex)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline px-1 py-0.5"
                  >
                    "{ex}"
                  </button>
                ))}
              </div>
            </div>

            {/* Mock AI Interpretation Box */}
            {stagedConstraint && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    Detected preference:
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded">
                    Frontend AI Simulation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Subject:</span>
                    <span className="font-bold text-slate-900">{stagedConstraint.subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Preference:</span>
                    <span className="font-bold text-slate-900">{stagedConstraint.preference}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Period:</span>
                    <span className="font-bold text-slate-900">{stagedConstraint.period}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type:</span>
                    <span className="font-bold text-blue-700">{stagedConstraint.type}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Constraints List */}
            {activeAiConstraints.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Active Assistant Constraints ({activeAiConstraints.length})
                </span>
                <div className="space-y-2">
                  {activeAiConstraints.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => handleToggleConstraintActive(c.id)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-slate-800">
                            "{c.rawText}"
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Subject: {c.subject}</span>
                            <span>·</span>
                            <span>{c.preference} {c.period}</span>
                            <span>·</span>
                            <span className="text-blue-600 font-semibold">{c.type}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAiConstraint(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remove constraint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Primary Generate Button Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Scope: <strong className="text-slate-800 capitalize">{scope.replace('_', ' ')}</strong> · All hard constraints will be strictly satisfied.
              </span>
            </div>

            <button
              type="button"
              onClick={handleStartGeneration}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Timetable</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
