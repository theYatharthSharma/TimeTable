            </button>

          </div>
        </div>

        {/* Timetable Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">

          <div>

            <div className="flex items-center justify-between mb-3">

              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Timetable Status
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Ready to Generate
              </span>

            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 mt-2">

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Configured Scope
                </span>

                <span className="font-semibold text-slate-800">
                  Entire School
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Total Weekly Periods
                </span>

                <span className="font-semibold text-slate-800 tabular-nums">
                  540 slots
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Conflicts Detected
                </span>

                <span className="font-semibold text-emerald-600">
                  0 Conflicts
                </span>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">

            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <span>View Active Timetable</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />

            <h2 className="text-sm font-bold text-slate-900">
              Recent Activity
            </h2>
          </div>

          <span className="text-xs text-slate-400">
            Audit trail
          </span>
        </div>

        <div className="divide-y divide-slate-100">

          {recentActivities.map(item => (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">

                <div className="w-2 h-2 rounded-full bg-blue-600"></div>

                <span className="text-xs font-medium text-slate-700">
                  {item.action}
                </span>

              </div>

              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {item.time}
              </span>
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};
