'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS } from '../../lib/data';
import { MediaUploadJob } from '../../lib/types';
import {
  UploadCloud,
  HardDrive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderTree,
  Video,
  Image as ImageIcon,
  RefreshCw,
  Lock,
  ExternalLink,
  FolderCheck,
  Check,
  FolderPlus,
  Calendar,
  Users,
  Plus,
  X,
  ShieldCheck,
} from 'lucide-react';

interface DriveFolderItem {
  id: string;
  name: string;
}

export default function MediaPortalPage() {
  const { language, t } = useLanguage();
  const { isSuperAdmin, can, currentUser, currentUnit } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [jobs, setJobs] = useState<MediaUploadJob[]>([]);
  const [destinationType, setDestinationType] = useState<'event' | 'team'>('event');
  const [teamFolders, setTeamFolders] = useState<DriveFolderItem[]>([]);
  const [eventFolders, setEventFolders] = useState<DriveFolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(true);

  // Admin Create Event Folder Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [createModalError, setCreateModalError] = useState<string | null>(null);
  const [createModalSuccess, setCreateModalSuccess] = useState<string | null>(null);

  const [isUploadingLive, setIsUploadingLive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [authStatus, setAuthStatus] = useState<{
    isConnected: boolean;
  } | null>(null);

  // 1. Fetch Auth & Folder Structure from backend
  useEffect(() => {
    fetch('/api/auth/google/status')
      .then((res) => res.json())
      .then((data) => setAuthStatus(data))
      .catch((err) => console.error('Failed to check auth status', err));

    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setIsLoadingFolders(true);
      const res = await fetch('/api/media/folders');
      const data = await res.json();

      if (data.success) {
        setTeamFolders(data.teams || []);
        setEventFolders(data.events || []);

        // Initial folder selection: default to Camp if events, or first team
        if (data.events && data.events.length > 0) {
          const campFolder = data.events.find((e: DriveFolderItem) => e.name.toLowerCase() === 'camp');
          setSelectedFolderId(campFolder ? campFolder.id : data.events[0].id);
        } else if (data.teams && data.teams.length > 0) {
          setSelectedFolderId(data.teams[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Drive folders', err);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Sync selected folder ID when switching tabs
  const handleDestinationTypeChange = (type: 'event' | 'team') => {
    setDestinationType(type);
    if (type === 'event' && eventFolders.length > 0) {
      const camp = eventFolders.find((e) => e.name.toLowerCase() === 'camp');
      setSelectedFolderId(camp ? camp.id : eventFolders[0].id);
    } else if (type === 'team' && teamFolders.length > 0) {
      // If user is assigned to a unit, try matching by name
      if (currentUnit) {
        const matched = teamFolders.find((f) =>
          f.name.toLowerCase().includes(currentUnit.name_en.toLowerCase())
        );
        if (matched) {
          setSelectedFolderId(matched.id);
          return;
        }
      }
      setSelectedFolderId(teamFolders[0].id);
    }
  };

  // Admin-only handler for creating a new subfolder in Events
  const handleCreateEventFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    if (!cleanName) return;

    try {
      setIsCreatingFolder(true);
      setCreateModalError(null);
      setCreateModalSuccess(null);

      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: cleanName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create folder');
      }

      const newFolder: DriveFolderItem = data.folder;

      // Update events list
      setEventFolders((prev) => {
        if (prev.some((f) => f.id === newFolder.id)) return prev;
        return [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Switch to events and select the new folder
      setDestinationType('event');
      setSelectedFolderId(newFolder.id);
      setCreateModalSuccess(
        language === 'ar'
          ? `تم إنشاء مجلد "${newFolder.name}" بنجاح في Google Drive`
          : `Folder "${newFolder.name}" created successfully in Google Drive`
      );

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setNewFolderName('');
        setCreateModalSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create event folder', err);
      setCreateModalError(err.message || 'Error creating folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const canUpload = isSuperAdmin || can('media.upload');

  // Currently selected folder metadata
  const currentFoldersList = destinationType === 'event' ? eventFolders : teamFolders;
  const currentSelectedFolder = currentFoldersList.find((f) => f.id === selectedFolderId);
  const currentFolderName = currentSelectedFolder?.name || 'General';

  // Staging buffer metrics (15 GB total volume)
  const totalBufferBytes = 15 * 1024 * 1024 * 1024; // 15 GB
  const currentUsedBytes = jobs
    .filter((j) => j.status === 'queued' || j.status === 'uploading')
    .reduce((sum, j) => sum + j.file_size_bytes, 0);
  const usedGb = (currentUsedBytes / (1024 * 1024 * 1024)).toFixed(2);

  // Handle actual files chosen from file input or drag-and-drop
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    setUploadError(null);
    setIsUploadingLive(true);

    for (const file of files) {
      const tempJobId = `job-live-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Add job to UI in 'uploading' state
      const initialJob: MediaUploadJob = {
        id: tempJobId,
        uploaded_by: currentUser?.id || 'u0',
        unit_id: currentUnit?.id || 1,
        local_buffer_path: `staging_buffer/${file.name}`,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size_bytes: file.size,
        target_drive_folder_id: selectedFolderId || '1qTz_YJSTWGujpovGrqS_0M68JQvpnhmN',
        status: 'uploading',
        retry_count: 0,
        created_at: new Date().toISOString(),
      };

      setJobs((prev) => [initialJob, ...prev]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('destinationType', destinationType);
        formData.append('targetFolderId', selectedFolderId);
        formData.append('targetFolderName', currentFolderName);
        formData.append('year', '2026-2027');

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to upload to Google Drive');
        }

        // Update job to synced with Drive metadata
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? {
                  ...j,
                  status: 'synced',
                  drive_file_id: data.file.id,
                  web_view_link: data.file.webViewLink,
                  target_drive_folder_id: data.file.targetFolderId,
                  synced_at: new Date().toISOString(),
                }
              : j
          )
        );
      } catch (err: any) {
        console.error('Upload failed for file:', file.name, err);
        setUploadError(err.message || 'Upload error');
        setJobs((prev) =>
          prev.map((j) =>
            j.id === tempJobId
              ? {
                  ...j,
                  status: 'failed',
                  error_message: err.message || 'Upload failed',
                }
              : j
          )
        );
      }
    }

    setIsUploadingLive(false);
  };

  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const syncedCount = jobs.filter((j) => j.status === 'synced').length;
  const totalCount = jobs.length;

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-sky-600 dark:text-sky-400" strokeWidth={1.5} />
            <span>{t('media_upload_title')}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {language === 'ar'
              ? 'معمارية الرفع الآمن: التخزين المؤقت المحلي 15 GB والرفع الفعلي المباشر إلى مجلدات Google Drive'
              : 'Two-stage media pipeline: Fast 15 GB local staging buffer streaming directly into Google Drive folders.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Central Backend Cloud Archive Status Badge */}
          {authStatus?.isConnected ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ar' ? 'الأرشيف السحابي المركزي متصل' : 'Central Scouts Cloud Archive Connected'}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 text-xs font-medium">
              <span>{language === 'ar' ? 'الأرشيف السحابي قيد الإعداد' : 'Cloud Archive Initializing...'}</span>
            </div>
          )}

          {/* Direct Link to Google Drive Root Folder */}
          <a
            href="https://drive.google.com/drive/folders/16J2dvQglurhedNtC6BdwOek6bNcLiAMn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <FolderCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'مجلد Drive' : 'Open Drive Folder'}</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>
        </div>
      </div>

      {/* Target Destination Structure Selector */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>{language === 'ar' ? 'وجهة رفع الوسائط في Google Drive' : 'Drive Target Folder Destination'}</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {language === 'ar'
                ? 'اختر مجلد الفريق أو مجلد الفعاليات الكشفية لرفع الوسائط إليه'
                : 'Select either a dedicated Team Folder or an Event Folder to direct your uploads.'}
            </p>
          </div>

          {/* Segmented Control: Events vs Team Folders */}
          <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleDestinationTypeChange('event')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                destinationType === 'event'
                  ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'فعاليات (Events)' : 'Events Folder'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {eventFolders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleDestinationTypeChange('team')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                destinationType === 'team'
                  ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الفرق (12 Teams)' : 'Team Folders'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {teamFolders.length}
              </span>
            </button>
          </div>
        </div>

        {/* Folder Selection Controls & Admin Option */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className={isSuperAdmin && destinationType === 'event' ? 'md:col-span-8' : 'md:col-span-12'}>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {destinationType === 'event'
                ? language === 'ar'
                  ? 'اختر مجلد الفعالية المستهدف (داخل /2026-2027/Events/)'
                  : 'Select Target Event Folder (inside /2026-2027/Events/)'
                : language === 'ar'
                ? 'اختر مجلد الفريق المستهدف (داخل /2026-2027/)'
                : 'Select Target Team Folder (inside /2026-2027/)'}
            </label>

            {isLoadingFolders ? (
              <div className="w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2.5 text-zinc-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                <span>{language === 'ar' ? 'جارٍ تحميل قائمة المجلدات من Drive...' : 'Loading Google Drive folders...'}</span>
              </div>
            ) : (
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {currentFoldersList.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    📁 {folder.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Admin Only: Create New Folder in Events */}
          {isSuperAdmin && destinationType === 'event' && (
            <div className="md:col-span-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 border border-sky-300 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{language === 'ar' ? '＋ إنشاء مجلد فعالية جديد' : '+ New Event Folder'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-200/80 dark:bg-sky-900 text-sky-900 dark:text-sky-300 font-bold uppercase tracking-wider">
                  Admin
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Create Event Folder Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <span>{language === 'ar' ? 'إنشاء مجلد فعالية جديد' : 'Create New Event Folder'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                      Admin Only
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === 'ar'
                      ? 'سيتم إنشاء المجلد مباشرة داخل مجلد الأحداث Events في Google Drive'
                      : 'Folder will be created directly under /2026-2027/Events/ in Drive'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCreateModalError(null);
                  setCreateModalSuccess(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEventFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'اسم مجلد الفعالية الجديد' : 'New Event Folder Name'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Winter Camp 2027, Marathon, etc."
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {createModalError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{createModalError}</span>
                </div>
              )}

              {createModalSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{createModalSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreatingFolder}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isCreatingFolder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'ar' ? 'جارٍ الإنشاء على Drive...' : 'Creating on Drive...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إنشاء المجلد' : 'Create Folder'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Progress Bar & Live Drive Destination Readout */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {language === 'ar' ? 'مزامنة قرص التخزين المؤقت المحلي إلى Google Drive' : 'Staging Buffer & Google Drive Pipeline'}
            </span>
          </div>

          <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {syncedCount} / {totalCount} files synced &bull; {usedGb} GB / 15.0 GB &bull; Live Drive API v3
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded overflow-hidden">
          <div
            className="h-full transition-all duration-300 bg-emerald-600"
            style={{ width: totalCount > 0 ? `${(syncedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>

        {/* Live Drive Destination Path Readout */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5 truncate">
            <FolderTree className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
            <span className="text-zinc-400">Drive Destination:</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold truncate">
              {destinationType === 'event'
                ? `/Scouts System/2026-2027/Events/${currentFolderName}/`
                : `/Scouts System/2026-2027/${currentFolderName}/`}
            </span>
            {selectedFolderId && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                (ID: {selectedFolderId.substring(0, 8)}...)
              </span>
            )}
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 shrink-0 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline text-emerald-600" />
            {language === 'ar' ? 'أرشيف الفوج السحابي جاهز' : 'Drive Archive Ready'}
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {canUpload ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFiles}
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-sky-500 dark:hover:border-sky-400 bg-zinc-50/60 dark:bg-zinc-900/40 rounded-xl text-center space-y-3 cursor-pointer transition-all hover:bg-sky-50/20"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            {isUploadingLive ? (
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
            ) : (
              <UploadCloud className="w-6 h-6" strokeWidth={1.5} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {isUploadingLive
                ? language === 'ar'
                  ? 'جارٍ رفع الملفات إلى Google Drive...'
                  : 'Streaming files to Google Drive...'
                : t('drag_drop_media')}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              {language === 'ar'
                ? `الملفات المختارة سترفع مباشرة إلى مجلد: ${currentFolderName}`
                : `Files selected will upload directly into Google Drive folder: ${currentFolderName}`}
            </p>
          </div>
          <div className="flex items-center justify-center pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={isUploadingLive}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{language === 'ar' ? 'اختيار ملفات من الجهاز' : 'Browse Local Files'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-amber-600">
            <Lock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {language === 'ar' ? 'أرشيف الوسائط (وضع الاطلاع فقط)' : 'Media Archive (View-Only Mode)'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            {language === 'ar'
              ? 'يمكنك استعراض ومتابعة طابور الوسائط وأرشيف Google Drive. رفع ملفات جديدة مخصص لمسؤول الإعلام ومدير النظام.'
              : 'You have view access to Drive media archives. Uploading new files is reserved for Media Officers and System Admin.'}
          </p>
        </div>
      )}

      {/* Media Upload Queue Table */}
      <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
            {language === 'ar' ? 'طابور معالجة الوسائط (media_upload_queue)' : 'Media Upload Queue'}
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {jobs.length} {language === 'ar' ? 'ملفات' : 'files'}
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400">
              <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {language === 'ar' ? 'لا توجد وسائط مرفوعة في الجلسة الحالية' : 'No active media uploads'}
            </div>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              {language === 'ar'
                ? 'اختر أو اسحب وأفلت صور وفيديوهات حقيقية للرفع الفعلي المباشر إلى Google Drive'
                : 'Select or drag & drop real photos/videos above to upload directly to Google Drive.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {jobs.map((job) => {
              const isVideo = job.mime_type.includes('video');
              const sizeMb = (job.file_size_bytes / (1024 * 1024)).toFixed(1);

              return (
                <div
                  key={job.id}
                  className="p-3 sm:px-4 hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                      {isVideo ? <Video className="w-4 h-4" strokeWidth={1.5} /> : <ImageIcon className="w-4 h-4" strokeWidth={1.5} />}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{job.file_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="tabular-nums">{sizeMb} MB</span>
                        <span>&bull;</span>
                        <span>{job.mime_type}</span>
                        {job.drive_file_id && (
                          <>
                            <span>&bull;</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium font-mono">
                              Drive ID: {job.drive_file_id}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Direct Link to Google Drive File */}
                    {job.web_view_link && (
                      <a
                        href={job.web_view_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Drive View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* Queue Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 border ${
                        job.status === 'synced'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : job.status === 'uploading'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                          : job.status === 'queued'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                      }`}
                    >
                      {job.status === 'synced' && <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />}
                      {job.status === 'uploading' && <RefreshCw className="w-3 h-3 animate-spin" strokeWidth={1.5} />}
                      {job.status === 'queued' && <Clock className="w-3 h-3" strokeWidth={1.5} />}
                      {job.status === 'failed' && <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />}
                      <span>{t(job.status as any)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

