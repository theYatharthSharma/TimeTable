import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export type ErrorPageType =
  | '404'
  | '401'
  | '403'
  | '500'
  | 'error';

interface ErrorPageProps {
  type?: ErrorPageType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

const ERROR_CONFIG = {
  '404': {
    code: '404',
    title: 'Page Not Found',
    message:
      "The page you're looking for doesn't exist or may have been moved.",
  },

  '401': {
    code: '401',
    title: 'Session Expired',
    message:
      'Your session is no longer valid. Please log in again.',
  },

  '403': {
    code: '403',
    title: 'Access Denied',
    message:
      "You don't have permission to access this resource.",
  },

  '500': {
    code: '500',
    title: 'Something Went Wrong',
    message:
      'An unexpected error occurred while loading this page.',
  },

  error: {
    code: '!',
    title: 'Unable to Load',
    message:
      'Something went wrong while loading the requested data.',
  },
};

export const ErrorPage: React.FC<ErrorPageProps> = ({
  type = 'error',
  title,
  message,
  onRetry,
  onGoHome,
}) => {
  const config = ERROR_CONFIG[type];

  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <span className="text-sm font-bold">✦</span>
          </div>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            TimeGen{' '}
            <span className="text-blue-600">
              AI
            </span>
          </span>
        </div>

        {/* Error Icon */}
        <div className="relative mx-auto w-28 h-28 mb-6">

          <div className="absolute inset-0 rounded-full bg-blue-50" />

          <div className="absolute inset-3 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
            {type === '403' || type === '401' ? (
              <ShieldAlert className="w-9 h-9 text-blue-600" />
            ) : (
              <AlertTriangle className="w-9 h-9 text-blue-600" />
            )}
          </div>

        </div>

        {/* Error Code */}
        <div className="text-7xl font-black tracking-tight text-slate-200 select-none">
          {config.code}
        </div>

        {/* Title */}
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {displayTitle}
        </h1>

        {/* Message */}
        <p className="mt-3 max-w-md mx-auto text-sm leading-6 text-slate-500">
          {displayMessage}
        </p>

        {/* Actions */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">

          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {!onGoHome && !onRetry && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}

        </div>

        {/* Support text */}
        <p className="mt-8 text-[11px] text-slate-400">
          TimeGen AI · School Timetable Platform
        </p>

      </div>
    </div>
  );
};