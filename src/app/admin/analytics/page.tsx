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
    can('attendance.take') ||
    !!currentUnit;

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

  // Analytics mock calculations
  const unitPerformance = [
    { unitId: 1, name_ar: 'أشبال A', name_en: 'Ashbal A', rate: 94, scouts: 84, leader: 'Fady George', status: 'optimal' },
    { unitId: 2, name_ar: 'أشبال B', name_en: 'Ashbal B', rate: 89, scouts: 92, leader: 'Mina Nabil', status: 'optimal' },
    { unitId: 3, name_ar: 'زهرات A', name_en: 'Zahrat A', rate: 96, scouts: 88, leader: 'Sarah Mina', status: 'top' },
    { unitId: 4, name_ar: 'زهرات B', name_en: 'Zahrat B', rate: 91, scouts: 79, leader: 'Christine Adel', status: 'optimal' },
    { unitId: 5, name_ar: 'كشافة A', name_en: 'Kashafa A', rate: 93, scouts: 110, leader: 'Mark Wagdy', status: 'optimal' },
    { unitId: 6, name_ar: 'كشافة B', name_en: 'Kashafa B', rate: 85, scouts: 105, leader: 'David Bassem', status: 'warning' },
    { unitId: 7, name_ar: 'مرشدات A', name_en: 'Morshdat A', rate: 95, scouts: 98, leader: 'Marina Samy', status: 'top' },
    { unitId: 8, name_ar: 'مرشدات B', name_en: 'Morshdat B', rate: 88, scouts: 94, leader: 'Sandra Raouf', status: 'optimal' },
    { unitId: 9, name_ar: 'متقدم', name_en: 'Motakadem', rate: 84, scouts: 82, leader: 'Kyrillos Emad', status: 'warning' },
    { unitId: 10, name_ar: 'رائدات', name_en: 'Ra2edat', rate: 90, scouts: 76, leader: 'Verena Fayez', status: 'optimal' },
    { unitId: 11, name_ar: 'جوالة', name_en: 'Gawala', rate: 87, scouts: 65, leader: 'Bishoy Magdy', status: 'optimal' },
    { unitId: 12, name_ar: 'قادة', name_en: 'Leaders', rate: 98, scouts: 75, leader: 'Peter Shoukry', status: 'top' },
  ];

  const categoryUtilization = [
    { category: language === 'ar' ? 'خيام وإيواء' : 'Tents & Shelters', total: 28, booked: 13, percent: 46 },
    { category: language === 'ar' ? 'مهمات طهي ومطبخ' : 'Camp Cooking', total: 18, booked: 6, percent: 33 },
    { category: language === 'ar' ? 'حبال ومشاريع ريادية' : 'Pioneering Ropes', total: 35, booked: 18, percent: 51 },
    { category: language === 'ar' ? 'إنارة وكهرباء' : 'Lighting & Power', total: 22, booked: 10, percent: 45 },
    { category: language === 'ar' ? 'صوتيات وإذاعة' : 'Sound & AV Systems', total: 4, booked: 3, percent: 75 },
  ];

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

          {/* 4-Column Colorful KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{language === 'ar' ? 'متوسط نسبة الحضور' : 'Overall Attendance'}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">91.4%</div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                +2.8% {language === 'ar' ? 'مقارنة بالشهر السابق' : 'vs last month'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{language === 'ar' ? 'إجمالي قوة الفوج' : 'Total Scout Strength'}</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">1,048</div>
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {language === 'ar' ? 'موزعين على ١٢ مرحلة و٤٨ طليعة' : 'Across 12 units & 48 patrols'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{language === 'ar' ? 'جاهزية مهمات العهدة' : 'Warehouse Health'}</span>
                <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums text-zinc-900 dark:text-zinc-50">94.2%</div>
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400">
                {language === 'ar' ? '١٠٧ قطعة جاهزة / ٦ صيانة' : '107 ready / 6 repair'}
              </div>
            </div>

            <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">{language === 'ar' ? 'انضباط تسجيل الجلسات' : 'Roster Submission'}</span>
                <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-black tracking-tight tabular-nums text-purple-800 dark:text-purple-300">100%</div>
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {language === 'ar' ? 'كافة القادة سلموا كشوف الجمعة' : 'All 12 rosters received'}
              </div>
            </div>
          </div>

          {/* Main Grid: Unit Attendance Benchmarks & Inventory Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Attendance Rates by Unit (Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121214] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
                    <span>{language === 'ar' ? 'مقارنة نسبة الحضور حسب المرحلة الكشفية' : 'Unit Attendance Benchmarks'}</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? 'ترتيب المراحل من الأعلى حضوراً والتزاماً' : 'Ranked performance across all 12 units'}
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                  {language === 'ar' ? 'سبتمبر ٢٠٢٦' : 'September 2026'}
                </span>
              </div>

              <div className="space-y-3">
                {unitPerformance.map((u) => {
                  const isTop = u.status === 'top';
                  const isWarning = u.status === 'warning';

                  return (
                    <div key={u.unitId} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {language === 'ar' ? u.name_ar : u.name_en}
                          </span>
                          <span className="text-zinc-400 font-mono tabular-nums">({u.scouts} {language === 'ar' ? 'كشاف' : 'scouts'})</span>
                          {isTop && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono border border-amber-200 dark:border-amber-800/60">
                              <Award className="w-3 h-3 text-amber-600" strokeWidth={1.5} />
                              <span>{language === 'ar' ? 'متميز' : 'Top'}</span>
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono border border-rose-200 dark:border-rose-800/60">
                              <AlertTriangle className="w-3 h-3 text-rose-600" strokeWidth={1.5} />
                              <span>{language === 'ar' ? 'متابعة' : 'Review'}</span>
                            </span>
                          )}
                        </div>
                        <div className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{u.rate}%</div>
                      </div>

                      {/* Low-profile 3px progress bar */}
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isTop ? 'bg-emerald-600 dark:bg-emerald-500' : isWarning ? 'bg-rose-600 dark:bg-rose-500' : 'bg-zinc-900 dark:bg-zinc-200'
                          }`}
                          style={{ width: `${u.rate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Inventory Pressure */}
            <div className="bg-white dark:bg-[#121214] p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
                    <span>{language === 'ar' ? 'ضغط استهلاك العهدة' : 'Equipment Utilization'}</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {language === 'ar' ? 'نسبة المهمات المحجوزة للمخيمات' : 'Current active reservations vs stock'}
                  </p>
                </div>

                <div className="space-y-3">
                  {categoryUtilization.map((cat, idx) => (
                    <div key={idx} className="p-3 rounded-md bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{cat.category}</span>
                        <span className="font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                          {cat.booked}/{cat.total} ({cat.percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.percent > 70 ? 'bg-rose-600' : cat.percent > 40 ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${cat.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                  <span>{language === 'ar' ? 'توصية القيادة للعهدة' : 'Quartermaster Tip'}</span>
                </div>
                <p className="text-xs leading-normal">
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
