'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_PATROLS, INITIAL_MEMBERS } from '../../lib/data';
import { MediaAlbum, MediaItem } from '../../lib/types';
import {
  Compass,
  CalendarCheck,
  Award,
  Sparkles,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Layers,
  Flame,
  Star,
  Users,
  ExternalLink,
  BookOpen,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function ScoutPortalPage() {
  const { language, t } = useLanguage();
  const {
    currentUser,
    currentMember,
    isScout,
    scoutProgressionHistory,
    getScoutAccessibleAlbums,
    getAlbumPhotos,
    getScoutAttendanceStats,
    getScoutSessionRecords,
    loginAsMember,
    loginAs,
    members,
  } = useAuth();

  // Active Scout: fallback to first member (Mina Samir) if viewing as admin
  const activeScout = currentMember || members[0];
  const scoutId = activeScout.id;

  // Selected Album for viewing photos
  const [selectedAlbum, setSelectedAlbum] = useState<MediaAlbum | null>(null);

  // Lightbox Modal for enlarged photo
  const [activePhoto, setActivePhoto] = useState<MediaItem | null>(null);

  // Year filter for photo folders
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');

  // Stats and history
  const stats = useMemo(() => getScoutAttendanceStats(scoutId), [scoutId, getScoutAttendanceStats]);
  const sessions = useMemo(() => getScoutSessionRecords(scoutId), [scoutId, getScoutSessionRecords]);
  const accessibleAlbums = useMemo(() => getScoutAccessibleAlbums(scoutId), [scoutId, getScoutAccessibleAlbums]);
  const albumPhotos = useMemo(
    () => (selectedAlbum ? getAlbumPhotos(selectedAlbum.id) : []),
    [selectedAlbum, getAlbumPhotos]
  );

  const scoutUnit = INITIAL_UNITS.find((u) => u.id === activeScout.unit_id);
  const scoutPatrol = INITIAL_PATROLS.find((p) => p.id === activeScout.patrol_id);

  // Filtered albums by year
  const displayedAlbums = useMemo(() => {
    if (selectedYearFilter === 'all') return accessibleAlbums;
    return accessibleAlbums.filter((a) => a.year.toString() === selectedYearFilter);
  }, [accessibleAlbums, selectedYearFilter]);

  // Unique years in scout's progression
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(accessibleAlbums.map((a) => a.year))).sort((a, b) => b - a);
    return years;
  }, [accessibleAlbums]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* 0. DEMO ROLE / SCOUT QUICK SWITCHER (Essential for Pair Programming & Testing) */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>{language === 'ar' ? 'معاينة تجربة الكشاف (Scout Persona Switcher)' : 'Scout Persona Switcher'}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 text-[10px] font-mono">
                {activeScout.member_code}
              </span>
            </div>
            <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
              {language === 'ar'
                ? 'جرب التبديل بين الكشافة لاختبار كيف تظهر مجلدات فرقة كل كشاف عبر السنين حسب سجله الكشفي'
                : 'Switch between youth scouts to verify personalized yearly team folders & attendance stats'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={() => loginAsMember('m1')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeScout.id === 'm1'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            مينا سمير (2024-2026)
          </button>
          <button
            onClick={() => loginAsMember('m101')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeScout.id === 'm101'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            فادي ماجد (شبل)
          </button>
          <button
            onClick={() => loginAsMember('m301')}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
              activeScout.id === 'm301'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            مريم شريف (مرشدات)
          </button>
          <button
            onClick={() => loginAs('u0')}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:opacity-90 transition-all flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'العودة كقائد' : 'Switch to Leader'}</span>
          </button>
        </div>
      </div>

      {/* 1. HERO IDENTITY CARD (عرين الكشاف) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-teal-900 to-zinc-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-700/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Compass className="w-9 h-9 text-emerald-300" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 text-emerald-200 font-mono text-xs font-bold tracking-wider">
                  {activeScout.member_code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 text-xs font-medium">
                  {activeScout.academic_year}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>{language === 'ar' ? 'وسام المواظبة' : 'Honor Badge'}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-2">
                {language === 'ar' ? activeScout.full_name_ar : (activeScout.full_name_en || activeScout.full_name_ar)}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-100/90 mt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{scoutUnit ? (language === 'ar' ? scoutUnit.name_ar : scoutUnit.name_en) : 'الكشافة'}</span>
                </div>
                <span>&bull;</span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-300" />
                  <span>{scoutPatrol ? (language === 'ar' ? scoutPatrol.name_ar : scoutPatrol.name_en) : 'الطليعة'}</span>
                </div>
                {activeScout.sunday_school_class && (
                  <>
                    <span>&bull;</span>
                    <span className="text-white/70">{activeScout.sunday_school_class}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Circular Attendance Gauge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  strokeDasharray={`${stats.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">{stats.percentage}%</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-emerald-200 font-medium">{language === 'ar' ? 'نسبة الالتزام والحضور' : 'Attendance Rate'}</div>
              <div className="text-lg font-black text-white mt-0.5">
                {stats.percentage >= 90
                  ? (language === 'ar' ? 'رتبة الشرف الذهبية 🌟' : 'Gold Honor 🌟')
                  : stats.percentage >= 75
                  ? (language === 'ar' ? 'رتبة الشرف الفضية 🥈' : 'Silver Honor 🥈')
                  : (language === 'ar' ? 'رتبة الشرف البرونزية 🥉' : 'Bronze Honor 🥉')}
              </div>
              <div className="text-[11px] text-white/70 mt-1 font-mono">
                {stats.presentCount} {language === 'ar' ? 'حضور من' : 'present out of'} {stats.totalSessions} {language === 'ar' ? 'جلسة' : 'sessions'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTENDANCE METRICS & SESSION RECORD (إحصائيات الحضور والغياب) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ar' ? 'سجل وإحصائيات الحضور الكشفي' : 'Scout Attendance & Session Records'}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {language === 'ar'
                ? 'متابعة دقيقة لالتزام الكشاف بالاجتماعات الأسبوعية والمخيمات ونشاطات الطليعة'
                : 'Personalized attendance breakdown across troop meetings, outdoor hikes, and camps.'}
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">{language === 'ar' ? 'حاضر (Present)' : 'Present'}</div>
              <div className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                {stats.presentCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">{language === 'ar' ? 'متأخر (Late)' : 'Late'}</div>
              <div className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                {stats.lateCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">{language === 'ar' ? 'معتذر (Excused)' : 'Excused'}</div>
              <div className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                {stats.excusedCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121214] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-500">{language === 'ar' ? 'غياب (Absent)' : 'Absent'}</div>
              <div className="text-xl font-black font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                {stats.absentCount}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance Session Log */}
        <div className="bg-white dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>{language === 'ar' ? 'آخر الجلسات الكشفية المسجلة' : 'Recent Recorded Scout Assemblies'}</span>
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {sessions.length} {language === 'ar' ? 'جلسة' : 'sessions'}
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-60 overflow-y-auto">
            {sessions.map((rec) => (
              <div
                key={rec.id}
                className="p-3 sm:px-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{language === 'ar' ? rec.session_title_ar : rec.session_title_en}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                      {rec.unit_name_ar}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>{rec.session_date}</span>
                    {rec.notes && (
                      <>
                        <span>&bull;</span>
                        <span className="text-zinc-600 dark:text-zinc-300 font-sans italic">{rec.notes}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono border ${
                      rec.status === 'present'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : rec.status === 'late'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        : rec.status === 'excused'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {rec.status === 'present'
                      ? (language === 'ar' ? 'حاضر' : 'Present')
                      : rec.status === 'late'
                      ? (language === 'ar' ? 'متأخر' : 'Late')
                      : rec.status === 'excused'
                      ? (language === 'ar' ? 'معتذر' : 'Excused')
                      : (language === 'ar' ? 'غائب' : 'Absent')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MULTI-YEAR TEAM PHOTO VAULT & FOLDERS (أرشيف وصور فرقتي عبر السنين) */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>{language === 'ar' ? 'أرشيف ذكريات وصور فرقتي عبر السنين' : 'My Team Media Folders Across the Years'}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {language === 'ar'
                ? `مخصص للكشاف: تظهر لك تلقائياً ألبومات ومجلدات الفرق التي التحقت بها فقط عبر السنين (${scoutProgressionHistory.map((h) => `${h.year}: ${h.stage_name_ar}`).join(' • ')})`
                : 'Only unlocks folders for teams and years you were officially enrolled in.'}
            </p>
          </div>

          {/* Year Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedYearFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedYearFilter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {language === 'ar' ? 'جميع السنين' : 'All Years'}
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYearFilter(year.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                  selectedYearFilter === year.toString()
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Yearly Progression Roadmap / Timeline Chips */}
        <div className="flex items-center gap-2 overflow-x-auto p-3 bg-zinc-100/70 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
            {language === 'ar' ? 'مسيرتي الكشفية:' : 'My Journey:'}
          </span>
          {scoutProgressionHistory.map((h, idx) => (
            <React.Fragment key={h.id}>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0 text-xs font-medium">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{h.year}</span>
                <span>&bull;</span>
                <span className="text-zinc-900 dark:text-zinc-100">{h.stage_name_ar}</span>
              </div>
              {idx < scoutProgressionHistory.length - 1 && (
                <ChevronLeft className="w-4 h-4 text-zinc-400 shrink-0 rtl:rotate-0 rotate-180" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Media Albums / Folders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAlbums.map((album) => {
            const isSelected = selectedAlbum?.id === album.id;
            const unit = INITIAL_UNITS.find((u) => u.id === album.unit_id);

            return (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(isSelected ? null : album)}
                className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-[#121214] border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {/* Album Cover Thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={album.cover_image_url}
                    alt={album.event_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Year & Photo count badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/20">
                      {album.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white font-mono text-[11px] font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{album.photo_count} {language === 'ar' ? 'صورة' : 'photos'}</span>
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-xs font-mono text-emerald-300 flex items-center gap-1 mb-0.5">
                      <Folder className="w-3.5 h-3.5" />
                      <span>{unit?.name_ar} {album.year}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {language === 'ar' ? album.event_name_ar : album.event_name}
                    </h3>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-mono text-[11px]">{album.date}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1 group-hover:underline">
                    <span>{isSelected ? (language === 'ar' ? 'إغلاق المعرض' : 'Close Album') : (language === 'ar' ? 'فتح الألبوم وعرض الصور' : 'Open Album')}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. EXPANDED ALBUM PHOTOS GALLERY (When an Album is Clicked) */}
        {selectedAlbum && (
          <div className="mt-6 p-5 sm:p-6 bg-white dark:bg-[#121214] rounded-2xl border-2 border-emerald-600/40 dark:border-emerald-500/40 shadow-lg space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
                      {language === 'ar' ? selectedAlbum.event_name_ar : selectedAlbum.event_name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold">
                      {selectedAlbum.year}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono">
                    Google Drive: /ScoutsArchive/{selectedAlbum.year}/{INITIAL_UNITS.find((u) => u.id === selectedAlbum.unit_id)?.name_en}/{selectedAlbum.event_name}/
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlbum(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 text-xs font-medium self-start sm:self-auto cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق الألبوم' : 'Close Album'}
              </button>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {albumPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setActivePhoto(photo)}
                  className="group relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer shadow-xs hover:shadow-md transition-all"
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.title_ar}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                      <span className="p-2 rounded-full bg-black/60 backdrop-blur-md">
                        <Maximize2 className="w-5 h-5" />
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 space-y-1">
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {language === 'ar' ? photo.title_ar : photo.title_en}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>{photo.date}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-sans font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{language === 'ar' ? 'تكبير' : 'View'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. PHOTO LIGHTBOX MODAL */}
      {activePhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {language === 'ar' ? activePhoto.title_ar : activePhoto.title_en}
                </h3>
                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                  {activePhoto.date} &bull; {activePhoto.file_name}
                </div>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Enlarged Image */}
            <div className="relative max-h-[65vh] w-full flex items-center justify-center p-2 bg-black">
              <img
                src={activePhoto.url}
                alt={activePhoto.title_ar}
                className="max-h-[60vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
              <div className="flex flex-wrap items-center gap-1.5">
                {activePhoto.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activePhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تحميل الصورة الأصلية' : 'Download Photo'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
