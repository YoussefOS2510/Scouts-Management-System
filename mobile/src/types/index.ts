export type Language = 'ar' | 'en';
export type GenderType = 'boys' | 'girls' | 'mixed';
export type UnitStage = 'buds' | 'cubs' | 'scouts' | 'venturers' | 'rovers';

export interface Unit {
  id: string;
  name_ar: string;
  name_en: string;
  stage: UnitStage;
  gender: GenderType;
  age_range: string;
  member_count: number;
  avg_attendance: number;
}

export interface Patrol {
  id: string;
  unit_id: string;
  name_ar: string;
  name_en: string;
  subdivision_type: 'six' | 'patrol' | 'crew';
  leader_member_id?: string;
  assistant_member_id?: string;
  emblem_icon?: string;
}

export interface User {
  id: string;
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string;
  title_ar: string;
  title_en: string;
  avatar_initials: string;
  is_active: boolean;
}

export interface Role {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_system: boolean;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  unit_id?: string;
  is_global: boolean;
}

export interface Permission {
  id: string;
  key: string;
  module: 'units' | 'attendance' | 'members' | 'media' | 'admin';
  name_ar: string;
  name_en: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserPermissionOverride {
  id: string;
  user_id: string;
  permission_id: string;
  unit_id?: string;
  grant_type: 'allow' | 'deny';
  reason?: string;
}

export interface Member {
  id: string;
  scout_code?: string;
  full_name_ar: string;
  full_name_en: string;
  unit_id: string;
  patrol_id?: string;
  patrol_role?: 'leader' | 'assistant' | 'member';
  phone_personal: string;
  phone_guardian: string;
  dob: string;
  school_or_university: string;
  address: string;
  medical_notes: string;
  attendance_rate: number;
  unexcused_absences_count: number;
  consecutive_absences: number;
  has_missing_data: boolean;
  missing_fields: string[];
  join_year?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceSession {
  id: string;
  unit_id: string;
  title_ar: string;
  title_en: string;
  date: string;
  event_type: 'weekly_meeting' | 'camp' | 'service' | 'outdoors';
  created_by: string;
  records: Record<string, AttendanceStatus>;
  notes?: Record<string, string>;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_name_ar: string;
  actor_name_en: string;
  action_type: string;
  target_label_ar: string;
  target_label_en: string;
  unit_id?: string;
  created_at: string;
}

export interface MediaAlbum {
  id: string;
  unit_id: string;
  title_ar: string;
  title_en: string;
  date: string;
  cover_url: string;
  item_count: number;
}

export interface MediaItem {
  id: string;
  album_id: string;
  url: string;
  caption_ar: string;
  caption_en: string;
  uploaded_by: string;
  created_at: string;
}
