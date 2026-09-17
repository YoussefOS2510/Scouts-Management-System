'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_UNITS } from '../lib/data';
import { getUnitAttendanceAnalytics } from '../lib/attendanceAnalyticsData';
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarCheck,
  CheckCircle2,
  HelpCircle,
  Award,
  AlertTriangle,
  Phone,
  ShieldCheck,
  ChevronRight,
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  GraduationCap,
} from 'lucide-react';

interface TeamAttendanceAnalyticsProps {
  initialUnitId?: number;
  onBackToSession?: () => void;
}

type SortKey = 'percentage' | 'name' | 'id' | 'year' | 'patrol';
type SortOrder = 'asc' | 'desc';

export function TeamAttendanceAnalytics({ initialUnitId, onBackToSession }: TeamAttendanceAnalyticsProps) {
  const { language } = useLanguage();
  const { isSuperAdmin, accessibleUnits, currentUnit } = useAuth();

  // Selected unit: default to passed prop, or current unit, or first accessible
  const defaultUnitId = initialUnitId || currentUnit?.id || (accessibleUnits[0]?.id ?? 5);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnitId);

  // Sorting & Filtering State for Individual Scouts
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [patrolFilter, setPatrolFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Sync if accessibleUnits change or currentUnit changes
  React.useEffect(() => {
    if (currentUnit && !isSuperAdmin) {
      setSelectedUnitId(currentUnit.id);
    } else if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, currentUnit, isSuperAdmin, selectedUnitId]);

  // Analytics data for the selected unit
  const data = useMemo(() => {
    return getUnitAttendanceAnalytics(selectedUnitId);
  }, [selectedUnitId]);

  // Click-to-sort toggle for table headers
  const handleSortToggle = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'percentage' ? 'desc' : 'asc');
    }
  };

  // Filtered and Sorted Scouts List
  const sortedAndFilteredScouts = useMemo(() => {
    let list = [...data.allScoutsStats];

    // Search query filter (name or member code)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name_ar.toLowerCase().includes(q) ||
          s.name_en.toLowerCase().includes(q) ||
          s.member_code.toLowerCase().includes(q)
      );
    }

    // Patrol filter
    if (patrolFilter !== 'all') {
      list = list.filter((s) => s.patrol_id === Number(patrolFilter));
    }

    // Attendance Tier filter
    if (tierFilter === '100') {
      list = list.filter((s) => s.attendanceRate === 100);
    } else if (tierFilter === '90') {
      list = list.filter((s) => s.attendanceRate >= 90 && s.attendanceRate < 100);
    } else if (tierFilter === '75') {
      list = list.filter((s) => s.attendanceRate >= 75 && s.attendanceRate < 90);
    } else if (tierFilter === 'below75') {
      list = list.filter((s) => s.attendanceRate < 75 || s.consecutiveAbsences >= 2);
    }

    // Multi-Criteria Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'percentage') {
        cmp = a.attendanceRate - b.attendanceRate;
      } else if (sortKey === 'name') {
        cmp = a.name_ar.localeCompare(b.name_ar, 'ar');
      } else if (sortKey === 'id') {
        cmp = a.member_code.localeCompare(b.member_code);
      } else if (sortKey === 'year') {
        cmp = a.academic_year.localeCompare(b.academic_year);
      } else if (sortKey === 'patrol') {
        cmp = a.patrol_name_ar.localeCompare(b.patrol_name_ar, 'ar');
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [data.allScoutsStats, searchQuery, patrolFilter, tierFilter, sortKey, sortOrder]);

  const selectedUnitObj = INITIAL_UNITS.find((u) => u.id === selectedUnitId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dignified Scout Command Banner & Unit Selector */}
      <div className="bg-[#1B4332] rounded-xl p-6 text-white border border-[#143326] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#86efac]">
              <BarChart3 className="w-4 h-4 text-[#86efac]" strokeWidth={2} />
              <span>
                {language === 'ar'
                  ? `تحليلات حضور الوحدة: ${selectedUnitObj?.name_ar || ''}`
                  : `Team Attendance Telemetry: ${selectedUnitObj?.name_en || ''}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {language === 'ar' ? 'إحصائيات ومؤشرات التزام الحضور' : 'Team Attendance Analytics & Insights'}
            </h1>
            <p className="text-xs text-stone-200 leading-relaxed">
              {language === 'ar'
                ? 'متابعة نسب حضور وانصراف الكشافين، مقارنة أداء الطلائع والسداسيات، ورصد أسباب الاعتذار وحالات الافتقاد.'
                : 'Scout consistency tracking, patrol comparative rates, excuse distribution, and pastoral follow-up alerts.'}
            </p>
          </div>

          {/* Unit Scope Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {isSuperAdmin ? (
              <div className="bg-[#143326] border border-[#2D6A4F] rounded-lg px-3 py-2 flex flex-col gap-1 min-w-[200px]">
                <span className="text-[11px] font-bold text-[#FDF6EC] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#C87A28]" strokeWidth={2} />
                  <span>{language === 'ar' ? 'اختر الفريق / الوحدة للمعاينة:' : 'Select Team to Inspect:'}</span>
                </span>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  className="bg-[#1B4332] text-white text-xs font-bold rounded-md px-3 py-1.5 border border-[#2D6A4F] focus:outline-none focus:ring-1 focus:ring-[#86efac] cursor-pointer"
                >
                  {accessibleUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {language === 'ar' ? u.name_ar : u.name_en}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-[#143326] border border-[#2D6A4F] rounded-lg px-4 py-2.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#1B4332] text-[#86efac] border border-[#2D6A4F] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-stone-300">
                    {language === 'ar' ? 'نطاق فريقك المعتمد' : 'Assigned Team Scope'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {language === 'ar' ? selectedUnitObj?.name_ar : selectedUnitObj?.name_en}
                  </div>
                </div>
              </div>
            )}

            {onBackToSession && (
              <button
                onClick={onBackToSession}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-colors cursor-pointer"
              >
                <span>{language === 'ar' ? 'العودة لسجل الجلسة' : 'Back to Roster'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unified High-Contrast KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Attendance Rate */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-4.5 border border-[#E2DED6] dark:border-[#27342F] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{language === 'ar' ? 'نسبة الحضور الإجمالية' : 'Overall Attendance'}</span>
            <div className="w-7 h-7 rounded-md bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-50">
            {data.overallAttendanceRate}%
          </div>
          <div className="w-full bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#1B4332] dark:bg-[#4ade80] h-full rounded-full transition-all duration-300"
              style={{ width: `${data.overallAttendanceRate}%` }}
            />
          </div>
          <div className="text-xs font-bold text-[#2D6A4F] dark:text-[#86efac] pt-0.5 flex items-center justify-between">
            <span>{language === 'ar' ? 'الهدف: 90%+' : 'Target: 90%+'}</span>
            <span className="font-bold">{language === 'ar' ? 'مستوى ممتاز' : 'Optimal'}</span>
          </div>
        </div>

        {/* Sessions Conducted */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-4.5 border border-[#E2DED6] dark:border-[#27342F] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{language === 'ar' ? 'الجلسات المنعقدة' : 'Sessions Conducted'}</span>
            <div className="w-7 h-7 rounded-md bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-700 dark:text-stone-300 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-50">
            {data.totalSessionsHeld} <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">{language === 'ar' ? 'جلسة' : 'sessions'}</span>
          </div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400 pt-1">
            {language === 'ar'
              ? `متوسط الحضور: ${data.avgPresentPerSession} / ${data.totalScouts} كشاف`
              : `Avg: ${data.avgPresentPerSession} / ${data.totalScouts}`}
          </div>
        </div>

        {/* Excused vs Absent */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-4.5 border border-[#E2DED6] dark:border-[#27342F] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{language === 'ar' ? 'الأعذار والغياب' : 'Excused vs Absent'}</span>
            <div className="w-7 h-7 rounded-md bg-[#FDF6EC] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#B45309] dark:text-amber-400">{data.avgExcusedPerSession}</span>
            <span className="text-xs font-bold text-[#B45309]">{language === 'ar' ? 'عذر' : 'exc'}</span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">{data.avgAbsentPerSession}</span>
            <span className="text-xs font-bold text-rose-700">{language === 'ar' ? 'غياب' : 'abs'}</span>
          </div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400 pt-0.5">
            {language === 'ar' ? 'مسجلة آلياً بالكشف' : 'Auto-recorded'}
          </div>
        </div>

        {/* Regular Scouts */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-4.5 border border-[#E2DED6] dark:border-[#27342F] space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{language === 'ar' ? 'شرف الالتزام الكامل' : '100% Attendance'}</span>
            <div className="w-7 h-7 rounded-md bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] flex items-center justify-center">
              <Award className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-50">
            {data.honorRoll.length} <span className="text-xs font-semibold text-[#1B4332] dark:text-[#86efac]">{language === 'ar' ? 'كشافين' : 'scouts'}</span>
          </div>
          <div className="text-xs font-medium text-stone-600 dark:text-stone-400 pt-1">
            {language === 'ar' ? '١٢ من ١٢ جلسة بدون انقطاع' : '12/12 perfect sessions'}
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Patrol Breakdown & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patrol / Six Breakdown Card */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-5 border border-[#DFD9CE] dark:border-[#2A3731] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DED6] dark:border-[#27342F]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {language === 'ar' ? 'مقارنة نسب الحضور بين الطلائع' : 'Patrol Attendance Comparison'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {language === 'ar' ? 'ترتيب الطلائع حسب نسبة الالتزام بالحضور' : 'Ranked by weekly attendance consistency'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.patrolsStats.map((patrol, idx) => (
              <div key={patrol.patrolId} className="p-3 rounded-lg bg-[#F8F7F4] dark:bg-[#121815] border border-[#E2DED6] dark:border-[#27342F] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-[#1B4332] dark:bg-[#2D6A4F] text-white text-[11px] font-mono font-bold tabular-nums flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {language === 'ar' ? patrol.name_ar : patrol.name_en}
                    </span>
                    <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      ({patrol.scoutCount} {language === 'ar' ? 'كشاف' : 'scouts'})
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100 text-xs">
                    {patrol.attendanceRate}%
                  </span>
                </div>

                <div className="w-full bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      patrol.status === 'top' ? 'bg-[#1B4332] dark:bg-[#4ade80]' : patrol.status === 'optimal' ? 'bg-[#2D6A4F] dark:bg-[#86efac]' : 'bg-[#B45309]'
                    }`}
                    style={{ width: `${patrol.attendanceRate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 pt-0.5">
                  <span className="font-mono tabular-nums font-medium">{patrol.perfectAttendanceCount} {language === 'ar' ? 'التزام كامل 100%' : '100% attendance'}</span>
                  <span className="font-semibold text-[#1B4332] dark:text-[#86efac]">{patrol.attendanceRate >= 94 ? 'طليعة مثالية' : 'أداء منتظم'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions History Telemetry Card */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-5 border border-[#DFD9CE] dark:border-[#2A3731] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2DED6] dark:border-[#27342F]">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {language === 'ar' ? 'تطور نسبة الحضور عبر الجلسات' : 'Attendance Trend Across Sessions'}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {language === 'ar' ? 'آخر 6 جلسات كشفية مع تفصيل الحضور' : 'Last 6 weekly scout sessions telemetry'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.sessionsHistory.map((s, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#F8F7F4] dark:bg-[#121815] border border-[#E2DED6] dark:border-[#27342F] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-bold text-xs text-stone-700 dark:text-stone-300 bg-[#E2DED6]/70 dark:bg-[#27342F] px-1.5 py-0.5 rounded border border-[#D5CFC5] dark:border-[#2E3C36]">
                      {s.date}
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {language === 'ar' ? s.title_ar : s.title_en}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 mt-1 font-mono tabular-nums font-semibold">
                    <span className="text-[#1B4332] dark:text-[#86efac]">{s.present} {language === 'ar' ? 'حاضر' : 'P'}</span>
                    <span>•</span>
                    <span className="text-[#B45309] dark:text-amber-400">{s.excused} {language === 'ar' ? 'معتذر' : 'E'}</span>
                    <span>•</span>
                    <span className="text-rose-700 dark:text-rose-400">{s.absent} {language === 'ar' ? 'غائب' : 'A'}</span>
                    {s.late > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-sky-700 dark:text-sky-400">+{s.late} {language === 'ar' ? 'متأخر' : 'L'}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-stone-100">{s.rate}%</span>
                  <div className="w-16 bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1B4332] dark:bg-[#4ade80] h-full rounded-full" style={{ width: `${s.rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Excuses Analysis & Pastoral Follow-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Excuse Distribution Card */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-5 border border-[#DFD9CE] dark:border-[#2A3731] space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2DED6] dark:border-[#27342F]">
            <HelpCircle className="w-4 h-4 text-[#B45309]" strokeWidth={2} />
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                {language === 'ar' ? 'تحليل أسباب الاعتذار' : 'Excuse Reasons Distribution'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {language === 'ar' ? 'تصنيف الأعذار المدخلة' : 'Breakdown of recorded reasons'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {data.excuseBreakdown.map((exc, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                  <span>{language === 'ar' ? exc.category_ar : exc.category_en}</span>
                  <span className="font-mono tabular-nums text-stone-600 dark:text-stone-400">{exc.percentage}% ({exc.count})</span>
                </div>
                <div className="w-full bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
                  <div className={`${exc.color} h-full rounded-full`} style={{ width: `${exc.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Honor Roll (100% Attendance) */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-5 border border-[#DFD9CE] dark:border-[#2A3731] space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2DED6] dark:border-[#27342F]">
            <Award className="w-4 h-4 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                {language === 'ar' ? 'شرف الالتزام (100%)' : 'Honor Roll (100% Attendance)'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {language === 'ar' ? 'كشافين بدون أي غياب' : 'Scouts with perfect attendance'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {data.honorRoll.map((scout) => (
              <div key={scout.id} className="p-2.5 rounded-lg bg-[#F8F7F4] dark:bg-[#121815] border border-[#E2DED6] dark:border-[#27342F] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">
                    {language === 'ar' ? scout.name_ar : scout.name_en}
                  </div>
                  <div className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                    {language === 'ar' ? scout.patrol_name_ar : scout.patrol_name_en}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded font-mono tabular-nums text-xs font-bold bg-[#E8F0EC] dark:bg-[#1B4332]/40 text-[#1B4332] dark:text-[#86efac] border border-[#2D6A4F]/30">
                  100%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pastoral Care & Follow-Up */}
        <div className="bg-white dark:bg-[#161D1A] rounded-xl p-5 border border-[#DFD9CE] dark:border-[#2A3731] space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2DED6] dark:border-[#27342F]">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" strokeWidth={2} />
            <div>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-xs uppercase tracking-wider">
                {language === 'ar' ? 'متابعة وافتقاد رعوي' : 'Pastoral Care & Follow-Up'}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {language === 'ar' ? 'غياب متكرر بدون عذر' : 'Consecutive unexcused absences'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {data.needsFollowUp.map((scout) => (
              <div key={scout.id} className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">
                    {language === 'ar' ? scout.name_ar : scout.name_en}
                  </div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono tabular-nums font-bold">
                    {language === 'ar' ? `غياب ${scout.consecutiveAbsences} متتالي` : `${scout.consecutiveAbsences} consecutive`}
                  </div>
                </div>
                {scout.father_phone && (
                  <a
                    href={`tel:${scout.father_phone}`}
                    className="p-1 px-2 rounded bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 text-rose-800 dark:text-rose-200 transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Phone className="w-3 h-3" strokeWidth={2} />
                    <span>{language === 'ar' ? 'اتصال' : 'Call'}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Scout Attendance Table & Sort/Filter Controls */}
      <div className="bg-white dark:bg-[#161D1A] rounded-xl border border-[#DFD9CE] dark:border-[#2A3731] overflow-hidden space-y-4 p-5 shadow-2xs">
        {/* Table Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2DED6] dark:border-[#27342F] pb-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">
              {language === 'ar' ? 'سجل الحضور التفصيلي لكشافي الوحدة' : 'Individual Scout Attendance & Details'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              {language === 'ar'
                ? 'نسب الحضور، عدد الجلسات، الأعذار، وسجل الالتزام لكل كشاف مع إمكانية الفرز والبحث الفوري'
                : 'Scout attendance percentages, session counts, excuses, and consistency records with instant sorting and filtering'}
            </p>
          </div>

          <div>
            <span className="text-xs font-mono tabular-nums font-bold text-stone-700 dark:text-stone-300 bg-[#F1EFEA] dark:bg-[#1E2723] px-2.5 py-1 rounded border border-[#E2DED6] dark:border-[#27342F]">
              {language === 'ar'
                ? `${sortedAndFilteredScouts.length} من أصل ${data.allScoutsStats.length} كشاف`
                : `${sortedAndFilteredScouts.length} / ${data.allScoutsStats.length} scouts`}
            </span>
          </div>
        </div>

        {/* Interactive Controls Bar: Search, Filters, & Sorting */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-500 absolute start-3 top-2.5" strokeWidth={2} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث بالاسم أو كود الكشاف...' : 'Search by scout name or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F7F4] dark:bg-[#121815] border border-[#D5CFC5] dark:border-[#27342F] rounded-lg ps-9 pe-3 py-2 text-xs font-medium text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:ring-1 focus:ring-[#1B4332] focus:outline-none"
            />
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Patrol Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F8F7F4] dark:bg-[#121815] border border-[#D5CFC5] dark:border-[#27342F] rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-500" strokeWidth={2} />
              <select
                value={patrolFilter}
                onChange={(e) => setPatrolFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'ar' ? 'جميع الطلائع' : 'All Patrols'}</option>
                {data.patrolsStats.map((p) => (
                  <option key={p.patrolId} value={p.patrolId}>
                    {language === 'ar' ? p.name_ar : p.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Criteria Selector */}
            <div className="flex items-center gap-1.5 bg-[#F8F7F4] dark:bg-[#121815] border border-[#D5CFC5] dark:border-[#27342F] rounded-lg px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" strokeWidth={2} />
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400">{language === 'ar' ? 'الفرز:' : 'Sort:'}</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="percentage">{language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</option>
                <option value="name">{language === 'ar' ? 'الاسم' : 'Scout Name'}</option>
                <option value="id">{language === 'ar' ? 'كود الكشاف' : 'Member Code'}</option>
                <option value="year">{language === 'ar' ? 'السنة الدراسية' : 'Academic Year'}</option>
                <option value="patrol">{language === 'ar' ? 'الطليعة' : 'Patrol'}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={language === 'ar' ? 'تبديل اتجاه الترتيب' : 'Toggle Sort Direction'}
                className="p-0.5 hover:bg-[#E2DED6] dark:hover:bg-[#27342F] rounded transition-colors cursor-pointer text-stone-700 dark:text-stone-300"
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Attendance Tier Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs font-bold text-stone-600 dark:text-stone-400">{language === 'ar' ? 'مستوى الالتزام:' : 'Tier:'}</span>
          {[
            { key: 'all', label_ar: 'الكل', label_en: 'All' },
            { key: '100', label_ar: 'التزام 100%', label_en: '100% Perfect' },
            { key: '90', label_ar: 'مرتفع (90% - 99%)', label_en: 'High (90-99%)' },
            { key: '75', label_ar: 'متوسط (75% - 89%)', label_en: 'Moderate (75-89%)' },
            { key: 'below75', label_ar: 'يحتاج متابعة (<75%)', label_en: 'Follow-up (<75%)' },
          ].map((tier) => (
            <button
              key={tier.key}
              onClick={() => setTierFilter(tier.key)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                tierFilter === tier.key
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-700 dark:text-stone-300 hover:text-stone-900 border border-[#E2DED6] dark:border-[#27342F]'
              }`}
            >
              {language === 'ar' ? tier.label_ar : tier.label_en}
            </button>
          ))}
        </div>

        {/* Scouts Attendance Data Table */}
        <div className="overflow-x-auto rounded-lg border border-[#E2DED6] dark:border-[#27342F]">
          <table className="w-full text-start text-xs">
            <thead className="bg-[#F8F7F4] dark:bg-[#121815] text-stone-600 dark:text-stone-400 border-b border-[#E2DED6] dark:border-[#27342F] select-none">
              <tr>
                <th
                  onClick={() => handleSortToggle('id')}
                  className="px-4 py-2.5 text-start font-bold cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'كود الكشاف' : 'Code'}</span>
                    {sortKey === 'id' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle('name')}
                  className="px-4 py-2.5 text-start font-bold cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'الاسم' : 'Name'}</span>
                    {sortKey === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle('year')}
                  className="px-4 py-2.5 text-start font-bold cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'السنة' : 'Year'}</span>
                    {sortKey === 'year' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSortToggle('patrol')}
                  className="px-4 py-2.5 text-start font-bold cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'الطليعة' : 'Patrol'}</span>
                    {sortKey === 'patrol' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                <th className="px-4 py-2.5 text-start font-bold">
                  <span>{language === 'ar' ? 'تفصيل الحضور' : 'Breakdown'}</span>
                </th>

                <th
                  onClick={() => handleSortToggle('percentage')}
                  className="px-4 py-2.5 text-start font-bold cursor-pointer hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'نسبة الحضور' : 'Rate'}</span>
                    {sortKey === 'percentage' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                <th className="px-4 py-2.5 text-start font-bold">
                  <span>{language === 'ar' ? 'الحالة' : 'Status'}</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2DED6] dark:divide-[#27342F] font-medium">
              {sortedAndFilteredScouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-500 text-xs font-mono">
                    <p>{language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No scouts match the criteria'}</p>
                    <button
                      onClick={() => { setSearchQuery(''); setPatrolFilter('all'); setTierFilter('all'); }}
                      className="mt-1.5 text-xs text-[#1B4332] hover:underline cursor-pointer dark:text-[#86efac] font-bold"
                    >
                      {language === 'ar' ? 'إعادة ضبط التصفية' : 'Reset filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredScouts.map((scout) => (
                  <tr key={scout.id} className="hover:bg-[#F1EFEA]/60 dark:hover:bg-[#1E2723]/60 transition-colors">
                    {/* Member Code */}
                    <td className="px-4 py-2.5 font-mono text-xs text-stone-700 dark:text-stone-300 whitespace-nowrap font-bold">
                      <span className="bg-[#F1EFEA] dark:bg-[#1E2723] px-1.5 py-0.5 rounded border border-[#E2DED6] dark:border-[#27342F]">
                        {scout.member_code}
                      </span>
                    </td>

                    {/* Scout Name */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        {language === 'ar' ? scout.name_ar : scout.name_en}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {language === 'ar' ? scout.name_en : scout.name_ar}
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 text-stone-600 dark:text-stone-400 text-xs font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.75} />
                        <span>{scout.academic_year}</span>
                      </div>
                    </td>

                    {/* Patrol / Six */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {language === 'ar' ? scout.patrol_name_ar : scout.patrol_name_en}
                      </span>
                    </td>

                    {/* Sessions Breakdown */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px] font-mono tabular-nums font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-[#E8F0EC] text-[#1B4332] border border-[#2D6A4F]/30 dark:bg-[#1B4332]/40 dark:text-[#86efac]">
                          {scout.presentSessions}P
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FDF6EC] text-[#B45309] border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
                          {scout.excusedSessions}E
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                          {scout.absentSessions}A
                        </span>
                        {scout.lateSessions > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F1EFEA] text-sky-800 border border-[#E2DED6] dark:bg-[#1E2723] dark:text-sky-400">
                            +{scout.lateSessions}L
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Percentage & Progress Bar */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="w-28 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className={`font-bold ${
                            scout.attendanceRate === 100
                              ? 'text-[#1B4332] dark:text-[#86efac]'
                              : scout.attendanceRate >= 90
                              ? 'text-stone-900 dark:text-stone-100'
                              : scout.attendanceRate >= 75
                              ? 'text-stone-600 dark:text-stone-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {scout.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {scout.presentSessions + scout.lateSessions}/{scout.totalSessions}
                          </span>
                        </div>
                        <div className="w-full bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              scout.attendanceRate === 100
                                ? 'bg-[#1B4332] dark:bg-[#4ade80]'
                                : scout.attendanceRate >= 90
                                ? 'bg-[#2D6A4F] dark:bg-[#86efac]'
                                : scout.attendanceRate >= 75
                                ? 'bg-stone-500'
                                : 'bg-rose-600'
                            }`}
                            style={{ width: `${scout.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status & Action */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {scout.status === 'perfect' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F0EC] text-[#1B4332] border border-[#2D6A4F]/30 dark:bg-[#1B4332]/40 dark:text-[#86efac] text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                            <span>{language === 'ar' ? 'التزام كامل' : '100%'}</span>
                          </span>
                        ) : scout.status === 'needs_followup' ? (
                          <div className="flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-rose-700" strokeWidth={2} />
                              <span>{language === 'ar' ? `غياب ${scout.consecutiveAbsences}` : `${scout.consecutiveAbsences} abs`}</span>
                            </span>
                            {scout.father_phone && (
                              <a
                                href={`tel:${scout.father_phone}`}
                                title={language === 'ar' ? 'اتصال بولي الأمر' : 'Call Parent'}
                                className="p-1 rounded bg-[#F1EFEA] hover:bg-[#E2DED6] dark:bg-[#1E2723] dark:hover:bg-[#27342F] text-stone-700 dark:text-stone-300 transition-colors"
                              >
                                <Phone className="w-3 h-3" strokeWidth={2} />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1EFEA] text-stone-700 border border-[#E2DED6] dark:bg-[#1E2723] dark:text-stone-300 dark:border-[#27342F] text-[10px] font-bold">
                            <span>{language === 'ar' ? 'منتظم' : 'Regular'}</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
