'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { useAuth } from '../../../lib/AuthContext';
import { TeamAttendanceAnalytics } from '../../../components/TeamAttendanceAnalytics';
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarCheck,
  Package,
  ShieldAlert,
  Award,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  Info,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { language, t } = useLanguage();
  const { isSuperAdmin, can, currentUnit } = useAuth();
  const [adminTab, setAdminTab] = useState<'executive' | 'team_attendance'>('executive');

  const canViewTeamAnalytics =
    isSuperAdmin ||
    can('admin.analytics') ||
    can('attendance.analytics') ||
    can('attendance.take');

  // Permission Guard
  if (!canViewTeamAnalytics) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: لوحة التحليلات' : 'Restricted Access: Analytics Dashboard'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {language === 'ar'
            ? 'هذه الشاشة تتطلب صلاحية الاطلاع على التحليلات التنفيذية أو قيادة مرحلة كشفية.'
            : 'This dashboard requires permissions to inspect executive telemetry or manage a scout unit.'}
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
        </Link>
      </div>
    );
  }

  // If the user is a team leader (not Super Admin and without full executive analytics), directly render their Team Attendance Analytics!
  if (!isSuperAdmin && !can('admin.analytics')) {
    return <TeamAttendanceAnalytics initialUnitId={currentUnit?.id} />;
  }

  // Live Database Analytics State
  const [unitPerformance, setUnitPerformance] = useState<any[]>([]);
  const [categoryUtilization, setCategoryUtilization] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/analytics?type=executive')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          if (Array.isArray(data.unitPerformance)) setUnitPerformance(data.unitPerformance);
          if (Array.isArray(data.categoryUtilization)) setCategoryUtilization(data.categoryUtilization);
        }
      })
      .catch((err) => console.error('Failed to fetch executive analytics:', err));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Segmented Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-md w-fit border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setAdminTab('executive')}
          className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            adminTab === 'executive'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{language === 'ar' ? 'التحليلات التنفيذية للفوج' : 'Executive Overview'}</span>
        </button>
        <button
          onClick={() => setAdminTab('team_attendance')}
          className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            adminTab === 'team_attendance'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>{language === 'ar' ? 'تحليلات حضور الفرق والطلائع' : 'Team Attendance Analytics'}</span>
        </button>
      </div>

      {adminTab === 'team_attendance' ? (
        <TeamAttendanceAnalytics />
      ) : (
        <>
          {/* Header Command Bar */}
          <div className="bg-zinc-900 dark:bg-zinc-900/90 text-zinc-100 p-6 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <BarChart3 className="w-4 h-4 text-amber-400" strokeWidth={1.5} />
                <span>{language === 'ar' ? 'لوحة القيادة التنفيذية' : 'Executive Leadership Telemetry'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100">{t('analytics_title')}</h1>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">{t('analytics_desc')}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/audit-logs"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs border border-zinc-700 transition-colors shadow-xs"
              >
                <span>{language === 'ar' ? 'استعراض تتبع القادة' : 'Inspect Leader Tracking'}</span>
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* 4-Column Metric Strip (Generous padding & perfect alignment) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E1F20] p-5 sm:p-6 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'متوسط نسبة الحضور' : 'Overall Attendance'}</span>
                <div className="w-9 h-9 rounded-xl bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#146C2E] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-normal tracking-tight font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">91.4%</div>
              <div className="text-xs font-medium text-[#146C2E] dark:text-emerald-400 flex items-center gap-1.5">
                <span>+2.8%</span>
                <span className="text-[#747775]">{language === 'ar' ? 'مقارنة بالشهر السابق' : 'vs last month'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1F20] p-5 sm:p-6 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'إجمالي قوة الفوج' : 'Total Scout Strength'}</span>
                <div className="w-9 h-9 rounded-xl bg-[#D3E3FD] dark:bg-sky-950/40 text-[#0B57D0] flex items-center justify-center">
                  <Users className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-normal tracking-tight font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">1,048</div>
              <div className="text-xs text-[#747775]">
                {language === 'ar' ? 'موزعين على ١٢ مرحلة و٤٨ طليعة' : 'Across 12 units & 48 patrols'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1F20] p-5 sm:p-6 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'جاهزية مهمات العهدة' : 'Warehouse Health'}</span>
                <div className="w-9 h-9 rounded-xl bg-[#FEF7EC] dark:bg-amber-950/40 text-[#B06000] flex items-center justify-center">
                  <Package className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-normal tracking-tight font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">94.2%</div>
              <div className="text-xs text-[#747775]">
                {language === 'ar' ? '١٠٧ قطعة جاهزة / ٦ صيانة' : '107 ready / 6 repair'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E1F20] p-5 sm:p-6 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-3 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'انضباط تسجيل الجلسات' : 'Roster Submission'}</span>
                <div className="w-9 h-9 rounded-xl bg-[#F3E8FD] dark:bg-purple-950/40 text-[#7C3AED] flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-normal tracking-tight font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">100%</div>
              <div className="text-xs text-[#747775]">
                {language === 'ar' ? 'كافة القادة سلموا كشوف الجمعة' : 'All 12 rosters received'}
              </div>
            </div>
          </div>

          {/* Main Grid: Unit Attendance Benchmarks & Inventory Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Rates by Unit (Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1E1F20] p-5 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
                <div>
                  <h2 className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#0B57D0]" strokeWidth={2} />
                    <span>{language === 'ar' ? 'مقارنة نسبة الحضور حسب المرحلة الكشفية' : 'Unit Attendance Benchmarks'}</span>
                  </h2>
                  <p className="text-xs text-[#747775] mt-0.5">
                    {language === 'ar' ? 'ترتيب المراحل من الأعلى حضوراً والتزاماً' : 'Ranked performance across all 12 units'}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#444746] dark:text-[#C4C7C5] bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-1 rounded-full border border-[#E0E3E7] dark:border-[#303134]">
                  {language === 'ar' ? 'سبتمبر ٢٠٢٦' : 'September 2026'}
                </span>
              </div>

              {/* Perfectly Centered Unit Rows */}
              <div className="space-y-2">
                {unitPerformance.map((u) => {
                  const isTop = u.status === 'top';
                  const isWarning = u.status === 'warning';

                  return (
                    <div
                      key={u.unitId}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors text-xs"
                    >
                      {/* Left: Unit Name, Count, and Badge */}
                      <div className="w-44 sm:w-56 shrink-0 flex items-center gap-2">
                        <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                          {language === 'ar' ? u.name_ar : u.name_en}
                        </span>
                        <span className="text-[#747775] font-mono tabular-nums text-[11px] shrink-0">
                          ({u.scouts})
                        </span>
                        {isTop && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0EC] text-[#0A5326] dark:bg-emerald-950/40 dark:text-emerald-300 font-medium shrink-0">
                            <Award className="w-3 h-3" />
                            <span>{language === 'ar' ? 'متميز' : 'Top'}</span>
                          </span>
                        )}
                        {isWarning && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#F9DEDC] text-[#8C1D18] dark:bg-rose-950/40 dark:text-rose-300 font-medium shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{language === 'ar' ? 'متابعة' : 'Review'}</span>
                          </span>
                        )}
                      </div>

                      {/* Center: Horizontally Centered Progress Bar */}
                      <div className="flex-1 h-2 bg-[#F0F4F9] dark:bg-[#282A2C] rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTop ? 'bg-[#146C2E]' : isWarning ? 'bg-[#B3261E]' : 'bg-[#0B57D0]'
                          }`}
                          style={{ width: `${u.rate}%` }}
                        />
                      </div>

                      {/* Right: Percentage Value Centered with the Bar */}
                      <div className="w-14 text-end font-mono tabular-nums font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] shrink-0 text-xs">
                        {u.rate}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Inventory Pressure */}
            <div className="bg-white dark:bg-[#1E1F20] p-5 rounded-2xl border border-[#E0E3E7] dark:border-[#303134] space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
                  <h2 className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0B57D0]" strokeWidth={2} />
                    <span>{language === 'ar' ? 'ضغط استهلاك العهدة' : 'Equipment Utilization'}</span>
                  </h2>
                  <p className="text-xs text-[#747775] mt-0.5">
                    {language === 'ar' ? 'نسبة المهمات المحجوزة للمخيمات' : 'Current active reservations vs stock'}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {categoryUtilization.map((cat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center gap-3 text-xs"
                    >
                      {/* Category Name */}
                      <div className="w-36 sm:w-40 shrink-0 font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                        {cat.category}
                      </div>

                      {/* Progress Bar Centered */}
                      <div className="flex-1 h-2 bg-[#E0E3E7] dark:bg-[#383A3C] rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            cat.percent > 70 ? 'bg-[#B3261E]' : cat.percent > 40 ? 'bg-[#B06000]' : 'bg-[#146C2E]'
                          }`}
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>

                      {/* Booked / Total & Percent */}
                      <div className="w-24 text-end font-mono tabular-nums text-[#444746] dark:text-[#C4C7C5] text-[11px] shrink-0">
                        {cat.booked}/{cat.total} ({cat.percent}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] space-y-1 text-xs text-[#444746] dark:text-[#C4C7C5]">
                <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0B57D0]" />
                  <span>{language === 'ar' ? 'توصية القيادة للعهدة' : 'Quartermaster Tip'}</span>
                </div>
                <p className="text-[11px] text-[#747775] leading-relaxed">
                  {language === 'ar'
                    ? 'نسبة حجز الصوتيات مرتفعة (٧٥٪) بسبب تزامن احتفالات كشافة A وزهرات A. يوصى بجدولة التناوب.'
                    : 'AV system reservations are at 75% due to overlapping troop celebrations. Staggered scheduling recommended.'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
