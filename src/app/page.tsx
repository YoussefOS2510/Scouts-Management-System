'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_MEMBERS, INITIAL_BOOKINGS, INITIAL_EQUIPMENT } from '../lib/data';
import {
  CalendarCheck,
  Package,
  ShieldCheck,
  UploadCloud,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Boxes,
  BarChart3,
  History,
  Lock,
  Layers,
  Award,
} from 'lucide-react';

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, can, accessibleUnits } = useAuth();

  const totalMembers = INITIAL_MEMBERS.length;
  const totalEquipment = INITIAL_EQUIPMENT.reduce((acc, curr) => acc + curr.total_quantity, 0);

  // Helper for unit category and badge styling
  const getUnitStageBadge = (code: string) => {
    // 1. Cubs / Brownies (أشبال وزهرات): Warm Amber / Wood Tan
    if (code.includes('ashbal')) {
      return {
        badge: 'bg-amber-100/80 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        stage: language === 'ar' ? 'أشبال' : 'Cubs',
        accentBorder: 'border-s-4 border-s-amber-500',
      };
    }
    if (code.includes('zahrat')) {
      return {
        badge: 'bg-amber-100/80 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
        stage: language === 'ar' ? 'زهرات' : 'Brownies',
        accentBorder: 'border-s-4 border-s-amber-500',
      };
    }
    // 2. Scouts / Guides (كشافة ومرشدات): Deep Scout Forest Green
    if (code.includes('kashafa')) {
      return {
        badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        stage: language === 'ar' ? 'كشافة' : 'Scouts',
        accentBorder: 'border-s-4 border-s-[#1B4332]',
      };
    }
    if (code.includes('morshdat')) {
      return {
        badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        stage: language === 'ar' ? 'مرشدات' : 'Guides',
        accentBorder: 'border-s-4 border-s-[#1B4332]',
      };
    }
    // 3. Advanced & Rovers (متقدم وجوالة): Alpine Navy Blue
    if (code.includes('motakadem')) {
      return {
        badge: 'bg-sky-100/80 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        stage: language === 'ar' ? 'متقدم' : 'Venturers',
        accentBorder: 'border-s-4 border-s-sky-600',
      };
    }
    if (code.includes('ra2edat')) {
      return {
        badge: 'bg-sky-100/80 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        stage: language === 'ar' ? 'رائدات' : 'Rangers',
        accentBorder: 'border-s-4 border-s-sky-600',
      };
    }
    if (code.includes('gawala')) {
      return {
        badge: 'bg-sky-100/80 text-sky-900 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
        stage: language === 'ar' ? 'جوالة' : 'Rovers',
        accentBorder: 'border-s-4 border-s-sky-600',
      };
    }
    // 4. Leadership (قادة): Heritage Burgundy / Maroon
    return {
      badge: 'bg-rose-100/80 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
      stage: language === 'ar' ? 'قادة' : 'Leadership',
      accentBorder: 'border-s-4 border-s-rose-700',
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dignified Scout Command Header */}
      <div className="relative overflow-hidden bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] rounded-xl p-6 shadow-xs">
        <div className="absolute top-0 start-0 w-full h-1.5 bg-[#1B4332]" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] border border-[#2D6A4F]/30">
                <span className="w-2 h-2 rounded-full bg-[#1B4332] dark:bg-[#4ade80] animate-pulse" />
                <span>{language === 'ar' ? 'المنظومة في حالة تشغيل نشط' : 'Platform Active • Season 2026'}</span>
              </span>

              {currentUser && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-800 dark:text-stone-200 border border-[#E2DED6] dark:border-[#27342F]">
                  <span className="font-bold">{currentUser.full_name.split(' (')[0]}</span>
                  <span>&bull;</span>
                  <span className="text-[#1B4332] dark:text-[#86efac] font-bold">{currentRole?.description.split(' - ')[0]}</span>
                  {currentUnit && (
                    <>
                      <span>&bull;</span>
                      <span className="text-stone-900 dark:text-white font-bold">
                        {language === 'ar' ? currentUnit.name_ar : currentUnit.name_en}
                      </span>
                    </>
                  )}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50">
              {t('system_name')}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              {language === 'ar'
                ? 'إدارة المراحل والطلائع، تسجيل الحضور والانصراف، تدقيق حجوزات مهمات العهدة، مصفوفة الصلاحيات، وأرشفة الوسائط بجوجل درايف.'
                : 'Scout management platform for unit rosters, attendance, equipment bookings with conflict checks, RBAC permissions, and Google Drive archive.'}
            </p>
          </div>

          {/* Tactile Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-[#FDF6EC]" strokeWidth={2} />
              <span>{t('nav_attendance')}</span>
            </Link>
            <Link
              href="/inventory"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] text-[#374151] dark:text-stone-200 border border-[#D5CFC5] dark:border-[#27342F] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              <Package className="w-4 h-4 text-[#B45309]" strokeWidth={2} />
              <span>{t('nav_inventory')}</span>
            </Link>

            {isSuperAdmin && (
              <>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] text-[#374151] dark:text-stone-200 border border-[#D5CFC5] dark:border-[#27342F] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <BarChart3 className="w-4 h-4 text-[#2D6A4F]" strokeWidth={2} />
                  <span>{t('nav_analytics')}</span>
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] text-[#374151] dark:text-stone-200 border border-[#D5CFC5] dark:border-[#27342F] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  <History className="w-4 h-4 text-stone-500" strokeWidth={2} />
                  <span>{t('nav_audit_logs')}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Unified 4-Column Stat KPI Cards (Consistent High Contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Active Units */}
        <div className="bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] rounded-xl p-4.5 space-y-2 hover:border-[#2D6A4F] dark:hover:border-[#4ade80]/50 transition-colors shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === 'ar' ? 'الوحدات الكشفية' : 'Active Units'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] flex items-center justify-center">
              <Users className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">12</div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">
            {language === 'ar' ? 'أشبال، زهرات، كشافة، جوالة' : 'Cubs to Rovers Units'}
          </div>
        </div>

        {/* Total Members & Attendance */}
        <div className="bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] rounded-xl p-4.5 space-y-2 hover:border-[#2D6A4F] dark:hover:border-[#4ade80]/50 transition-colors shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === 'ar' ? 'إجمالي الأعضاء' : 'Total Members'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">1,048</div>
          <div className="text-xs font-bold text-[#2D6A4F] dark:text-[#86efac] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] dark:bg-[#4ade80]" />
            <span>{language === 'ar' ? '91.4% متوسط الحضور الفصلي' : '91.4% Avg Attendance'}</span>
          </div>
        </div>

        {/* Equipment & Stock */}
        <div className="bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] rounded-xl p-4.5 space-y-2 hover:border-[#2D6A4F] dark:hover:border-[#4ade80]/50 transition-colors shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === 'ar' ? 'مهمات العهدة' : 'Equipment Count'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FDF6EC] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">{totalEquipment}</div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">
            {language === 'ar' ? 'جاهزية 94.2% بالمستودع' : '94.2% In-Stock Ready'}
          </div>
        </div>

        {/* Staging Disk */}
        <div className="bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] rounded-xl p-4.5 space-y-2 hover:border-[#2D6A4F] dark:hover:border-[#4ade80]/50 transition-colors shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              {language === 'ar' ? 'التخزين المؤقت' : 'Staging Disk'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 font-mono tabular-nums">15 GB</div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400">
            {language === 'ar' ? 'مزامنة فورية بجوجل درايف' : 'Live Sync to Google Drive'}
          </div>
        </div>
      </div>

      {/* Units Structure Grid (12 Units) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2DED6] dark:border-[#27342F]">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50">
              {isSuperAdmin
                ? (language === 'ar' ? 'الهيكل التنظيمي للمراحل والفرق الكشفية (١٢ وحدة)' : '12 Organizational Units Structure')
                : (language === 'ar' ? `فريقك الكشفي المسند إليك (${accessibleUnits.length} وحدة)` : `Your Assigned Unit (${accessibleUnits.length})`)}
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {isSuperAdmin
                ? (language === 'ar'
                    ? 'توزيع المراحل من الأشبال والزهرات وصولاً للجوالة والقادة وقواعد التوازي والترقي'
                    : 'Structure covering Cubs & Brownies through Scouts, Guides, Rovers, and Leadership.')
                : (language === 'ar'
                    ? 'نطاق إشرافك المباشر ومرحلتك الكشفية المسندة'
                    : 'Your active team and assigned leadership scope.')}
            </p>
          </div>
          <Link
            href="/attendance"
            className="text-xs font-bold text-[#1B4332] dark:text-[#86efac] hover:text-[#143326] flex items-center gap-1.5 transition-colors"
          >
            <span>{language === 'ar' ? 'تسجيل الحضور' : 'Take Attendance'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(isSuperAdmin ? INITIAL_UNITS : accessibleUnits).map((unit) => {
            const isParallel = unit.code.includes('_a') || unit.code.includes('_b');
            const stageStyle = getUnitStageBadge(unit.code);

            return (
              <div
                key={unit.id}
                className={`p-4.5 rounded-xl bg-white dark:bg-[#161D1A] border border-[#DFD9CE] dark:border-[#2A3731] hover:border-[#2D6A4F] hover:shadow-md transition-all flex flex-col justify-between ${stageStyle.accentBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-bold text-stone-800 dark:text-stone-200 bg-[#F1EFEA] dark:bg-[#1E2723] px-2 py-0.5 rounded border border-[#E2DED6] dark:border-[#27342F]">
                      {unit.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stageStyle.badge}`}>
                        {stageStyle.stage}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-700 dark:text-stone-300 border border-[#E2DED6] dark:border-[#27342F]">
                        {unit.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : unit.gender === 'girls' ? (language === 'ar' ? 'بنات' : 'Girls') : (language === 'ar' ? 'مختلط' : 'Mixed')}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                    {language === 'ar' ? unit.name_ar : unit.name_en}
                  </h3>
                  <div className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1">
                    {unit.target_grade} &bull; {language === 'ar' ? `الأعمار ${unit.min_age}–${unit.max_age} سنة` : `Ages ${unit.min_age}–${unit.max_age}`}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2DED6] dark:border-[#27342F] flex items-center justify-between text-xs">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EFECE6] dark:bg-[#232F2A] text-stone-700 dark:text-stone-300 border border-[#DFD9CE] dark:border-[#2E3C36]">
                    {isParallel ? (language === 'ar' ? 'مسار متوازي' : 'Parallel') : (language === 'ar' ? 'مسار متدرج' : 'Standard')}
                  </span>
                  <Link
                    href={`/attendance?unit=${unit.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-[#1B4332] dark:text-[#86efac] bg-[#E8F0EC] dark:bg-[#1B4332]/40 hover:bg-[#1B4332] hover:text-white dark:hover:bg-[#1B4332] transition-colors group cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'كشف الحضور' : 'Roster'}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" strokeWidth={2} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
