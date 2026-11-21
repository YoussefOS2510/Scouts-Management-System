import { UnitStage, GenderType } from '../types';

export interface ScoutThemeColors {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  success: string;
  successSoft: string;
  info: string;
  infoSoft: string;
  overlay: string;
}

export const LIGHT_SCOUT_THEME: ScoutThemeColors = {
  isDark: false,
  bg: '#F7F6F2', // Warm Parchment
  surface: '#FFFFFF',
  surfaceAlt: '#EFECE6', // Warm Khaki Surface
  border: '#E4E0D8', // Earth Subtle Border
  borderStrong: '#D0C9BC',
  text: '#1A241E', // Deep Forest Ink
  textSecondary: '#4A554E',
  textMuted: '#78827B',
  primary: '#1B4332', // Scout Evergreen
  primaryHover: '#143325',
  primarySoft: '#E8F3EE',
  accent: '#B45309', // Campfire Amber
  accentSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  success: '#15803D',
  successSoft: '#DCFCE7',
  info: '#0369A1',
  infoSoft: '#E0F2FE',
  overlay: 'rgba(15, 23, 18, 0.55)',
};

export const DARK_SCOUT_THEME: ScoutThemeColors = {
  isDark: true,
  bg: '#0B110E', // Deep Forest Night
  surface: '#141F19', // Pine Panel
  surfaceAlt: '#1C2B23', // Elevated Pine Card
  border: '#25382E',
  borderStrong: '#324B3E',
  text: '#ECFDF5',
  textSecondary: '#A7B9B0',
  textMuted: '#6E857A',
  primary: '#15803D',
  primaryHover: '#166534',
  primarySoft: '#132A1F',
  accent: '#D97706',
  accentSoft: '#2E2111',
  danger: '#EF4444',
  dangerSoft: '#2D1618',
  warning: '#F59E0B',
  warningSoft: '#2E2111',
  success: '#22C55E',
  successSoft: '#132A1F',
  info: '#38BDF8',
  infoSoft: '#0F2533',
  overlay: 'rgba(0, 0, 0, 0.72)',
};

export function getStageVisuals(stage: UnitStage | string) {
  switch (stage) {
    case 'buds':
      return {
        emblem: '🌱',
        labelAr: 'مرحلة البراعم',
        labelEn: 'Buds Stage',
        accentHex: '#059669',
        bgTint: '#D1FAE5',
      };
    case 'cubs':
      return {
        emblem: '🐾',
        labelAr: 'مرحلة الأشبال والزهرات',
        labelEn: 'Cubs & Brownies',
        accentHex: '#B45309',
        bgTint: '#FEF3C7',
      };
    case 'scouts':
      return {
        emblem: '⚜️',
        labelAr: 'مرحلة الكشافة والمرشدات',
        labelEn: 'Scouts & Guides',
        accentHex: '#1B4332',
        bgTint: '#DCFCE7',
      };
    case 'venturers':
      return {
        emblem: '🧭',
        labelAr: 'مرحلة المتقدم والرائدات',
        labelEn: 'Venturers & Rangers',
        accentHex: '#0369A1',
        bgTint: '#E0F2FE',
      };
    case 'rovers':
    default:
      return {
        emblem: '🔥',
        labelAr: 'مرحلة الجوالة والخدمة العامة',
        labelEn: 'Rovers Stage',
        accentHex: '#9A3412',
        bgTint: '#FFEDD5',
      };
  }
}

export function getSubdivisionTerms(stage: UnitStage | string, _gender?: GenderType) {
  if (stage === 'buds' || stage === 'cubs') {
    return {
      subdivisionType: 'six' as const,
      groupAr: 'سداسي',
      groupPluralAr: 'السداسيات',
      groupEn: 'Six',
      groupPluralEn: 'Sixes',
      leaderAr: 'سادوس',
      leaderEn: 'Sixer',
      assistantAr: 'مساعد سادوس',
      assistantEn: 'Second',
      memberAr: 'شبل / زهرة',
      memberEn: 'Cub',
    };
  }
  if (stage === 'rovers') {
    return {
      subdivisionType: 'crew' as const,
      groupAr: 'رهط',
      groupPluralAr: 'الرهوط',
      groupEn: 'Rover Crew',
      groupPluralEn: 'Rover Crews',
      leaderAr: 'رائد رهط',
      leaderEn: 'Crew Leader',
      assistantAr: 'مساعد رائد',
      assistantEn: 'Assistant Crew Leader',
      memberAr: 'جوال',
      memberEn: 'Rover',
    };
  }
  return {
    subdivisionType: 'patrol' as const,
    groupAr: 'طليعة',
    groupPluralAr: 'الطلائع',
    groupEn: 'Patrol',
    groupPluralEn: 'Patrols',
    leaderAr: 'عريف أول',
    leaderEn: 'Patrol Leader',
    assistantAr: 'مساعد عريف',
    assistantEn: 'Assistant PL',
    memberAr: 'كشاف / مرشدة',
    memberEn: 'Scout',
  };
}
