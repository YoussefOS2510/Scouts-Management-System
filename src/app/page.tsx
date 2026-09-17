'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_MEMBERS, INITIAL_EQUIPMENT } from '../lib/data';
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
} from 'lucide-react';

export default function DashboardPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, accessibleUnits } = useAuth();

  // View toggle: 'grid' (Drive Folder Tiles) vs 'list' (Drive Table Rows)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter chips state
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');

  // Selected folder for context menu
  const [activeMenuUnitId, setActiveMenuUnitId] = useState<number | null>(null);

  const totalMembers = INITIAL_MEMBERS.length;
  const totalEquipment = INITIAL_EQUIPMENT.reduce((acc, curr) => acc + curr.total_quantity, 0);

  // M3 Section color tokens for Google Drive Folder Icons
  const getStageColor = (code: string) => {
    if (code.includes('ashbal') || code.includes('zahrat')) {
      return {
        color: '#B06000', // Cubs / Brownies Warm Amber
        badgeBg: 'bg-[#FEF7EC] dark:bg-amber-950/40 text-[#7A3F00] dark:text-amber-300 border-[#FFCD85]/50',
        stageName: language === 'ar' ? (code.includes('ashbal') ? 'أشبال' : 'زهرات') : (code.includes('ashbal') ? 'Cubs' : 'Brownies'),
      };
    }
    if (code.includes('kashafa') || code.includes('morshdat')) {
      return {
        color: '#146C2E', // Scouts / Guides Forest Green
        badgeBg: 'bg-[#E8F0EC] dark:bg-emerald-950/40 text-[#0A5326] dark:text-emerald-300 border-[#A8E5B6]/50',
        stageName: language === 'ar' ? (code.includes('kashafa') ? 'كشافة' : 'مرشدات') : (code.includes('kashafa') ? 'Scouts' : 'Guides'),
      };
    }
    if (code.includes('motakadem') || code.includes('ra2edat') || code.includes('gawala')) {
      return {
        color: '#0B57D0', // Venturers / Rovers Deep Ocean Blue
        badgeBg: 'bg-[#D3E3FD] dark:bg-sky-950/40 text-[#043372] dark:text-sky-300 border-[#A8C7FA]/50',
        stageName: language === 'ar' ? (code.includes('gawala') ? 'جوالة' : code.includes('ra2edat') ? 'رائدات' : 'متقدم') : 'Rovers',
      };
    }
    return {
      color: '#444746', // Leaders Slate
      badgeBg: 'bg-[#F0F4F9] dark:bg-stone-800 text-[#1F1F1F] dark:text-stone-300 border-[#E0E3E7]',
      stageName: language === 'ar' ? 'قادة' : 'Leaders',
    };
  };

  // Units list scoped to role
  const displayUnits = useMemo(() => {
    const base = isSuperAdmin ? INITIAL_UNITS : accessibleUnits;
    return base.filter((unit) => {
      // Stage filter
      if (filterStage === 'cubs' && !unit.code.includes('ashbal') && !unit.code.includes('zahrat')) return false;
      if (filterStage === 'scouts' && !unit.code.includes('kashafa') && !unit.code.includes('morshdat')) return false;
      if (filterStage === 'rovers' && !unit.code.includes('motakadem') && !unit.code.includes('ra2edat') && !unit.code.includes('gawala')) return false;
      if (filterStage === 'parallel' && !unit.code.includes('_a') && !unit.code.includes('_b')) return false;

      // Gender filter
      if (filterGender !== 'all' && unit.gender !== filterGender) return false;

      return true;
    });
  }, [isSuperAdmin, accessibleUnits, filterStage, filterGender]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. DRIVE LOCATION PATH & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-sm text-[#444746] dark:text-[#C4C7C5]">
          <Link href="/" className="hover:text-[#0B57D0] transition-colors">
            {language === 'ar' ? 'منظومة الفوج' : 'Scout Drive'}
          </Link>
          {language === 'ar' ? (
            <ChevronLeft className="w-4 h-4 text-[#747775]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#747775]" />
          )}
          <span className="text-[#1F1F1F] dark:text-[#E3E3E3] font-medium">
            {language === 'ar' ? 'الوحدات الكشفية والمراحل' : 'Unit Directory'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E9EEF6] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] font-mono ms-1">
            {displayUnits.length}
          </span>
        </div>

        {/* View Mode & Sorting Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex rounded-xl p-1 bg-[#F0F4F9] dark:bg-[#282A2C]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
              title={language === 'ar' ? 'عرض شبكي (مجلدات)' : 'Grid View'}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'شبكة' : 'Grid'}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
              title={language === 'ar' ? 'عرض قائمة (جدول)' : 'List View'}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'قائمة' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MATERIAL 3 FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-medium text-[#444746] dark:text-[#8E918F] shrink-0 me-1">
          <Filter className="w-3.5 h-3.5 inline me-1" />
          {language === 'ar' ? 'تصفية:' : 'Filter:'}
        </span>

        {/* All Chips */}
        <button
          onClick={() => { setFilterStage('all'); setFilterGender('all'); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterStage === 'all' && filterGender === 'all'
              ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-semibold shadow-2xs'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'الكل' : 'All'}
        </button>

        <button
          onClick={() => setFilterGender(filterGender === 'boys' ? 'all' : 'boys')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterGender === 'boys'
              ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'بنين (Boys)' : 'Boys'}
        </button>

        <button
          onClick={() => setFilterGender(filterGender === 'girls' ? 'all' : 'girls')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterGender === 'girls'
              ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'بنات (Girls)' : 'Girls'}
        </button>

        <button
          onClick={() => setFilterStage(filterStage === 'parallel' ? 'all' : 'parallel')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterStage === 'parallel'
              ? 'bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'مسار متوازي (A / B)' : 'Parallel Streams'}
        </button>

        <button
          onClick={() => setFilterStage(filterStage === 'cubs' ? 'all' : 'cubs')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterStage === 'cubs'
              ? 'bg-[#FFE2B3] text-[#7A3F00] dark:bg-amber-950 dark:text-amber-200 font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'أشبال وزهرات' : 'Cubs & Brownies'}
        </button>

        <button
          onClick={() => setFilterStage(filterStage === 'scouts' ? 'all' : 'scouts')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterStage === 'scouts'
              ? 'bg-[#D1F2D9] text-[#0A5326] dark:bg-emerald-950 dark:text-emerald-200 font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'كشافة ومرشدات' : 'Scouts & Guides'}
        </button>

        <button
          onClick={() => setFilterStage(filterStage === 'rovers' ? 'all' : 'rovers')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
            filterStage === 'rovers'
              ? 'bg-[#D3E3FD] text-[#043372] dark:bg-sky-950 dark:text-sky-200 font-semibold'
              : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
          }`}
        >
          {language === 'ar' ? 'متقدم وجوالة' : 'Venturers & Rovers'}
        </button>
      </div>

      {/* 3. QUICK METRICS (LOW-PROFILE MATERIAL TILES) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: 12 Units */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none hover:border-[#0B57D0]/40 transition-colors">
          <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
            12
          </div>
          <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mt-1">
            {language === 'ar' ? 'وحدة كشفية نشطة' : 'Active Scout Units'}
          </div>
        </div>

        {/* Metric 2: 1,048 Scouts */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none hover:border-[#0B57D0]/40 transition-colors">
          <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
            1,048
          </div>
          <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mt-1">
            {language === 'ar' ? 'كشاف وقائد بالمنظومة' : 'Total Scouts & Leaders'}
          </div>
        </div>

        {/* Metric 3: 107 Equipment Items */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none hover:border-[#0B57D0]/40 transition-colors">
          <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
            {totalEquipment}
          </div>
          <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mt-1">
            {language === 'ar' ? 'قطعة عهدة ومهمات' : 'Equipment & Gear Items'}
          </div>
        </div>

        {/* Metric 4: 15 GB Staging */}
        <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none hover:border-[#0B57D0]/40 transition-colors">
          <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
            15 GB
          </div>
          <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mt-1">
            {language === 'ar' ? 'تخزين مؤقت (Google Drive)' : 'Google Drive Staging'}
          </div>
        </div>
      </div>

      {/* 4. SUGGESTED WORKSPACE FILES (Google Drive Quick Access) */}
      <div className="space-y-2.5">
        <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] flex items-center justify-between">
          <span>{language === 'ar' ? 'الملفات والسجلات المقترحة' : 'Suggested Roster & Gear Files'}</span>
          <span className="text-[11px] text-[#444746]">{language === 'ar' ? 'آخر تحديث: اليوم' : 'Updated today'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/attendance?unit=5"
            className="p-3 bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] rounded-xl border border-[#E0E3E7] dark:border-[#303134] flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8F0EC] dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 text-[#146C2E]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate group-hover:text-[#0B57D0]">
                {language === 'ar' ? 'كشف حضور كشافة A' : 'Attendance: Scouts A'}
              </div>
              <div className="text-[10px] text-[#444746] truncate">
                {language === 'ar' ? 'اجتماع الجمعة • جاهز للرصد' : 'Friday Meeting • Ready'}
              </div>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="p-3 bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] rounded-xl border border-[#E0E3E7] dark:border-[#303134] flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FEF7EC] dark:bg-amber-950/50 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[#B06000]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate group-hover:text-[#0B57D0]">
                {language === 'ar' ? 'حجز خيام ومهمات المعسكر' : 'Camp Gear Booking'}
              </div>
              <div className="text-[10px] text-[#444746] truncate">
                {language === 'ar' ? 'مستودع الفوج • بدون تعارض' : 'Troop Depot • Verified'}
              </div>
            </div>
          </Link>

          <Link
            href="/admin/analytics"
            className="p-3 bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] rounded-xl border border-[#E0E3E7] dark:border-[#303134] flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#D3E3FD] dark:bg-sky-950/50 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-[#0B57D0]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate group-hover:text-[#0B57D0]">
                {language === 'ar' ? 'تقرير التميز الفصلي' : 'Quarterly Attendance Stats'}
              </div>
              <div className="text-[10px] text-[#444746] truncate">
                {language === 'ar' ? 'نسب الحضور وفرز الأعذار' : '91.4% Overall Rate'}
              </div>
            </div>
          </Link>

          <Link
            href="/media"
            className="p-3 bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] rounded-xl border border-[#E0E3E7] dark:border-[#303134] flex items-center gap-3 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#F3E8FD] dark:bg-purple-950/50 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate group-hover:text-[#0B57D0]">
                {language === 'ar' ? 'أرشيف درايف السحابي' : 'Drive Media Root'}
              </div>
              <div className="text-[10px] text-[#444746] truncate">
                {language === 'ar' ? 'مجلد الفوج الكشفي • نشط' : 'Cloud Sync Connected'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* 5. UNITS DIRECTORY (GOOGLE DRIVE FOLDER TILES OR LIST) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-[#444746] dark:text-[#C4C7C5] flex items-center gap-2">
            <Folder className="w-4 h-4 text-[#0B57D0]" />
            <span>{language === 'ar' ? 'مجلدات الوحدات الكشفية' : 'Scout Unit Folders'}</span>
            <span className="text-xs text-[#747775] font-normal">({displayUnits.length})</span>
          </div>
        </div>

        {/* View 1: Google Drive Folder Tiles (Grid View) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayUnits.map((unit) => {
              const stageStyle = getStageColor(unit.code);
              const isParallel = unit.code.includes('_a') || unit.code.includes('_b');

              return (
                <div
                  key={unit.id}
                  className="relative group h-14 bg-[#F0F4F9] hover:bg-[#E9EEF6] dark:bg-[#282A2C] dark:hover:bg-[#333538] rounded-xl px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer select-none"
                >
                  {/* Leading: Drive Folder Icon colored by section */}
                  <Link
                    href={`/attendance?unit=${unit.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Folder
                      className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105"
                      style={{ color: stageStyle.color }}
                      fill={stageStyle.color}
                      fillOpacity={0.25}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                        {language === 'ar' ? unit.name_ar : unit.name_en}
                      </div>
                      <div className="text-[11px] text-[#444746] dark:text-[#8E918F] truncate flex items-center gap-1.5 font-normal">
                        <span>{unit.target_grade}</span>
                        <span>&bull;</span>
                        <span>{unit.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : (language === 'ar' ? 'بنات' : 'Girls')}</span>
                        {isParallel && (
                          <span className="px-1 rounded bg-[#E0E3E7] dark:bg-[#383A3C] text-[9px] font-medium text-[#444746]">
                            {unit.code.includes('_a') ? 'مسار A' : 'مسار B'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Trailing: Context Menu Button (⋮) */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuUnitId(activeMenuUnitId === unit.id ? null : unit.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
                      title={language === 'ar' ? 'خيارات إضافية' : 'Options'}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Context Menu Dropdown */}
                    {activeMenuUnitId === unit.id && (
                      <div className="absolute end-0 top-8 w-48 bg-white dark:bg-[#1E1F20] rounded-xl shadow-xl border border-[#E0E3E7] dark:border-[#303134] py-1.5 z-50 animate-fadeIn">
                        <Link
                          href={`/attendance?unit=${unit.id}`}
                          onClick={() => setActiveMenuUnitId(null)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
                        >
                          <CalendarCheck className="w-4 h-4 text-[#146C2E]" />
                          <span>{language === 'ar' ? 'تسجيل الحضور' : 'Take Attendance'}</span>
                        </Link>
                        <Link
                          href="/admin/analytics"
                          onClick={() => setActiveMenuUnitId(null)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#0B57D0]" />
                          <span>{language === 'ar' ? 'تحليلات الوحدة' : 'Unit Analytics'}</span>
                        </Link>
                        <Link
                          href="/members"
                          onClick={() => setActiveMenuUnitId(null)}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
                        >
                          <Users className="w-4 h-4 text-[#B06000]" />
                          <span>{language === 'ar' ? 'كشف الكشافين والقادة' : 'Unit Members'}</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* View 2: Google Drive Table Rows (List View) */}
        {viewMode === 'list' && (
          <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E3E7] dark:border-[#303134] overflow-hidden">
            {/* Table Header */}
            <div className="h-10 px-4 border-b border-[#F0F4F9] dark:border-[#2D2F31] bg-[#F8FAFD] dark:bg-[#282A2C] flex items-center text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">
              <div className="w-1/3 min-w-[180px]">{language === 'ar' ? 'اسم الوحدة الكشفية' : 'Unit Name'}</div>
              <div className="w-1/4 hidden sm:block">{language === 'ar' ? 'المرحلة والنوع' : 'Stage & Gender'}</div>
              <div className="w-1/4 hidden md:block">{language === 'ar' ? 'الصف والأعمار' : 'Grade & Ages'}</div>
              <div className="w-24 text-center">{language === 'ar' ? 'المسار' : 'Stream'}</div>
              <div className="ms-auto text-end">{language === 'ar' ? 'الإجراء' : 'Action'}</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#F0F4F9] dark:divide-[#282A2C]">
              {displayUnits.map((unit) => {
                const stageStyle = getStageColor(unit.code);
                const isParallel = unit.code.includes('_a') || unit.code.includes('_b');

                return (
                  <div
                    key={unit.id}
                    className="h-12 px-4 hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]/60 flex items-center text-sm text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
                  >
                    <div className="w-1/3 min-w-[180px] flex items-center gap-3">
                      <Folder
                        className="w-5 h-5 shrink-0"
                        style={{ color: stageStyle.color }}
                        fill={stageStyle.color}
                        fillOpacity={0.25}
                      />
                      <Link
                        href={`/attendance?unit=${unit.id}`}
                        className="font-medium hover:text-[#0B57D0] truncate"
                      >
                        {language === 'ar' ? unit.name_ar : unit.name_en}
                      </Link>
                    </div>

                    <div className="w-1/4 hidden sm:flex items-center gap-2">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${stageStyle.badgeBg}`}>
                        {stageStyle.stageName}
                      </span>
                      <span className="text-xs text-[#444746]">
                        {unit.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : (language === 'ar' ? 'بنات' : 'Girls')}
                      </span>
                    </div>

                    <div className="w-1/4 hidden md:block text-xs text-[#444746] dark:text-[#8E918F]">
                      {unit.target_grade} &bull; {language === 'ar' ? `أعمار ${unit.min_age}–${unit.max_age} سنة` : `Ages ${unit.min_age}–${unit.max_age}`}
                    </div>

                    <div className="w-24 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746]">
                        {isParallel ? (unit.code.includes('_a') ? 'مسار A' : 'مسار B') : (language === 'ar' ? 'متدرج' : 'Main')}
                      </span>
                    </div>

                    <div className="ms-auto flex items-center gap-2">
                      <Link
                        href={`/attendance?unit=${unit.id}`}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-[#F0F4F9] hover:bg-[#C2E7FF] text-[#001D35] transition-colors"
                      >
                        {language === 'ar' ? 'كشف الحضور' : 'Roster'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
