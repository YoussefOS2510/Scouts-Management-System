'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_UNITS } from '../lib/data';
import {
  Folder,
  LayoutGrid,
  List,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  Package,
  Users,
  HardDrive,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
  Filter,
  Sparkles,
  Info,
  Clock,
  Download,
  Eye,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react';

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, accessibleUnits, can } = useAuth();
  const router = useRouter();

  const canTakeAttendance = isSuperAdmin || can('attendance.take');
  const canViewAnalytics = isSuperAdmin || can('admin.analytics') || can('attendance.analytics');
  const canViewMembers = isSuperAdmin || can('members.view') || can('members.create_edit');
  const canUploadMedia = isSuperAdmin || can('media.upload');

  const handleUnitClick = (unitId: number) => {
    if (canTakeAttendance) {
      router.push(`/attendance?unit=${unitId}`);
    } else if (canUploadMedia) {
      router.push(`/media`);
    } else if (canViewMembers) {
      router.push(`/members`);
    }
  };

  // View toggle: 'grid' (Drive Folder Tiles) vs 'list' (Drive Table Rows)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter chips state
  const [filterUnitId, setFilterUnitId] = useState<number | 'all'>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');

  // Selected folder for context menu
  const [activeMenuUnitId, setActiveMenuUnitId] = useState<number | null>(null);

  // Live Database stats
  const [stats, setStats] = useState<{
    totalMembers: number;
    totalUsers: number;
    totalRegistered: number;
    totalEquipment: number;
    totalSessions: number;
    totalUnits: number;
    unitMemberCounts: Record<number, number>;
  }>({
    totalMembers: 0,
    totalUsers: 0,
    totalRegistered: 0,
    totalEquipment: 0,
    totalSessions: 0,
    totalUnits: 12,
    unitMemberCounts: {},
  });

  React.useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch((err) => console.error('Failed to fetch dashboard stats:', err));
  }, []);

  const totalMembers = stats.totalMembers;
  const totalUsers = stats.totalUsers;
  const totalRegistered = stats.totalRegistered || (stats.totalMembers + stats.totalUsers);
  const totalEquipment = stats.totalEquipment;
  const totalUnits = stats.totalUnits || 12;
  const unitMemberCounts = stats.unitMemberCounts || {};

  // M3 Section color tokens for Google Drive Folder Icons
  const getStageColor = (code: string) => {
    if (code.startsWith('cubs') || code.startsWith('brownies') || code.includes('ashbal') || code.includes('zahrat')) {
      return {
        color: '#B06000', // Cubs / Brownies Warm Amber
        badgeBg: 'bg-[#FEF7EC] dark:bg-amber-950/40 text-[#7A3F00] dark:text-amber-300 border-[#FFCD85]/50',
        stageName: language === 'ar' ? (code.includes('ashbal') || code.startsWith('cubs') ? 'أشبال' : 'زهرات') : (code.includes('ashbal') || code.startsWith('cubs') ? 'Cubs' : 'Brownies'),
      };
    }
    if (code.startsWith('scouts') || code.startsWith('guides') || code.includes('kashafa') || code.includes('morshdat')) {
      return {
        color: '#146C2E', // Scouts / Guides Forest Green
        badgeBg: 'bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#0A5326] dark:text-emerald-300 border-[#A8E5B6]/50',
        stageName: language === 'ar' ? (code.includes('kashafa') || code.startsWith('scouts') ? 'كشافة' : 'مرشدات') : (code.includes('kashafa') || code.startsWith('scouts') ? 'Scouts' : 'Guides'),
      };
    }
    if (code.includes('motakadem') || code.includes('ra2edat') || code.includes('gawala') || code.includes('advanced') || code.includes('senior') || code.includes('rovers')) {
      return {
        color: '#0B57D0', // Venturers / Rovers Deep Ocean Blue
        badgeBg: 'bg-[#D3E3FD] dark:bg-sky-950/40 text-[#043372] dark:text-sky-300 border-[#A8C7FA]/50',
        stageName: language === 'ar' ? (code.includes('gawala') || code.includes('rovers') ? 'جوالة' : (code.includes('ra2edat') || code.includes('senior') ? 'رائدات' : 'متقدم')) : 'Rovers',
      };
    }
    return {
      color: '#444746', // Leaders Slate
      badgeBg: 'bg-[#F0F4F9] dark:bg-stone-800 text-[#1F1F1F] dark:text-stone-300 border-[#E0E3E7]',
      stageName: language === 'ar' ? 'قادة' : 'Leaders',
    };
  };

  // Units list scoped to role and interactive filters
  const displayUnits = useMemo(() => {
    const base = isSuperAdmin ? INITIAL_UNITS : accessibleUnits;
    return base.filter((unit) => {
      // 1. Direct unit filter
      if (filterUnitId !== 'all' && unit.id !== filterUnitId) {
        return false;
      }

      // 2. Stage filter
      if (filterStage === 'cubs') {
        const isCubs =
          unit.stage_group === 'cubs' ||
          unit.stage_group === 'brownies' ||
          unit.code.startsWith('cubs') ||
          unit.code.startsWith('brownies') ||
          unit.code.includes('ashbal') ||
          unit.code.includes('zahrat');
        if (!isCubs) return false;
      }
      if (filterStage === 'scouts') {
        const isScouts =
          unit.stage_group === 'scouts' ||
          unit.stage_group === 'guides' ||
          unit.code.startsWith('scouts') ||
          unit.code.startsWith('guides') ||
          unit.code.includes('kashafa') ||
          unit.code.includes('morshdat');
        if (!isScouts) return false;
      }
      if (filterStage === 'rovers') {
        const isRovers =
          unit.stage_group === 'advanced_scouts' ||
          unit.stage_group === 'senior_guides' ||
          unit.stage_group === 'rovers' ||
          unit.code.includes('advanced') ||
          unit.code.includes('senior') ||
          unit.code.includes('rovers') ||
          unit.code.includes('motakadem') ||
          unit.code.includes('ra2edat') ||
          unit.code.includes('gawala');
        if (!isRovers) return false;
      }
      if (filterStage === 'parallel' && !unit.code.includes('_a') && !unit.code.includes('_b')) return false;

      // 3. Gender filter
      if (filterGender !== 'all' && unit.gender !== filterGender) return false;

      return true;
    });
  }, [isSuperAdmin, accessibleUnits, filterUnitId, filterStage, filterGender]);

  // Only leaders with more than 1 assigned team can filter
  const hasMultipleTeams = accessibleUnits.length > 1;

  // Filtered youth scouts count (strictly members, excluding adult leaders)
  const filteredScoutsCount = useMemo(() => {
    return displayUnits.reduce((acc, unit) => {
      if (unit.is_leadership) return acc;
      return acc + (unitMemberCounts[unit.id] ?? 0);
    }, 0);
  }, [displayUnits, unitMemberCounts]);

  const filteredUnitsCount = displayUnits.length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. DRIVE LOCATION PATH & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/60">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-sky-500 transition-colors font-bold">
            SMSR
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
          <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
            {language === 'ar' ? 'دليل الوحدات الكشفية' : 'Unit Directory'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400 font-mono ms-1 border border-neutral-200/80 dark:border-neutral-800/80">
            {displayUnits.length}
          </span>
        </div>

        {/* View Mode & Sorting Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
              title={language === 'ar' ? 'عرض شبكي' : 'Grid View'}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'شبكة' : 'Grid'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
              title={language === 'ar' ? 'عرض جدول' : 'List View'}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'قائمة' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RESTRAINED FILTER CHIPS (Shown only for leaders with more than 1 assigned team) */}
      {hasMultipleTeams && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-400 shrink-0 me-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تصفية الفرق:' : 'Filter Teams:'}</span>
          </span>

          {accessibleUnits.length <= 8 ? (
            <>
              {/* All Assigned Teams */}
              <button
                onClick={() => setFilterUnitId('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? `كل الفرق (${accessibleUnits.length})` : `All Teams (${accessibleUnits.length})`}
              </button>

              {/* Individual Assigned Team Chips */}
              {accessibleUnits.map((unit) => {
                const stageStyle = getStageColor(unit.code);
                const isSelected = filterUnitId === unit.id;
                const count = unitMemberCounts[unit.id] ?? 0;

                return (
                  <button
                    key={unit.id}
                    onClick={() => setFilterUnitId(isSelected ? 'all' : unit.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                        : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: stageStyle.color }}
                    />
                    <span>{language === 'ar' ? unit.name_ar : unit.name_en}</span>
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </button>
                );
              })}
            </>
          ) : (
            /* Super Admin / Group Leader with all 12 units */
            <>
              {/* All */}
              <button
                onClick={() => {
                  setFilterStage('all');
                  setFilterGender('all');
                  setFilterUnitId('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterStage === 'all' && filterGender === 'all' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterGender(filterGender === 'boys' ? 'all' : 'boys');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterGender === 'boys' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'بنين (Boys)' : 'Boys'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterGender(filterGender === 'girls' ? 'all' : 'girls');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterGender === 'girls' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'بنات (Girls)' : 'Girls'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterStage(filterStage === 'cubs' ? 'all' : 'cubs');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterStage === 'cubs' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'أشبال وزهرات' : 'Cubs & Brownies'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterStage(filterStage === 'scouts' ? 'all' : 'scouts');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterStage === 'scouts' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'كشافة ومرشدات' : 'Scouts & Guides'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterStage(filterStage === 'rovers' ? 'all' : 'rovers');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterStage === 'rovers' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'متقدم وجوالة' : 'Venturers & Rovers'}
              </button>

              <button
                onClick={() => {
                  setFilterUnitId('all');
                  setFilterStage(filterStage === 'parallel' ? 'all' : 'parallel');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  filterStage === 'parallel' && filterUnitId === 'all'
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-semibold border border-sky-500/30 shadow-2xs'
                    : 'bg-neutral-100 dark:bg-[#111827] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-200/60 dark:hover:bg-[#1E293B]'
                }`}
              >
                {language === 'ar' ? 'مسار متوازي (A / B)' : 'Parallel Streams'}
              </button>

              {/* Specific Team Selector for Super Admin */}
              <div className="ms-auto flex items-center shrink-0">
                <select
                  value={filterUnitId}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setFilterUnitId(val);
                    if (val !== 'all') {
                      setFilterStage('all');
                      setFilterGender('all');
                    }
                  }}
                  className="bg-neutral-100 dark:bg-[#111827] text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-lg px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="all">{language === 'ar' ? 'كل الفرق الـ 12' : 'All 12 Teams'}</option>
                  {accessibleUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {language === 'ar' ? u.name_ar : u.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Units */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-colors">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {filteredUnitsCount}
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 truncate">
            {language === 'ar' ? 'وحدة كشفية نشطة' : 'Active Scout Units'}
          </div>
        </div>

        {/* Metric 2: Registered Scouts */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-colors">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {filteredScoutsCount}
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 truncate">
            {language === 'ar' ? 'كشاف مسجل' : 'Registered Scouts'}
          </div>
        </div>

        {/* Metric 3: Equipment Items */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-colors">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            {totalEquipment}
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 truncate">
            {language === 'ar' ? 'قطعة عهدة ومهمات' : 'Equipment & Gear'}
          </div>
        </div>

        {/* Metric 4: Cloud Storage */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 shadow-none hover:border-neutral-300 dark:hover:border-neutral-700/80 transition-colors">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100 font-mono tabular-nums">
            15 GB
          </div>
          <div className="text-[11px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 sm:mt-1 truncate">
            {language === 'ar' ? 'تخزين سحابي مستخدم' : 'Drive Storage'}
          </div>
        </div>
      </div>

      {/* 4. SUGGESTED WORKSPACE FILES (Restrained modern SaaS cards) */}
      <div className="space-y-2.5">
        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
          <span>{language === 'ar' ? 'الإجراءات والسجلات السريعة' : 'Quick Access & Common Actions'}</span>
          <span className="text-[11px] text-neutral-400 font-mono">{language === 'ar' ? 'اليوم' : 'Today'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/attendance?unit=5"
            className="p-3 bg-white dark:bg-[#111827] hover:bg-neutral-50 dark:hover:bg-[#161F30] rounded-xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-500 transition-colors">
                {language === 'ar' ? 'كشف حضور كشافة A' : 'Attendance: Scouts A'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {language === 'ar' ? 'جاهز للرصد الأسبوعي' : 'Weekly Roster Ready'}
              </div>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="p-3 bg-white dark:bg-[#111827] hover:bg-neutral-50 dark:hover:bg-[#161F30] rounded-xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-500 transition-colors">
                {language === 'ar' ? 'حجز مهمات ومستودع' : 'Camp Gear Booking'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {language === 'ar' ? 'مستودع الفوج • متاح' : 'Troop Depot Available'}
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-3 bg-white dark:bg-[#111827] hover:bg-neutral-50 dark:hover:bg-[#161F30] rounded-xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-500 transition-colors">
                {language === 'ar' ? 'تحليلات الحضور الفصلية' : 'Attendance Analytics'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {language === 'ar' ? 'معدل الالتزام 91.4%' : '91.4% Overall Rate'}
              </div>
            </div>
          </Link>

          <Link
            href="/media"
            className="p-3 bg-white dark:bg-[#111827] hover:bg-neutral-50 dark:hover:bg-[#161F30] rounded-xl border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-500 transition-colors">
                {language === 'ar' ? 'الأرشيف السحابي درايف' : 'Drive Media Root'}
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {language === 'ar' ? 'المجلد الكشفي السحابي' : 'Cloud Sync Active'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. UNITS DIRECTORY (Entire card clickable with smooth hover elevate effect) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Folder className="w-4 h-4 text-sky-500" />
            <span>{language === 'ar' ? 'الوحدات الكشفية والمراحل' : 'Scout Unit Directory'}</span>
            <span className="text-xs text-neutral-400 font-normal">({displayUnits.length})</span>
          </div>
        </div>

        {/* View 1: Clickable Unit Cards with Consolidated Typography (Grid View) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayUnits.map((unit) => {
              const stageStyle = getStageColor(unit.code);
              const isParallel = unit.code.includes('_a') || unit.code.includes('_b');

              return (
                <div
                  key={unit.id}
                  onClick={() => handleUnitClick(unit.id)}
                  className="group relative bg-white dark:bg-[#111827] hover:dark:bg-[#161F30] border border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700/80 rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer flex items-center justify-between gap-3 select-none"
                >
                  {/* Leading Icon & Consolidated Typography without micro-badge clutter */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Folder
                        className="w-5 h-5 shrink-0"
                        style={{ color: stageStyle.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-sky-500 transition-colors" dir="auto">
                        <bdi>{language === 'ar' ? unit.name_ar : unit.name_en}</bdi>
                      </div>
                      {/* Clean structured typography instead of micro-badges */}
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5 flex items-center gap-1.5 font-normal" dir="auto">
                        <bdi>{unit.target_grade}</bdi>
                        <span>&bull;</span>
                        <bdi>{unit.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : (language === 'ar' ? 'بنات' : 'Girls')}</bdi>
                        {isParallel && (
                          <>
                            <span>&bull;</span>
                            <bdi className="font-mono text-neutral-400">
                              {unit.code.includes('_a') ? (language === 'ar' ? 'مسار A' : 'Track A') : (language === 'ar' ? 'مسار B' : 'Track B')}
                            </bdi>
                          </>
                        )}
                        <span>&bull;</span>
                        <bdi className="font-mono text-neutral-600 dark:text-neutral-300">
                          {unitMemberCounts[unit.id] ?? 0} {language === 'ar' ? 'عضو' : 'members'}
                        </bdi>
                      </div>
                    </div>
                  </div>

                  {/* Context Menu Button (⋮) with e.stopPropagation */}
                  {(canTakeAttendance || canViewAnalytics || canViewMembers || canUploadMedia) && (
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuUnitId(activeMenuUnitId === unit.id ? null : unit.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                        title={language === 'ar' ? 'خيارات إضافية' : 'Options'}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Context Menu Dropdown */}
                      {activeMenuUnitId === unit.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute end-0 top-8 w-48 bg-white dark:bg-[#111827] rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800/90 py-1.5 z-50 animate-fadeIn"
                        >
                          {canTakeAttendance && (
                            <Link
                              href={`/attendance?unit=${unit.id}`}
                              onClick={() => setActiveMenuUnitId(null)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                            >
                              <CalendarCheck className="w-4 h-4 text-emerald-500" />
                              <span>{language === 'ar' ? 'تسجيل الحضور' : 'Take Attendance'}</span>
                            </Link>
                          )}
                          {canViewAnalytics && (
                            <Link
                              href="/admin/analytics"
                              onClick={() => setActiveMenuUnitId(null)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                            >
                              <FileSpreadsheet className="w-4 h-4 text-sky-500" />
                              <span>{language === 'ar' ? 'تحليلات الوحدة' : 'Unit Analytics'}</span>
                            </Link>
                          )}
                          {canViewMembers && (
                            <Link
                              href="/members"
                              onClick={() => setActiveMenuUnitId(null)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                            >
                              <Users className="w-4 h-4 text-amber-500" />
                              <span>{language === 'ar' ? 'دليل الأعضاء' : 'Unit Members'}</span>
                            </Link>
                          )}
                          {canUploadMedia && (
                            <Link
                              href="/media"
                              onClick={() => setActiveMenuUnitId(null)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#1E293B]"
                            >
                              <UploadCloud className="w-4 h-4 text-purple-500" />
                              <span>{language === 'ar' ? 'وسائط الوحدة' : 'Media Archive'}</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: Table Rows (List View) */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-[#111827] rounded-xl border border-neutral-200 dark:border-neutral-800/80 overflow-x-auto shadow-none">
            <div className="min-w-[540px]">
              {/* Table Header */}
              <div className="h-10 px-4 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-[#161F30] flex items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <div className="w-1/3 min-w-[180px]">{language === 'ar' ? 'اسم الوحدة الكشفية' : 'Unit Name'}</div>
                <div className="w-1/4 hidden sm:block">{language === 'ar' ? 'المرحلة والنوع' : 'Stage & Gender'}</div>
                <div className="w-1/4 hidden md:block">{language === 'ar' ? 'الصف الدراسي' : 'Target Grade'}</div>
                <div className="w-20 text-center">{language === 'ar' ? 'الأعضاء' : 'Members'}</div>
                <div className="w-20 text-center">{language === 'ar' ? 'المسار' : 'Stream'}</div>
                <div className="ms-auto text-end">{language === 'ar' ? 'الإجراء' : 'Action'}</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/60">
              {displayUnits.map((unit) => {
                const stageStyle = getStageColor(unit.code);
                const isParallel = unit.code.includes('_a') || unit.code.includes('_b');

                return (
                  <div
                    key={unit.id}
                    onClick={() => handleUnitClick(unit.id)}
                    className="h-12 px-4 hover:bg-neutral-50/80 dark:hover:bg-[#1E293B]/40 flex items-center text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 transition-colors cursor-pointer"
                  >
                    <div className="w-1/3 min-w-[180px] flex items-center gap-3">
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: stageStyle.color }}
                      />
                      <span className="font-semibold hover:text-sky-500 truncate" dir="auto">
                        <bdi>{language === 'ar' ? unit.name_ar : unit.name_en}</bdi>
                      </span>
                    </div>

                    <div className="w-1/4 hidden sm:flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300" dir="auto">
                        {stageStyle.stageName}
                      </span>
                      <span className="text-neutral-400">&bull;</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {unit.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : (language === 'ar' ? 'بنات' : 'Girls')}
                      </span>
                    </div>

                    <div className="w-1/4 hidden md:block text-xs text-neutral-500 dark:text-neutral-400" dir="auto">
                      <bdi>{unit.target_grade}</bdi>
                    </div>

                    <div className="w-20 text-center">
                      <span className="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
                        {unitMemberCounts[unit.id] ?? 0}
                      </span>
                    </div>

                    <div className="w-20 text-center">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-800/60">
                        {isParallel ? (unit.code.includes('_a') ? 'A' : 'B') : '-'}
                      </span>
                    </div>

                    <div className="ms-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {canTakeAttendance ? (
                        <Link
                          href={`/attendance?unit=${unit.id}`}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-200/80 dark:border-neutral-700/50"
                        >
                          {language === 'ar' ? 'كشف الحضور' : 'Roster'}
                        </Link>
                      ) : canUploadMedia ? (
                        <Link
                          href="/media"
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-200/80 dark:border-neutral-700/50"
                        >
                          {language === 'ar' ? 'الوسائط' : 'Media'}
                        </Link>
                      ) : canViewMembers ? (
                        <Link
                          href="/members"
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-200/80 dark:border-neutral-700/50"
                        >
                          {language === 'ar' ? 'الأعضاء' : 'Members'}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
