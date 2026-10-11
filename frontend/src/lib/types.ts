export type Gender = 'boys' | 'girls' | 'mixed';

export interface Unit {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  stage_group: string;
  gender: Gender;
  is_leadership: boolean;
  target_grade: string;
}

export interface Patrol {
  id: number;
  unit_id: number;
  name_ar: string;
  name_en: string;
}

export interface Member {
  id: string;
  member_code: string;
  pin?: string; // 4-digit PIN for kid login
  unit_id: number;
  patrol_id?: number | null;
  full_name_ar: string;
  full_name_en?: string;
  date_of_birth: string;
  member_phone?: string;
  father_phone: string;
  mother_phone?: string;
  address_ar: string;
  address_en?: string;
  school_or_college?: string;
  academic_year: string;
  sunday_school_class?: string;
  father_of_confession?: string;
  notes?: string;
  is_active: boolean;
}

export interface MemberUnitHistory {
  id: number;
  member_id: string;
  unit_id: number;
  patrol_id?: number | null;
  year: number;
  stage_name_ar?: string;
  stage_name_en?: string;
  notes?: string;
}

export interface MediaAlbum {
  id: string;
  unit_id: number;
  year: number;
  event_name: string;
  event_name_ar: string;
  cover_image_url: string;
  photo_count: number;
  drive_folder_id: string;
  date: string;
}

export interface MediaItem {
  id: string;
  album_id: string;
  unit_id: number;
  year: number;
  file_name: string;
  title_ar: string;
  title_en: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  drive_file_id?: string;
  date: string;
  tags?: string[];
}

export interface ScoutAttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  percentage: number;
  streak: number;
  honorRank: 'gold' | 'silver' | 'bronze';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface Permission {
  id: number;
  key: string;
  category: 'members' | 'attendance' | 'inventory' | 'media' | 'admin' | 'scout';
  description_en: string;
  description_ar: string;
}

export interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  unit_id?: number | null;
}

export interface UserPermissionOverride {
  id: number;
  user_id: string;
  permission_id: number;
  unit_id?: number | null;
  is_granted: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface AttendanceRecord {
  id?: number;
  session_id: string;
  member_id: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSession {
  id: string;
  unit_id: number;
  session_date: string;
  session_title: string;
  recorded_by: string;
  created_at: string;
}

export interface EquipmentCategory {
  id: number;
  name: string;
}

export interface EquipmentItem {
  id: number;
  category_id: number;
  name: string;
  sku: string;
  total_quantity: number;
  storage_bay: string;
  condition: 'new' | 'good' | 'needs_repair';
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'checked_out' | 'returned';

export interface Booking {
  id: string;
  user_id: string;
  unit_id: number;
  start_date: string;
  end_date: string;
  purpose: string;
  status: BookingStatus;
  approved_by?: string | null;
  created_at: string;
  items: BookingItem[];
}

export interface BookingItem {
  id?: number;
  booking_id: string;
  equipment_id: number;
  quantity: number;
  returned_quantity?: number;
  return_condition_notes?: string;
}

export type MediaQueueStatus = 'queued' | 'uploading' | 'synced' | 'failed';

export interface MediaUploadJob {
  id: string;
  uploaded_by: string;
  unit_id: number;
  local_buffer_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  target_drive_folder_id: string;
  status: MediaQueueStatus;
  retry_count: number;
  error_message?: string;
  drive_file_id?: string;
  web_view_link?: string;
  created_at: string;
  synced_at?: string;
}

export type AuditActionType =
  | 'attendance_saved'
  | 'booking_created'
  | 'booking_approved'
  | 'booking_rejected'
  | 'member_updated'
  | 'member_created'
  | 'permission_overridden'
  | 'media_uploaded'
  | 'user_login'
  | 'leader_team_assigned'
  | 'patrol_assigned'
  | 'leader_created';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role_name?: string;
  unit_id?: number | null;
  unit_name?: string;
  action_type: AuditActionType;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  metadata?: Record<string, any>;
  created_at?: string;
  timestamp?: string;
}

