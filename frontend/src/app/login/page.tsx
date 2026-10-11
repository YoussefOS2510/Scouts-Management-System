'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { useLanguage } from '../../lib/LanguageContext';
import {
  Compass,
  Lock,
  ArrowRight,
  AlertCircle,
  LogIn,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
  KeyRound,
  FileCode,
} from 'lucide-react';

export default function LoginPage() {
  const { login, loginAsScout, logout, currentUser, currentRole, currentUnit, isScout, currentMember, members, allUsers } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  // Tab: 'scout' (Youth Member) vs 'leader' (Adult Leader/Staff)
  const [activeTab, setActiveTab] = useState<'scout' | 'leader'>('scout');

  // Leader Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Scout Form State
  const [memberCode, setMemberCode] = useState('');
  const [pin, setPin] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleLeaderLogin = (e: React.FormEvent) => {
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
          ? 'البريد الإلكتروني غير مسجل في منظومة SMSR. تأكد من صحة البريد.'
          : 'Email not registered in the SMSR system. Please check your credentials.'
      );
    }
  };

  const handleScoutLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberCode.trim()) {
      setError(language === 'ar' ? 'يرجى إدخال كود الكشاف' : 'Please enter your Scout Member Code');
      return;
    }
    const result = loginAsScout(memberCode, pin || '1234');
    if (result.success) {
      router.push('/scout');
    } else {
      setError(result.error || (language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    }
  };

  const handleLogoutCurrent = () => {
    logout();
    setEmail('');
    setPassword('');
    setMemberCode('');
    setPin('');
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white p-1.5 shadow-md border border-neutral-200 dark:border-neutral-800 mx-auto">
          <img
            src="/smsr-logo.jpg"
            alt="SMSR Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
            SMSR
          </h1>
          <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
            {language === 'ar'
              ? 'كشافة السيدة العذراء بالرحاب (St. Mary Scouts Rehab)'
              : 'St. Mary Scouts Rehab — Sea Scout Group'}
          </p>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          {language === 'ar'
            ? 'بوابة موحدة للكشافة والقادة لمتابعة الحضور، العهدة، وأرشيف الوسائط السحابي.'
            : 'Unified portal for youth scouts and leaders: attendance, equipment inventory, and Google Drive archive.'}
        </p>
      </div>

      {/* If Already Logged In */}
      {currentUser ? (
        <div className="bg-white dark:bg-[#121214] p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.full_name.slice(0, 2) || 'SC'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{currentUser.full_name}</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-[10px] font-medium font-mono">
                  {isScout ? (language === 'ar' ? 'كشاف نشط' : 'Active Scout') : (language === 'ar' ? 'قائد نشط' : 'Active Leader')}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{currentUser.email}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                {currentRole?.description.split(' - ')[0]} &bull;{' '}
                {currentUnit ? (language === 'ar' ? currentUnit.name_ar : currentUnit.name_en) : (language === 'ar' ? 'قيادة الفوج (عام)' : 'Global')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => router.push(isScout ? '/scout' : '/')}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>{isScout ? (language === 'ar' ? 'الانتقال إلى عرين الكشاف' : 'Go to Scout Space') : (language === 'ar' ? 'الانتقال إلى لوحة القيادة' : 'Go to Leader Dashboard')}</span>
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
        /* Tabs: Scout Login vs Leader Login */
        <div className="bg-white dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          {/* Tab Header Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-zinc-100 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('scout');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'scout'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'ar' ? 'دخول الكشافة والأشبال (Scout)' : 'Youth Scout Portal'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('leader');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'leader'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'ar' ? 'دخول القادة (Leader)' : 'Leader Portal'}</span>
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: SCOUT LOGIN */}
            {activeTab === 'scout' ? (
              <form onSubmit={handleScoutLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'كود الكشاف (Member Code)' : 'Scout Member Code'}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">مثال: SCT-2026-0001</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={memberCode}
                      onChange={(e) => {
                        setMemberCode(e.target.value);
                        setError(null);
                      }}
                      placeholder="SCT-2026-0001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <FileCode className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-auto rtl:right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span>{language === 'ar' ? 'رمز المرور / سنة الميلاد (PIN)' : 'PIN / Birth Year'}</span>
                    <span className="text-[11px] text-zinc-400 font-mono">الافتراضي: 1234 أو سنة الميلاد</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-auto rtl:right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'ar' ? 'دخول إلى عرين الكشاف' : 'Enter Scout Space'}</span>
                </button>

                {/* Quick Scout Directory Autofill */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-[11px] font-bold text-zinc-500 mb-2">
                    {language === 'ar' ? 'حسابات كشافة تجريبية للاختبار السريع:' : 'Quick Demo Scout Accounts:'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {members.slice(0, 4).map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setMemberCode(member.member_code);
                          setPin('1234');
                          setError(null);
                        }}
                        className="p-2 text-right rtl:text-right ltr:text-left rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 text-xs transition-all cursor-pointer"
                      >
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{member.full_name_ar}</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                          {member.member_code} &bull; PIN: 1234
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* TAB 2: LEADER LOGIN */
              <form onSubmit={handleLeaderLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني للقائد' : 'Leader Email Address'}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل دخول القائد' : 'Leader Sign In'}</span>
                </button>

                {/* Quick Leader Autofill */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-[11px] font-bold text-zinc-500 mb-2">
                    {language === 'ar' ? 'حسابات القادة المسجلين للاختبار السريع:' : 'Registered Leaders Quick Directory:'}
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {[
                      ...allUsers.slice(0, 3),
                      allUsers.find((u) => u.email === 'christine.nabil@scouts.org') || {
                        id: 'u18',
                        email: 'christine.nabil@scouts.org',
                        full_name: 'القائدة كريستين نبيل (Christine Nabil)',
                      },
                    ].filter(Boolean).map((user) => (
                      <div
                        key={user.id}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                            <span>{user.full_name}</span>
                            {user.id === 'u18' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                                Morshdat A & B
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono truncate">{user.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(user.email);
                            setError(null);
                          }}
                          className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-semibold cursor-pointer shrink-0"
                        >
                          {language === 'ar' ? 'تعبئة' : 'Fill'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
