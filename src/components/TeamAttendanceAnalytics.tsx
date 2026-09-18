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
      {/* Google Workspace Analytics Header & Unit Selector */}
      <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-6 border border-[#E0E3E7] dark:border-[#303134] shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0B57D0] dark:text-[#82B1FF]">
              <BarChart3 className="w-4 h-4 text-[#0B57D0]" strokeWidth={2} />
              <span>
                {language === 'ar'
                  ? `تحليلات حضور الوحدة: ${selectedUnitObj?.name_ar || ''}`
                  : `Team Attendance Telemetry: ${selectedUnitObj?.name_en || ''}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3]">
              {language === 'ar' ? 'إحصائيات ومؤشرات التزام الحضور' : 'Team Attendance Analytics & Insights'}
            </h1>
            <p className="text-xs text-[#444746] dark:text-[#8E918F] leading-relaxed">
              {language === 'ar'
                ? 'متابعة نسب حضور وانصراف الكشافين، مقارنة أداء الطلائع والسداسيات، ورصد أسباب الاعتذار وحالات الافتقاد.'
                : 'Scout consistency tracking, patrol comparative rates, excuse distribution, and pastoral follow-up alerts.'}
            </p>
          </div>

          {/* Unit Scope Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {isSuperAdmin ? (
              <div className="bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] rounded-xl px-3 py-2 flex flex-col gap-1 min-w-[200px]">
                <span className="text-[11px] font-medium text-[#444746] dark:text-[#C4C7C5] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                  <span>{language === 'ar' ? 'اختر الفريق / الوحدة للمعاينة:' : 'Select Team to Inspect:'}</span>
                </span>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  className="bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] text-xs font-medium rounded-lg px-3 py-1.5 border border-[#E0E3E7] dark:border-[#303134] focus:outline-none focus:ring-1 focus:ring-[#0B57D0] cursor-pointer"
                >
                  {accessibleUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {language === 'ar' ? u.name_ar : u.name_en}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] rounded-xl px-4 py-2.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#C2E7FF] text-[#001D35] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] font-medium text-[#444746] dark:text-[#8E918F]">
                    {language === 'ar' ? 'نطاق فريقك المعتمد' : 'Assigned Team Scope'}
                  </div>
                  <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? selectedUnitObj?.name_ar : selectedUnitObj?.name_en}
                  </div>
                </div>
              </div>
            )}

            {onBackToSession && (
              <button
                onClick={onBackToSession}
                className="px-4 py-2 rounded-xl bg-[#F0F4F9] hover:bg-[#E9EEF6] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] font-medium text-xs flex items-center justify-center gap-1.5 border border-[#E0E3E7] dark:border-[#303134] transition-colors cursor-pointer"
              >
                <span>{language === 'ar' ? 'العودة لسجل الجلسة' : 'Back to Roster'}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unified High-Contrast KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 sm:p-6 border border-[#E0E3E7] dark:border-[#303134] space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'نسبة الحضور الإجمالية' : 'Overall Attendance'}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#146C2E] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">
            {data.overallAttendanceRate}%
          </div>
          <div className="w-full bg-[#F0F4F9] dark:bg-[#282A2C] h-2 rounded-full overflow-hidden flex items-center">
            <div
              className="bg-[#146C2E] h-full rounded-full transition-all duration-300"
              style={{ width: `${data.overallAttendanceRate}%` }}
            />
          </div>
          <div className="text-xs font-medium text-[#146C2E] dark:text-emerald-400 flex items-center justify-between pt-0.5">
            <span>{language === 'ar' ? 'الهدف: 90%+' : 'Target: 90%+'}</span>
            <span className="font-semibold">{language === 'ar' ? 'مستوى ممتاز' : 'Optimal'}</span>
          </div>
        </div>

        {/* Sessions Conducted */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 sm:p-6 border border-[#E0E3E7] dark:border-[#303134] space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'الجلسات المنعقدة' : 'Sessions Conducted'}</span>
            <div className="w-9 h-9 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] text-[#0B57D0] flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">
            {data.totalSessionsHeld} <span className="text-xs font-medium text-[#747775]">{language === 'ar' ? 'جلسة' : 'sessions'}</span>
          </div>
          <div className="text-xs text-[#747775] pt-0.5">
            {language === 'ar'
              ? `متوسط الحضور: ${data.avgPresentPerSession} / ${data.totalScouts} كشاف`
              : `Avg: ${data.avgPresentPerSession} / ${data.totalScouts}`}
          </div>
        </div>

        {/* Excused vs Absent */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 sm:p-6 border border-[#E0E3E7] dark:border-[#303134] space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'الأعذار والغياب' : 'Excused vs Absent'}</span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF7EC] dark:bg-amber-950/40 text-[#B06000] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-[#B06000] dark:text-amber-400">{data.avgExcusedPerSession}</span>
            <span className="text-xs text-[#B06000]">{language === 'ar' ? 'عذر' : 'exc'}</span>
            <span className="text-[#E0E3E7] dark:text-[#383A3C]">•</span>
            <span className="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-[#B3261E] dark:text-rose-400">{data.avgAbsentPerSession}</span>
            <span className="text-xs text-[#B3261E]">{language === 'ar' ? 'غياب' : 'abs'}</span>
          </div>
          <div className="text-xs text-[#747775] pt-0.5">
            {language === 'ar' ? 'مسجلة آلياً بالكشف' : 'Auto-recorded in sheets'}
          </div>
        </div>

        {/* Regular Scouts */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 sm:p-6 border border-[#E0E3E7] dark:border-[#303134] space-y-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">{language === 'ar' ? 'شرف الالتزام الكامل' : '100% Attendance'}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#146C2E] flex items-center justify-center">
              <Award className="w-4 h-4" strokeWidth={2} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-[#1F1F1F] dark:text-[#E3E3E3]">
            {data.honorRoll.length} <span className="text-xs font-medium text-[#146C2E] dark:text-emerald-400">{language === 'ar' ? 'كشافين' : 'scouts'}</span>
          </div>
          <div className="text-xs text-[#747775] pt-0.5">
            {language === 'ar' ? '١٢ من ١٢ جلسة بدون انقطاع' : '12/12 perfect sessions'}
          </div>
        </div>
      </div>

      {/* Main Analysis Section: Patrol Breakdown & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patrol / Six Breakdown Card */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 border border-[#E0E3E7] dark:border-[#303134] space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0B57D0]" strokeWidth={2} />
              <div>
                <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">
                  {language === 'ar' ? 'مقارنة نسب الحضور بين الطلائع' : 'Patrol Attendance Comparison'}
                </h3>
                <p className="text-xs text-[#747775] mt-0.5">
                  {language === 'ar' ? 'ترتيب الطلائع حسب نسبة الالتزام بالحضور' : 'Ranked by weekly attendance consistency'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.patrolsStats.map((patrol, idx) => (
              <div
                key={patrol.patrolId}
                className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center gap-3 text-xs"
              >
                {/* Left: Rank index + Patrol Name */}
                <div className="w-36 sm:w-44 shrink-0 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B57D0] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                    {language === 'ar' ? patrol.name_ar : patrol.name_en}
                  </span>
                  <span className="text-[#747775] font-mono tabular-nums text-[11px] shrink-0">
                    ({patrol.scoutCount})
                  </span>
                </div>

                {/* Center: Progress Bar Centered */}
                <div className="flex-1 h-2 bg-[#E0E3E7] dark:bg-[#383A3C] rounded-full overflow-hidden flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      patrol.status === 'top' ? 'bg-[#146C2E]' : patrol.status === 'optimal' ? 'bg-[#0B57D0]' : 'bg-[#B06000]'
                    }`}
                    style={{ width: `${patrol.attendanceRate}%` }}
                  />
                </div>

                {/* Right: Percentage Value Centered with the Bar */}
                <div className="w-16 text-end font-mono tabular-nums font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] shrink-0 text-xs flex items-center justify-end gap-1.5">
                  <span>{patrol.attendanceRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions History Telemetry Card */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 border border-[#E0E3E7] dark:border-[#303134] space-y-4 shadow-none">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#0B57D0]" strokeWidth={2} />
              <div>
                <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">
                  {language === 'ar' ? 'تطور نسبة الحضور عبر الجلسات' : 'Attendance Trend Across Sessions'}
                </h3>
                <p className="text-xs text-[#747775] mt-0.5">
                  {language === 'ar' ? 'آخر 6 جلسات كشفية مع تفصيل الحضور' : 'Last 6 weekly scout sessions telemetry'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {data.sessionsHistory.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center gap-3 text-xs"
              >
                {/* Left: Date + Title */}
                <div className="w-40 sm:w-52 shrink-0 flex items-center gap-2">
                  <span className="font-mono tabular-nums text-[10px] text-[#444746] dark:text-[#C4C7C5] bg-white dark:bg-[#1E1F20] px-2 py-0.5 rounded-md border border-[#E0E3E7] dark:border-[#303134] shrink-0">
                    {s.date}
                  </span>
                  <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                    {language === 'ar' ? s.title_ar : s.title_en}
                  </span>
                </div>

                {/* Center: Progress Bar Centered */}
                <div className="flex-1 h-2 bg-[#E0E3E7] dark:bg-[#383A3C] rounded-full overflow-hidden flex items-center">
                  <div
                    className="bg-[#0B57D0] h-full rounded-full transition-all duration-300"
                    style={{ width: `${s.rate}%` }}
                  />
                </div>

                {/* Right: Rate Percentage */}
                <div className="w-14 text-end font-mono tabular-nums font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] shrink-0 text-xs">
                  {s.rate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Excuses Analysis & Pastoral Follow-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Excuse Distribution Card */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 border border-[#E0E3E7] dark:border-[#303134] space-y-3 shadow-none">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
            <HelpCircle className="w-4 h-4 text-[#B06000]" strokeWidth={2} />
            <div>
              <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-xs">
                {language === 'ar' ? 'تحليل أسباب الاعتذار' : 'Excuse Reasons Distribution'}
              </h3>
              <p className="text-[11px] text-[#747775]">
                {language === 'ar' ? 'تصنيف الأعذار المدخلة' : 'Breakdown of recorded reasons'}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {data.excuseBreakdown.map((exc, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs p-2 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C]">
                <div className="w-28 sm:w-32 shrink-0 font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                  {language === 'ar' ? exc.category_ar : exc.category_en}
                </div>
                <div className="flex-1 h-2 bg-[#E0E3E7] dark:bg-[#383A3C] rounded-full overflow-hidden flex items-center">
                  <div className="bg-[#B06000] h-full rounded-full" style={{ width: `${exc.percentage}%` }} />
                </div>
                <div className="w-16 text-end font-mono tabular-nums text-[11px] text-[#444746] dark:text-[#C4C7C5] shrink-0">
                  {exc.percentage}% ({exc.count})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Honor Roll (100% Attendance) */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 border border-[#E0E3E7] dark:border-[#303134] space-y-3 shadow-none">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
            <Award className="w-4 h-4 text-[#146C2E]" strokeWidth={2} />
            <div>
              <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-xs">
                {language === 'ar' ? 'شرف الالتزام (100%)' : 'Honor Roll (100% Attendance)'}
              </h3>
              <p className="text-[11px] text-[#747775]">
                {language === 'ar' ? 'كشافين بدون أي غياب' : 'Scouts with perfect attendance'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
            {data.honorRoll.map((scout) => (
              <div key={scout.id} className="p-2.5 rounded-xl bg-[#F0F4F9] dark:bg-[#282A2C] flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? scout.name_ar : scout.name_en}
                  </div>
                  <div className="text-[10px] text-[#747775]">
                    {language === 'ar' ? scout.patrol_name_ar : scout.patrol_name_en}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full font-mono tabular-nums text-xs font-medium bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#0A5326] dark:text-emerald-300">
                  100%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pastoral Care & Follow-Up */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-5 border border-[#E0E3E7] dark:border-[#303134] space-y-3 shadow-none">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
            <AlertTriangle className="w-4 h-4 text-[#B3261E]" strokeWidth={2} />
            <div>
              <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-xs">
                {language === 'ar' ? 'متابعة وافتقاد رعوي' : 'Pastoral Care & Follow-Up'}
              </h3>
              <p className="text-[11px] text-[#747775]">
                {language === 'ar' ? 'غياب متكرر بدون عذر' : 'Consecutive unexcused absences'}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {data.needsFollowUp.map((scout) => (
              <div key={scout.id} className="p-2.5 rounded-xl bg-[#F9DEDC]/50 dark:bg-rose-950/20 border border-[#F9DEDC] dark:border-rose-900/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {language === 'ar' ? scout.name_ar : scout.name_en}
                  </div>
                  <div className="text-[10px] text-[#B3261E] font-mono tabular-nums">
                    {language === 'ar' ? `غياب ${scout.consecutiveAbsences} متتالي` : `${scout.consecutiveAbsences} consecutive`}
                  </div>
                </div>
                {scout.father_phone && (
                  <a
                    href={`tel:${scout.father_phone}`}
                    className="px-2.5 py-1 rounded-full bg-[#F9DEDC] dark:bg-rose-950/60 text-[#8C1D18] dark:text-rose-200 transition-colors flex items-center gap-1 text-[11px] font-medium"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{language === 'ar' ? 'اتصال' : 'Call'}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Scout Attendance Table & Sort/Filter Controls */}
      <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E3E7] dark:border-[#303134] overflow-hidden space-y-4 p-5 shadow-none">
        {/* Table Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0F4F9] dark:border-[#2D2F31] pb-4">
          <div className="space-y-0.5">
            <h3 className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-base">
              {language === 'ar' ? 'سجل الحضور التفصيلي لكشافي الوحدة' : 'Individual Scout Attendance & Details'}
            </h3>
            <p className="text-xs text-[#747775]">
              {language === 'ar'
                ? 'نسب الحضور، عدد الجلسات، الأعذار، وسجل الالتزام لكل كشاف مع إمكانية الفرز والبحث الفوري'
                : 'Scout attendance percentages, session counts, excuses, and consistency records with instant sorting and filtering'}
            </p>
          </div>

          <div>
            <span className="text-xs font-mono tabular-nums font-medium text-[#001D35] dark:text-[#C2E7FF] bg-[#C2E7FF] dark:bg-[#004A77] px-3 py-1 rounded-full">
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
            <Search className="w-4 h-4 text-[#747775] absolute start-3 top-2.5" strokeWidth={2} />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث بالاسم أو كود الكشاف...' : 'Search by scout name or code...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] rounded-full ps-9 pe-3 py-2 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] focus:ring-1 focus:ring-[#0B57D0] focus:outline-none"
            />
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Patrol Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] rounded-full px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#747775]" strokeWidth={2} />
              <select
                value={patrolFilter}
                onChange={(e) => setPatrolFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none cursor-pointer border-none p-0 pe-4"
              >
                <option value="all" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'جميع الطلائع' : 'All Patrols'}</option>
                {data.patrolsStats.map((p) => (
                  <option key={p.patrolId} value={p.patrolId} className="dark:bg-[#1E1F20]">
                    {language === 'ar' ? p.name_ar : p.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Criteria Selector */}
            <div className="flex items-center gap-1.5 bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] rounded-full px-3 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#747775]" strokeWidth={2} />
              <span className="text-[11px] text-[#747775]">{language === 'ar' ? 'الفرز:' : 'Sort:'}</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none cursor-pointer border-none p-0 pe-4"
              >
                <option value="percentage" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}</option>
                <option value="name" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'الاسم' : 'Scout Name'}</option>
                <option value="id" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'كود الكشاف' : 'Member Code'}</option>
                <option value="year" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'السنة الدراسية' : 'Academic Year'}</option>
                <option value="patrol" className="dark:bg-[#1E1F20]">{language === 'ar' ? 'الطليعة' : 'Patrol'}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={language === 'ar' ? 'تبديل اتجاه الترتيب' : 'Toggle Sort Direction'}
                className="p-1 hover:bg-[#E0E3E7] dark:hover:bg-[#383A3C] rounded-full transition-colors cursor-pointer text-[#444746] dark:text-[#C4C7C5]"
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
          <span className="text-xs font-medium text-[#747775]">{language === 'ar' ? 'مستوى الالتزام:' : 'Tier:'}</span>
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                tierFilter === tier.key
                  ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-semibold'
                  : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
              }`}
            >
              {language === 'ar' ? tier.label_ar : tier.label_en}
            </button>
          ))}
        </div>

        {/* Scouts Attendance Data Table (Centered Cells, Bars & Numbers) */}
        <div className="overflow-x-auto rounded-2xl border border-[#E0E3E7] dark:border-[#303134]">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#F8FAFD] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] border-b border-[#E0E3E7] dark:border-[#303134] select-none">
              <tr>
                {/* 1. Code Column (Centered) */}
                <th
                  onClick={() => handleSortToggle('id')}
                  className="px-3 py-3 text-center align-middle font-medium cursor-pointer hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors w-28"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{language === 'ar' ? 'كود الكشاف' : 'Code'}</span>
                    {sortKey === 'id' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#747775]" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                {/* 2. Name Column (Start Aligned) */}
                <th
                  onClick={() => handleSortToggle('name')}
                  className="px-4 py-3 text-start align-middle font-medium cursor-pointer hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors min-w-[180px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'الاسم' : 'Name'}</span>
                    {sortKey === 'name' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#747775]" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                {/* 3. Year Column (Centered) */}
                <th
                  onClick={() => handleSortToggle('year')}
                  className="px-3 py-3 text-center align-middle font-medium cursor-pointer hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors w-28"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{language === 'ar' ? 'السنة' : 'Year'}</span>
                    {sortKey === 'year' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#747775]" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                {/* 4. Patrol Column (Centered) */}
                <th
                  onClick={() => handleSortToggle('patrol')}
                  className="px-3 py-3 text-center align-middle font-medium cursor-pointer hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors w-32"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{language === 'ar' ? 'الطليعة' : 'Patrol'}</span>
                    {sortKey === 'patrol' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#747775]" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                {/* 5. Breakdown Column (Centered) */}
                <th className="px-3 py-3 text-center align-middle font-medium w-40">
                  <span>{language === 'ar' ? 'تفصيل الحضور' : 'Breakdown'}</span>
                </th>

                {/* 6. Rate & Progress Bar Column (Centered) */}
                <th
                  onClick={() => handleSortToggle('percentage')}
                  className="px-4 py-3 text-center align-middle font-medium cursor-pointer hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors w-44"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{language === 'ar' ? 'نسبة الحضور والالتزام' : 'Attendance Rate'}</span>
                    {sortKey === 'percentage' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} /> : <ArrowDown className="w-3.5 h-3.5 text-[#0B57D0]" strokeWidth={2} />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-[#747775]" strokeWidth={1.5} />
                    )}
                  </div>
                </th>

                {/* 7. Status Column (Centered) */}
                <th className="px-3 py-3 text-center align-middle font-medium w-36">
                  <span>{language === 'ar' ? 'الحالة' : 'Status'}</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F0F4F9] dark:divide-[#282A2C] font-medium">
              {sortedAndFilteredScouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#747775] text-xs font-mono">
                    <p>{language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No scouts match the criteria'}</p>
                    <button
                      onClick={() => { setSearchQuery(''); setPatrolFilter('all'); setTierFilter('all'); }}
                      className="mt-1.5 text-xs text-[#0B57D0] hover:underline cursor-pointer font-medium"
                    >
                      {language === 'ar' ? 'إعادة ضبط التصفية' : 'Reset filters'}
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredScouts.map((scout) => (
                  <tr key={scout.id} className="hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C]/60 transition-colors h-14">
                    {/* 1. Member Code (Centered) */}
                    <td className="px-3 py-2.5 text-center align-middle font-mono text-xs whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <span className="bg-[#F0F4F9] dark:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] px-2 py-0.5 rounded-md border border-[#E0E3E7] dark:border-[#303134]">
                          {scout.member_code}
                        </span>
                      </div>
                    </td>

                    {/* 2. Scout Name (Start Aligned + Centered Vertically) */}
                    <td className="px-4 py-2.5 text-start align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E9EEF6] dark:bg-[#303134] text-[#001D35] dark:text-[#C2E7FF] flex items-center justify-center text-xs font-medium shrink-0">
                          {scout.name_ar?.charAt(0) || 'ك'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-xs truncate">
                            {language === 'ar' ? scout.name_ar : scout.name_en}
                          </div>
                          <div className="text-[10px] text-[#747775] truncate">
                            {language === 'ar' ? scout.name_en : scout.name_ar}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 3. Academic Year (Centered) */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-[#444746] dark:text-[#C4C7C5] text-xs">
                        <GraduationCap className="w-3.5 h-3.5 text-[#747775]" strokeWidth={1.75} />
                        <span>{scout.academic_year}</span>
                      </div>
                    </td>

                    {/* 4. Patrol / Six (Centered) */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <span className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] bg-[#F0F4F9] dark:bg-[#282A2C] px-2.5 py-0.5 rounded-full">
                          {language === 'ar' ? scout.patrol_name_ar : scout.patrol_name_en}
                        </span>
                      </div>
                    </td>

                    {/* 5. Sessions Breakdown (Centered) */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-[11px] font-mono tabular-nums font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-[#D1F2D9] text-[#0A5326] dark:bg-emerald-950/40 dark:text-emerald-300">
                          {scout.presentSessions}P
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#FFE2B3] text-[#7A3F00] dark:bg-amber-950/40 dark:text-amber-300">
                          {scout.excusedSessions}E
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#F9DEDC] text-[#8C1D18] dark:bg-rose-950/40 dark:text-rose-300">
                          {scout.absentSessions}A
                        </span>
                        {scout.lateSessions > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#D3E3FD] text-[#043372] dark:bg-sky-950/40 dark:text-sky-300">
                            +{scout.lateSessions}L
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 6. Percentage & Progress Bar (Centered Horizontally & Vertically) */}
                    <td className="px-4 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="w-36 mx-auto space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                          <span className={`font-semibold ${
                            scout.attendanceRate === 100
                              ? 'text-[#146C2E] dark:text-emerald-400'
                              : scout.attendanceRate >= 90
                              ? 'text-[#1F1F1F] dark:text-[#E3E3E3]'
                              : scout.attendanceRate >= 75
                              ? 'text-[#747775]'
                              : 'text-[#B3261E] dark:text-rose-400'
                          }`}>
                            {scout.attendanceRate}%
                          </span>
                          <span className="text-[10px] text-[#747775]">
                            {scout.presentSessions + scout.lateSessions}/{scout.totalSessions}
                          </span>
                        </div>
                        <div className="w-full bg-[#F0F4F9] dark:bg-[#282A2C] h-2 rounded-full overflow-hidden flex items-center">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              scout.attendanceRate === 100
                                ? 'bg-[#146C2E]'
                                : scout.attendanceRate >= 90
                                ? 'bg-[#0B57D0]'
                                : scout.attendanceRate >= 75
                                ? 'bg-[#B06000]'
                                : 'bg-[#B3261E]'
                            }`}
                            style={{ width: `${scout.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 7. Status & Action (Centered) */}
                    <td className="px-3 py-2.5 text-center align-middle whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {scout.status === 'perfect' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D1F2D9] text-[#0A5326] dark:bg-emerald-950/40 dark:text-emerald-300 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'التزام كامل' : '100%'}</span>
                          </span>
                        ) : scout.status === 'needs_followup' ? (
                          <div className="flex items-center justify-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F9DEDC] text-[#8C1D18] dark:bg-rose-950/40 dark:text-rose-300 text-[11px] font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? `غياب ${scout.consecutiveAbsences}` : `${scout.consecutiveAbsences} abs`}</span>
                            </span>
                            {scout.father_phone && (
                              <a
                                href={`tel:${scout.father_phone}`}
                                title={language === 'ar' ? 'اتصال بولي الأمر' : 'Call Guardian'}
                                className="p-1 rounded-full hover:bg-[#F9DEDC] text-[#8C1D18] transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : scout.status === 'regular' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] text-[11px] font-medium">
                            <span>{language === 'ar' ? 'حضور منتظم' : 'Regular'}</span>
                          </span>
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
