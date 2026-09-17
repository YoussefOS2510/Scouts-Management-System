import { INITIAL_UNITS, INITIAL_PATROLS, INITIAL_MEMBERS } from './data';

export interface SessionTelemetry {
  date: string;
  title_ar: string;
  title_en: string;
  total: number;
  present: number;
  absent: number;
  excused: number;
  late: number;
  rate: number;
}

export interface PatrolAttendanceStat {
  patrolId: number;
  name_ar: string;
  name_en: string;
  scoutCount: number;
  attendanceRate: number;
  perfectAttendanceCount: number;
  status: 'top' | 'optimal' | 'warning';
}

export interface ExcuseDistribution {
  category_ar: string;
  category_en: string;
  percentage: number;
  count: number;
  color: string;
}

export interface ScoutAttendanceDetail {
  id: string;
  member_code: string;
  name_ar: string;
  name_en: string;
  academic_year: string;
  patrol_id?: number | null;
  patrol_name_ar: string;
  patrol_name_en: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  excusedSessions: number;
  lateSessions: number;
  attendanceRate: number; // 0 - 100
  consecutiveAbsences: number;
  father_phone?: string;
  mother_phone?: string;
  status: 'perfect' | 'regular' | 'needs_followup';
}

export interface UnitAttendanceAnalytics {
  unitId: number;
  unitCode: string;
  unitName_ar: string;
  unitName_en: string;
  totalScouts: number;
  overallAttendanceRate: number;
  totalSessionsHeld: number;
  avgPresentPerSession: number;
  avgAbsentPerSession: number;
  avgExcusedPerSession: number;
  avgLatePerSession: number;
  sessionsHistory: SessionTelemetry[];
  patrolsStats: PatrolAttendanceStat[];
  excuseBreakdown: ExcuseDistribution[];
  allScoutsStats: ScoutAttendanceDetail[];
  honorRoll: ScoutAttendanceDetail[];
  needsFollowUp: ScoutAttendanceDetail[];
}

/**
 * Returns complete attendance analytics for a specific unit
 */
export function getUnitAttendanceAnalytics(unitId: number): UnitAttendanceAnalytics {
  const unit = INITIAL_UNITS.find((u) => u.id === unitId) || INITIAL_UNITS[4]; // default Kashafa A
  const unitPatrols = INITIAL_PATROLS.filter((p) => p.unit_id === unitId);
  const unitMembers = INITIAL_MEMBERS.filter((m) => m.unit_id === unitId);

  // Baseline unit rates tailored per unit
  const baselineRate =
    unitId === 3 ? 96 : // Zahrat A
    unitId === 7 ? 95 : // Morshdat A
    unitId === 1 ? 94 : // Ashbal A
    unitId === 5 ? 93 : // Kashafa A
    unitId === 4 ? 91 : // Zahrat B
    unitId === 10 ? 90 : // Ra2edat
    unitId === 2 ? 89 : // Ashbal B
    unitId === 8 ? 88 : // Morshdat B
    unitId === 11 ? 87 : // Gawala
    unitId === 6 ? 85 : // Kashafa B
    84; // Motakadem

  const totalSessionsHeld = 12;

  // Build detailed scout attendance metrics for every member in this unit
  // Provide authentic distribution (e.g. 100%, 92%, 83%, 75%, 67%)
  const scoutPerformanceProfiles = [
    { present: 12, excused: 0, absent: 0, late: 0, consecutive: 0 },
    { present: 11, excused: 1, absent: 0, late: 0, consecutive: 0 },
    { present: 11, excused: 0, absent: 0, late: 1, consecutive: 0 },
    { present: 10, excused: 2, absent: 0, late: 0, consecutive: 0 },
    { present: 10, excused: 1, absent: 1, late: 0, consecutive: 0 },
    { present: 9, excused: 1, absent: 1, late: 1, consecutive: 0 },
    { present: 9, excused: 0, absent: 2, late: 1, consecutive: 2 },
    { present: 8, excused: 1, absent: 3, late: 0, consecutive: 3 },
  ];

  const allScoutsStats: ScoutAttendanceDetail[] = unitMembers.map((m, idx) => {
    const p = unitPatrols.find((pat) => pat.id === m.patrol_id);
    const profile = scoutPerformanceProfiles[idx % scoutPerformanceProfiles.length];

    const rate = Math.round(((profile.present + profile.late) / totalSessionsHeld) * 100);
    const status: 'perfect' | 'regular' | 'needs_followup' =
      rate === 100 ? 'perfect' : rate < 75 || profile.consecutive >= 2 ? 'needs_followup' : 'regular';

    return {
      id: m.id,
      member_code: m.member_code,
      name_ar: m.full_name_ar,
      name_en: m.full_name_en || m.full_name_ar,
      academic_year: m.academic_year,
      patrol_id: m.patrol_id,
      patrol_name_ar: p?.name_ar || 'بدون طليعة',
      patrol_name_en: p?.name_en || 'Unassigned',
      totalSessions: totalSessionsHeld,
      presentSessions: profile.present,
      absentSessions: profile.absent,
      excusedSessions: profile.excused,
      lateSessions: profile.late,
      attendanceRate: rate,
      consecutiveAbsences: profile.consecutive,
      father_phone: m.father_phone,
      mother_phone: m.mother_phone,
      status,
    };
  });

  const totalScouts = allScoutsStats.length > 0 ? allScoutsStats.length : 24;

  // Generate 6 recent weekly session telemetries
  const dates = ['2026-09-12', '2026-09-05', '2026-08-29', '2026-08-22', '2026-08-15', '2026-08-08'];
  const sessionTitles = [
    { ar: 'اجتماع التدريب الأسبوعي وشارات الهواية', en: 'Weekly Badge & Skills Training' },
    { ar: 'جلسة الألعاب الكشفية والمشاريع الريادية', en: 'Pioneering & Scouting Games Session' },
    { ar: 'يوم الخدمة العامة والأنشطة البيئية', en: 'Community Service & Environmental Day' },
    { ar: 'ورشة التخييم ونصب الخيام والمواقد', en: 'Campcraft, Tents & Stoves Workshop' },
    { ar: 'جلسة التقاليد الكشفية والنداءات والاصطفاف', en: 'Scout Traditions, Patrol Calls & Assembly' },
    { ar: 'اجتماع الإعداد للنشاط والمخيم الصيفي', en: 'Summer Camp Preparation Meeting' },
  ];

  const rateDeltas = [2, -1, 3, -2, 1, 0];

  const sessionsHistory: SessionTelemetry[] = dates.map((date, idx) => {
    const sRate = Math.min(100, Math.max(70, baselineRate + rateDeltas[idx]));
    const present = Math.round((totalScouts * sRate) / 100);
    const absent = Math.max(0, Math.round(totalScouts * 0.04));
    const excused = Math.max(0, Math.round(totalScouts * 0.05));
    const late = Math.max(0, totalScouts - present - absent - excused);

    return {
      date,
      title_ar: sessionTitles[idx].ar,
      title_en: sessionTitles[idx].en,
      total: totalScouts,
      present,
      absent,
      excused,
      late,
      rate: sRate,
    };
  });

  // Patrol stats
  const patrolsStats: PatrolAttendanceStat[] = unitPatrols.map((patrol, idx) => {
    const pMembers = allScoutsStats.filter((s) => s.patrol_id === patrol.id);
    const count = pMembers.length > 0 ? pMembers.length : Math.max(4, Math.floor(totalScouts / Math.max(1, unitPatrols.length)));
    
    // Average from actual scouts if present
    const avgRate = pMembers.length > 0
      ? Math.round(pMembers.reduce((acc, s) => acc + s.attendanceRate, 0) / pMembers.length)
      : Math.min(99, Math.max(75, baselineRate + (idx === 0 ? 3 : idx === 1 ? 0 : -3)));

    const perfectCount = pMembers.filter((s) => s.attendanceRate === 100).length;

    return {
      patrolId: patrol.id,
      name_ar: patrol.name_ar,
      name_en: patrol.name_en,
      scoutCount: count,
      attendanceRate: avgRate,
      perfectAttendanceCount: perfectCount > 0 ? perfectCount : Math.max(1, Math.round(count * 0.3)),
      status: avgRate >= 93 ? 'top' : avgRate >= 85 ? 'optimal' : 'warning',
    };
  });

  // Common excuse categories distribution
  const excuseBreakdown: ExcuseDistribution[] = [
    { category_ar: 'امتحانات ومذاكرة دراسية', category_en: 'Study & Exams', percentage: 48, count: 12, color: 'bg-amber-500' },
    { category_ar: 'سفر وظروف أسرية', category_en: 'Family & Travel', percentage: 28, count: 7, color: 'bg-blue-500' },
    { category_ar: 'عارض صحي ومرض', category_en: 'Medical & Illness', percentage: 24, count: 6, color: 'bg-rose-500' },
  ];

  const honorRoll = allScoutsStats.filter((s) => s.status === 'perfect');
  const needsFollowUp = allScoutsStats.filter((s) => s.status === 'needs_followup');

  return {
    unitId: unit.id,
    unitCode: unit.code,
    unitName_ar: unit.name_ar,
    unitName_en: unit.name_en,
    totalScouts,
    overallAttendanceRate: baselineRate,
    totalSessionsHeld,
    avgPresentPerSession: Math.round((totalScouts * baselineRate) / 100),
    avgAbsentPerSession: Math.max(1, Math.round(totalScouts * 0.04)),
    avgExcusedPerSession: Math.max(1, Math.round(totalScouts * 0.06)),
    avgLatePerSession: Math.max(1, Math.round(totalScouts * 0.03)),
    sessionsHistory,
    patrolsStats,
    excuseBreakdown,
    allScoutsStats,
    honorRoll,
    needsFollowUp,
  };
}
