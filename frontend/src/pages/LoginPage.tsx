import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shield,
  UserCheck,
  GraduationCap,
  Lock,
  Mail,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (
    email: string,
    password: string
  ) => Promise<void>;

  loginError?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  loginError,
}) => {
  const [email, setEmail] = useState('admin@timegen.ai');
  const [password, setPassword] = useState('timegen@123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin(
        email.trim(),
        password
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">

      {/* -------------------------------------------------
          BRAND
      ------------------------------------------------- */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">

        <div className="flex items-center justify-center gap-2.5 mb-2">

          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>

          <span className="text-2xl font-bold tracking-tight text-slate-900">
            TimeGen{' '}
            <span className="text-blue-600">
              AI
            </span>
          </span>

        </div>

        <p className="text-center text-xs font-medium text-slate-500 max-w-xs mx-auto">
          Smarter Timetables, Powered by AI
        </p>

      </div>

      {/* -------------------------------------------------
          LOGIN CARD
      ------------------------------------------------- */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">

        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200/90 rounded-2xl shadow-sm">

          {/* -------------------------------------------------
              AVAILABLE ROLES
          ------------------------------------------------- */}
          <div className="mb-6">

            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Available Roles
            </label>

            <div className="grid grid-cols-3 gap-2">

              {/* ADMIN */}
              <div className="p-3 rounded-xl border border-blue-600 bg-blue-50/60">

                <Shield className="w-4 h-4 mb-1.5 text-blue-600" />

                <div className="text-xs font-semibold text-slate-900">
                  Admin
                </div>

                <div className="text-[10px] text-slate-500 leading-tight">
                  System Administrator
                </div>

              </div>

              {/* PRINCIPAL */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white">

                <GraduationCap className="w-4 h-4 mb-1.5 text-slate-500" />

                <div className="text-xs font-semibold text-slate-900">
                  Principal
                </div>

                <div className="text-[10px] text-slate-500 leading-tight">
                  School Management
                </div>

              </div>

              {/* TEACHER */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white">

                <UserCheck className="w-4 h-4 mb-1.5 text-slate-500" />

                <div className="text-xs font-semibold text-slate-900">
                  Teacher
                </div>

                <div className="text-[10px] text-slate-500 leading-tight">
                  Teacher Portal
                </div>

              </div>

            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              Your role is determined by your TimeGen account.
            </p>

          </div>

          {/* -------------------------------------------------
              LOGIN FORM
          ------------------------------------------------- */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address
              </label>

              <div className="relative">

                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                  placeholder="name@school.edu"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>

              <div className="relative">

                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-3 py-2 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                  placeholder="Enter your password"
                />

              </div>

            </div>

            {/* -------------------------------------------------
                LOGIN ERROR
            ------------------------------------------------- */}
            {loginError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5"
              >
                <p className="text-xs text-red-700">
                  {loginError}
                </p>
              </div>
            )}

            {/* -------------------------------------------------
                BACKEND STATUS
            ------------------------------------------------- */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">

              <span className="flex items-center gap-1.5">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />

                Backend authentication

              </span>

              <span className="text-[11px] text-slate-400">
                TimeGen AI
              </span>

            </div>

            {/* -------------------------------------------------
                SUBMIT
            ------------------------------------------------- */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !email.trim() ||
                !password
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors shadow-xs mt-2"
            >

              <span>
                {isSubmitting
                  ? 'Signing in...'
                  : 'Sign In to Dashboard'}
              </span>

              {!isSubmitting && (
                <ArrowRight className="w-3.5 h-3.5" />
              )}

            </button>

          </form>

          {/* -------------------------------------------------
              FOOTER
          ------------------------------------------------- */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">

            <p className="text-[11px] text-slate-400">
              TimeGen AI MVP · Backend-connected authentication
            </p>

          </div>

        </div>

      </div>

    </div>
  );
};
