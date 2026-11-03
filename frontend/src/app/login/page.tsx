'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import {
  Lock,
  ArrowRight,
  AlertCircle,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';

export default function LoginPage() {
  const { login, logout, currentUser, currentRole, currentUnit } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // Leader Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLeaderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني' : 'Please enter your username or email');
      return;
    }
    if (!password.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }
    const success = login(identifier, password);
    if (success) {
      router.push('/');
    } else {
      setError(
        language === 'ar'
          ? 'بيانات الدخول غير صحيحة (اسم المستخدم أو كلمة المرور).'
          : 'Invalid username or password. Please check your credentials.'
      );
    }
  };

  const handleLogoutCurrent = () => {
    logout();
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  return (
    <div className="max-w-md w-full mx-auto py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-1.5 shadow-md border border-neutral-200 dark:border-neutral-800 mx-auto">
          <img
            src="/smsr-logo.jpg"
            alt="SMSR Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            SMSR
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400">
            {language === 'ar'
              ? 'كشافة السيدة العذراء بالرحاب (St. Mary Scouts Rehab)'
              : 'St. Mary Scouts Rehab — Sea Scout Group'}
          </p>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          {language === 'ar'
            ? 'بوابة القادة لمتابعة الفعاليات، الحضور، العهدة، وأرشيف الوسائط.'
            : 'Leader portal: events, attendance, inventory, and Google Drive archive.'}
        </p>
      </div>

      {/* If Already Logged In */}
      {currentUser ? (
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.full_name?.slice(0, 2) || 'SC'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate">{currentUser.full_name}</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-[10px] font-medium font-mono shrink-0">
                  {language === 'ar' ? 'قائد مسجل' : 'Signed In'}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">{currentUser.email}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 truncate">
                {currentRole?.description ? currentRole.description.split(' - ')[0] : 'Leader'} &bull;{' '}
                {currentUnit ? (language === 'ar' ? currentUnit.name_ar : currentUnit.name_en) : (language === 'ar' ? 'قيادة الفوج (عام)' : 'Global')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{language === 'ar' ? 'الانتقال إلى لوحة القيادة' : 'Go to Leader Dashboard'}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={handleLogoutCurrent}
              className="py-2.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Card Header */}
          <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'تسجيل دخول القادة' : 'Leader Portal Sign In'}
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {language === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور للمتابعة' : 'Enter your credentials to continue'}
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLeaderLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === 'ar' ? 'اسم المستخدم أو البريد الإلكتروني' : 'Username or Email'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    placeholder={language === 'ar' ? 'اسم المستخدم (مثال: admin)' : 'Username (e.g. admin)'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-zinc-400 absolute right-3 rtl:right-auto rtl:left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute right-3 rtl:right-auto rtl:left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل دخول' : 'Sign In'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
