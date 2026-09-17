'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import { INITIAL_USERS, INITIAL_USER_ROLES, INITIAL_ROLES, INITIAL_UNITS } from '../../lib/data';
import {
  Compass,
  Lock,
  ArrowRight,
  AlertCircle,
  LogIn,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const { login, logout, currentUser, currentRole, currentUnit } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    const success = login(email);
    if (success) {
      router.push('/');
    } else {
      setError(
        language === 'ar'
          ? 'البريد الإلكتروني غير مسجل في منظومة الفوج. تأكد من صحة البريد.'
          : 'Email not registered in the Scout system. Please check your credentials.'
      );
    }
  };

  const handleLogoutCurrent = () => {
    logout();
    setEmail('');
    setPassword('');
  };

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 mx-auto">
          <Compass className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'بوابة تسجيل دخول القادة' : 'Leader Portal Authentication'}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          {language === 'ar'
            ? 'سجّل الدخول بحسابك للوصول إلى فريقك وصلاحياتك المحددة داخل المنظومة الكشفية.'
            : 'Sign in to access your assigned scout unit and authorized platform controls.'}
        </p>
      </div>

      {/* If Already Logged In */}
      {currentUser ? (
        <div className="bg-white dark:bg-[#121214] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-3.5 p-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-sm">
              {currentUser.full_name.slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{currentUser.full_name}</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-[10px] font-medium">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{currentUser.email}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                {currentRole?.description.split(' - ')[0]} • {currentUnit ? (language === 'ar' ? currentUnit.name_ar : currentUnit.name_en) : (language === 'ar' ? 'قيادة الفوج (عام)' : 'Global Leadership')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-2 px-3 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 dark:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer"
            >
              <span>{language === 'ar' ? 'الانتقال إلى لوحة التحكم' : 'Go to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={handleLogoutCurrent}
              className="py-2 px-3 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Email & Password Login Form */
        <div className="bg-white dark:bg-[#121214] p-5 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
          <form onSubmit={handleManualLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="leader@scouts.org"
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <LogIn className="w-4 h-4" strokeWidth={1.5} />
              <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
            </button>
          </form>

          {/* Registered Accounts Reference Table */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {language === 'ar' ? 'دليل حسابات القادة المسجلين بالمنظومة:' : 'Registered Leader Accounts Directory:'}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {INITIAL_USERS.map((user) => {
                const roleAssignment = INITIAL_USER_ROLES.find((ur) => ur.user_id === user.id);
                const role = INITIAL_ROLES.find((r) => r.id === roleAssignment?.role_id);
                const unit = INITIAL_UNITS.find((u) => u.id === roleAssignment?.unit_id);

                return (
                  <div
                    key={user.id}
                    className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.full_name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                        {user.email} • {role?.description.split(' - ')[0]} • {unit ? (language === 'ar' ? unit.name_ar : unit.name_en) : (language === 'ar' ? 'قائد الفوج' : 'Global')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(user.email);
                        setError(null);
                      }}
                      className="shrink-0 px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 text-zinc-700 dark:text-zinc-300 font-medium text-[11px] transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? 'تعبئة' : 'Fill'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
