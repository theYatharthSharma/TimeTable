
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface InlineErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const InlineErrorState: React.FC<InlineErrorStateProps> = ({
  title = 'Unable to Load Data',
  message,
  onRetry,
}) => {
  return (
    <div className="w-full flex justify-center px-4 py-8">
      <div className="box-border w-full max-w-md h-[250px] shrink-0 bg-white border border-red-200 rounded-2xl shadow-sm px-8 py-6 text-center flex flex-col items-center justify-center">
        <div className="w-11 h-11 shrink-0 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>

        <h2 className="text-base font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-5 text-slate-500 line-clamp-3">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default InlineErrorState;
