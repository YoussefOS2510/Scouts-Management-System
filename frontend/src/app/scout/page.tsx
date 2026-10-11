'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_PATROLS } from '../../lib/data';
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

  // Active Scout: fallback to first member if viewing as admin
  const activeScout = currentMember || members[0] || null;
  const scoutId = activeScout?.id;

  // Selected Album for viewing photos
  const [selectedAlbum, setSelectedAlbum] = useState<MediaAlbum | null>(null);

  // Lightbox Modal for enlarged photo
  const [activePhoto, setActivePhoto] = useState<MediaItem | null>(null);

  // Year filter for photo folders
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');

  // Live Database Scout Profile
  const [profileData, setProfileData] = useState<any>(null);

  React.useEffect(() => {
    if (!scoutId) return;
    fetch(`/api/scout/profile?memberId=${scoutId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProfileData(data);
        }
      })
      .catch((err) => console.error('Failed to fetch scout profile:', err));
  }, [scoutId]);

  // Stats and history
  const stats = useMemo(() => {
    if (profileData?.stats) return profileData.stats;
    return getScoutAttendanceStats(scoutId);
  }, [profileData, scoutId, getScoutAttendanceStats]);

  const sessions = useMemo(() => {
    if (profileData?.sessions) return profileData.sessions;
    return getScoutSessionRecords(scoutId);
  }, [profileData, scoutId, getScoutSessionRecords]);

  const accessibleAlbums = useMemo(() => {
    if (profileData?.albums) return profileData.albums;
    return getScoutAccessibleAlbums(scoutId);
  }, [profileData, scoutId, getScoutAccessibleAlbums]);

  const albumPhotos = useMemo(
    () => (selectedAlbum ? getAlbumPhotos(selectedAlbum.id) : []),
    [selectedAlbum, getAlbumPhotos]
  );

  if (!activeScout) {
    return (
      <div className="p-12 text-center text-stone-500 font-mono text-sm">
        {language === 'ar' ? 'جاري تحميل بيانات الكشاف من قاعدة البيانات...' : 'Loading scout profile from database...'}
      </div>
    );
  }

  const scoutUnit = INITIAL_UNITS.find((u) => u.id === activeScout.unit_id);
  const scoutPatrol = INITIAL_PATROLS.find((p) => p.id === activeScout.patrol_id);

  // Filtered albums by year
  const displayedAlbums = useMemo(() => {
    if (selectedYearFilter === 'all') return accessibleAlbums;
    return accessibleAlbums.filter((a: any) => a.year?.toString() === selectedYearFilter);
  }, [accessibleAlbums, selectedYearFilter]);

  // Unique years in scout's progression
  const availableYears = useMemo<number[]>(() => {
    const list: number[] = accessibleAlbums.map((a: any) => Number(a.year)).filter((y: number) => !isNaN(y) && y > 0);
    const unique = Array.from(new Set<number>(list));
    return unique.sort((a: number, b: number) => b - a);
  }, [accessibleAlbums]);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* 1. COHESIVE PROFILE HERO CARD (Collapsed from stacked identity banners) */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#111827] border border-neutral-200 dark:border-neutral-800/80 p-6 sm:p-7 shadow-xs">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Bar: Badges + Integrated Persona Switcher Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800/70">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-300 font-mono text-xs font-bold tracking-wider">
                {activeScout.member_code}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-300 text-xs font-medium border border-neutral-200/60 dark:border-neutral-800">
                <bdi>{activeScout.academic_year}</bdi>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
                <span>{language === 'ar' ? 'وسام المواظبة' : 'Honor Badge'}</span>
              </span>
            </div>

            {/* Integrated Persona Switcher Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="font-medium hidden sm:inline">
                  {language === 'ar' ? 'تبديل الكشاف:' : 'Switch Scout:'}
                </span>
              </div>
              <div className="relative">
                <select
                  value={activeScout.id}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'leader') {
                      loginAs('u0');
                    } else {
                      loginAsMember(val);
                    }
                  }}
                  className="bg-neutral-50 dark:bg-[#1E293B] border border-neutral-200 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100 text-xs font-medium rounded-lg ps-3 pe-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer appearance-none transition-colors"
                  aria-label={language === 'ar' ? 'تبديل الكشاف أو العودة للقائد' : 'Switch scout or return to leader'}
                >
                  <option value="m1">مينا سمير — كشافة (Mina Samir)</option>
                  <option value="m101">فادي ماجد — أشبال (Fady Maged)</option>
                  <option value="m301">مريم شريف — مرشدات (Maryam Sherif)</option>
                  <option value="leader">↩ {language === 'ar' ? 'العودة كقائد (Leader Console)' : 'Return to Leader Console'}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2 text-neutral-400">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Identity & Circular Gauge Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-xs">
                <Compass className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                  <bdi>{language === 'ar' ? activeScout.full_name_ar : (activeScout.full_name_en || activeScout.full_name_ar)}</bdi>
                </h1>

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 mt-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><bdi>{scoutUnit ? (language === 'ar' ? scoutUnit.name_ar : scoutUnit.name_en) : 'الكشافة'}</bdi></span>
                  </div>
                  <span className="text-neutral-400">&bull;</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-500 shrink-0" />
                    <span><bdi>{scoutPatrol ? (language === 'ar' ? scoutPatrol.name_ar : scoutPatrol.name_en) : 'الطليعة'}</bdi></span>
                  </div>
                  {activeScout.sunday_school_class && (
                    <>
                      <span className="text-neutral-400">&bull;</span>
                      <span className="text-neutral-500 dark:text-neutral-400"><bdi>{activeScout.sunday_school_class}</bdi></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Circular Attendance Gauge */}
            <div className="bg-neutral-50 dark:bg-[#1E293B]/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-4 flex items-center gap-4 shrink-0 shadow-xs">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-200 dark:text-neutral-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500"
                    strokeDasharray={`${stats.percentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-base sm:text-lg font-black font-mono text-neutral-900 dark:text-white">{stats.percentage}%</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === 'ar' ? 'نسبة الالتزام والحضور' : 'Attendance Rate'}
                </div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {stats.percentage >= 90
                    ? (language === 'ar' ? 'رتبة الشرف الذهبية 🌟' : 'Gold Honor 🌟')
                    : stats.percentage >= 75
                    ? (language === 'ar' ? 'رتبة الشرف الفضية 🥈' : 'Silver Honor 🥈')
                    : (language === 'ar' ? 'رتبة الشرف البرونزية 🥉' : 'Bronze Honor 🥉')}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">
                  {stats.presentCount} {language === 'ar' ? 'حضور من' : 'present of'} {stats.totalSessions} {language === 'ar' ? 'جلسة' : 'sessions'}
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Progression Journey Timeline */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/70 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-neutral-500 dark:text-neutral-400 shrink-0 text-[11px] uppercase tracking-wider">
              {language === 'ar' ? 'المسيرة الكشفية:' : 'Journey:'}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {scoutProgressionHistory.map((h, idx) => (
                <React.Fragment key={h.id}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/80 dark:border-neutral-800 text-xs font-medium">
                    <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{h.year}</span>
                    <span className="text-neutral-400">&bull;</span>
                    <span className="text-neutral-700 dark:text-neutral-200"><bdi>{h.stage_name_ar}</bdi></span>
                  </div>
                  {idx < scoutProgressionHistory.length - 1 && (
                    <ChevronLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0 rtl:rotate-0 rotate-180" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ATTENDANCE METRICS & SESSION RECORD */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ar' ? 'سجل وإحصائيات الحضور الكشفي' : 'Scout Attendance & Session Records'}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {language === 'ar'
                ? 'متابعة دقيقة لالتزام الكشاف بالاجتماعات الأسبوعية والمخيمات ونشاطات الطليعة'
                : 'Personalized attendance breakdown across troop meetings, outdoor hikes, and camps.'}
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{language === 'ar' ? 'حاضر (Present)' : 'Present'}</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50 tabular-nums">
                {stats.presentCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{language === 'ar' ? 'متأخر (Late)' : 'Late'}</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50 tabular-nums">
                {stats.lateCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{language === 'ar' ? 'معتذر (Excused)' : 'Excused'}</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50 tabular-nums">
                {stats.excusedCount}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">{language === 'ar' ? 'غياب (Absent)' : 'Absent'}</div>
              <div className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50 tabular-nums">
                {stats.absentCount}
              </div>
            </div>
          </div>
        </div>

        {/* Standardized Session Records Table */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-neutral-50/70 dark:bg-[#1E293B]/50 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{language === 'ar' ? 'آخر الجلسات الكشفية المسجلة' : 'Recent Recorded Scout Assemblies'}</span>
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              {sessions.length} {language === 'ar' ? 'جلسة' : 'sessions'}
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 max-h-64 overflow-y-auto">
            {sessions.map((rec: any) => (
              <div
                key={rec.id}
                className="p-3 sm:px-4 hover:bg-neutral-50/80 dark:hover:bg-[#1E293B]/40 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span><bdi>{language === 'ar' ? rec.session_title_ar : rec.session_title_en}</bdi></span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1E293B] text-neutral-600 dark:text-neutral-400 font-mono border border-neutral-200/60 dark:border-neutral-800">
                      <bdi>{rec.unit_name_ar}</bdi>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                    <span>{rec.session_date}</span>
                    {rec.notes && (
                      <>
                        <span className="text-neutral-400">&bull;</span>
                        <span className="text-neutral-600 dark:text-neutral-300 font-sans italic"><bdi>{rec.notes}</bdi></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono border ${
                      rec.status === 'present'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                        : rec.status === 'late'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : rec.status === 'excused'
                        ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
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

      {/* 3. MULTI-YEAR TEAM PHOTO VAULT & FOLDERS */}
      <div className="space-y-4 pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <Folder className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{language === 'ar' ? 'أرشيف ذكريات وصور فرقتي عبر السنين' : 'My Team Media Folders Across the Years'}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {language === 'ar'
                ? `مخصص للكشاف: تظهر لك تلقائياً ألبومات ومجلدات الفرق التي التحقت بها فقط عبر السنين (${scoutProgressionHistory.map((h) => `${h.year}: ${h.stage_name_ar}`).join(' • ')})`
                : 'Only unlocks folders for teams and years you were officially enrolled in.'}
            </p>
          </div>

          {/* Year Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedYearFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedYearFilter === 'all'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1E293B]/80'
              }`}
            >
              {language === 'ar' ? 'جميع السنين' : 'All Years'}
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYearFilter(year.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  selectedYearFilter === year.toString()
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#1E293B]/80'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Media Albums / Folders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAlbums.map((album: any) => {
            const isSelected = selectedAlbum?.id === album.id;
            const unit = INITIAL_UNITS.find((u) => u.id === album.unit_id);

            return (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(isSelected ? null : album)}
                className={`group relative overflow-hidden rounded-xl bg-white dark:bg-[#111827] border transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/20'
                    : 'border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Album Cover Thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={album.cover_image_url}
                    alt={album.event_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Year & Photo count badges */}
                  <div className="absolute top-3 start-3 end-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-xs font-bold border border-white/20">
                      {album.year}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-600/90 text-white font-mono text-[11px] font-medium flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{album.photo_count} {language === 'ar' ? 'صورة' : 'photos'}</span>
                    </span>
                  </div>

                  {/* Title overlay */}
                  <div className="absolute bottom-3 start-3 end-3 text-white">
                    <div className="text-xs font-mono text-sky-300 flex items-center gap-1 mb-0.5">
                      <Folder className="w-3.5 h-3.5" />
                      <span><bdi>{unit?.name_ar} {album.year}</bdi></span>
                    </div>
                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      <bdi>{language === 'ar' ? album.event_name_ar : album.event_name}</bdi>
                    </h3>
                  </div>
                </div>

                {/* Footer bar */}
                <div className="p-3 bg-neutral-50 dark:bg-[#1E293B]/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-mono text-[11px]">{album.date}</span>
                  <span className="text-sky-600 dark:text-sky-400 font-medium flex items-center gap-1 group-hover:underline">
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
          <div className="mt-6 p-5 sm:p-6 bg-white dark:bg-[#111827] rounded-xl border border-sky-500/40 dark:border-sky-500/30 shadow-md space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20 flex items-center justify-center font-bold">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-neutral-50">
                      <bdi>{language === 'ar' ? selectedAlbum.event_name_ar : selectedAlbum.event_name}</bdi>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-xs font-bold border border-sky-200/60 dark:border-sky-500/20">
                      {selectedAlbum.year}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono" dir="ltr">
                    Google Drive: /ScoutsArchive/{selectedAlbum.year}/{INITIAL_UNITS.find((u) => u.id === selectedAlbum.unit_id)?.name_en}/{selectedAlbum.event_name}/
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlbum(null)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#1E293B] text-xs font-medium self-start sm:self-auto cursor-pointer"
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
                  className="group relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#1E293B] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer shadow-xs hover:shadow-md transition-all"
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

                  <div className="p-3 bg-white dark:bg-[#111827] space-y-1">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-1">
                      <bdi>{language === 'ar' ? photo.title_ar : photo.title_en}</bdi>
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                      <span>{photo.date}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-sans font-medium flex items-center gap-1">
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
            className="relative max-w-4xl w-full bg-[#111827] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#0B0F17] border-b border-neutral-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  <bdi>{language === 'ar' ? activePhoto.title_ar : activePhoto.title_en}</bdi>
                </h3>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                  {activePhoto.date} &bull; {activePhoto.file_name}
                </div>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
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
            <div className="p-4 bg-[#0B0F17] border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-300">
              <div className="flex flex-wrap items-center gap-1.5">
                {activePhoto.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full bg-[#1E293B] border border-neutral-700 text-neutral-300 text-[11px]"
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
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center gap-1.5 transition-colors"
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
