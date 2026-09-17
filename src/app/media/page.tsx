'use client';

import React, { useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { INITIAL_MEDIA_JOBS, INITIAL_UNITS } from '../../lib/data';
import { MediaUploadJob, MediaQueueStatus } from '../../lib/types';
import {
  UploadCloud,
  HardDrive,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderTree,
  FileText,
  Video,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function MediaPortalPage() {
  const { language, t } = useLanguage();

  const [jobs, setJobs] = useState<MediaUploadJob[]>(INITIAL_MEDIA_JOBS);
  const [selectedUnitId, setSelectedUnitId] = useState<number>(5);
  const [eventName, setEventName] = useState<string>('Campfire_October_2026');
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  // Staging buffer metrics (15 GB total volume)
  const totalBufferBytes = 15 * 1024 * 1024 * 1024; // 15 GB
  const currentUsedBytes = jobs
    .filter((j) => j.status === 'queued' || j.status === 'uploading')
    .reduce((sum, j) => sum + j.file_size_bytes, 0);
  const usedGb = (currentUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const bufferPercent = Math.min(100, Math.round((currentUsedBytes / totalBufferBytes) * 100));

  // Drag and drop mock file drop
  const handleDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    simulateFileUpload([
      { name: 'IMG_4412_Parade.JPG', size: 12400000, type: 'image/jpeg' },
      { name: 'Camp_Closing_Speech.mov', size: 450000000, type: 'video/quicktime' },
    ]);
  };

  const simulateFileUpload = (
    files: { name: string; size: number; type: string }[]
  ) => {
    const newJobs: MediaUploadJob[] = files.map((f) => ({
      id: `job-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      uploaded_by: 'u5',
      unit_id: selectedUnitId,
      local_buffer_path: `D:/ScoutsBuffer/${f.name}`,
      file_name: f.name,
      mime_type: f.type,
      file_size_bytes: f.size,
      target_drive_folder_id: '1aB2c3D4e5F6_ScoutsArchive2026',
      status: 'queued',
      retry_count: 0,
      created_at: new Date().toISOString(),
    }));

    setJobs((prev) => [...newJobs, ...prev]);
  };

  // Trigger worker sync simulation
  const handleRunWorkerSync = () => {
    setIsSimulatingUpload(true);
    // Mark queued -> uploading -> synced
    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) => (j.status === 'queued' ? { ...j, status: 'uploading' as MediaQueueStatus } : j))
      );

      setTimeout(() => {
        setJobs((prev) =>
          prev.map((j) =>
            j.status === 'uploading'
              ? {
                  ...j,
                  status: 'synced' as MediaQueueStatus,
                  drive_file_id: `1drive_${Date.now().toString(36)}`,
                  synced_at: new Date().toISOString(),
                }
              : j
          )
        );
        setIsSimulatingUpload(false);
      }, 2000);
    }, 1500);
  };

  const syncedCount = jobs.filter((j) => j.status === 'synced').length;
  const totalCount = jobs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-sky-600 dark:text-sky-400" strokeWidth={1.5} />
            <span>{t('media_upload_title')}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {language === 'ar'
              ? 'معمارية الرفع الآمن: التخزين المحلي المؤقت في قرص 15 GB ثم الرفع غير المتزامن إلى Google Drive v3'
              : 'Two-stage media pipeline: Fast 15 GB local staging disk buffer drained by background Drive worker.'}
          </p>
        </div>

        <button
          onClick={handleRunWorkerSync}
          disabled={isSimulatingUpload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulatingUpload ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          <span>{language === 'ar' ? 'تشغيل معالج المزامنة (Worker)' : 'Trigger Worker Sync'}</span>
        </button>
      </div>

      {/* Low-Profile Progress Bar & Micro-Status Readout (Directive 4.D) */}
      <div className="bg-white dark:bg-[#121214] p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              {language === 'ar' ? 'مزامنة قرص التخزين المؤقت المحلي إلى Google Drive' : 'Staging Buffer & Google Drive Pipeline'}
            </span>
          </div>

          {/* Micro-status readout in font-mono */}
          <div className="font-mono text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
            {syncedCount} / {totalCount} files synced &bull; {usedGb} GB / 15.0 GB &bull; Rate: 1.4 MB/s
          </div>
        </div>

        {/* Low-Profile 3px Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isSimulatingUpload ? 'bg-emerald-700 animate-pulse' : 'bg-zinc-900 dark:bg-zinc-100'
            }`}
            style={{ width: `${Math.max(3, (syncedCount / Math.max(1, totalCount)) * 100)}%` }}
          />
        </div>

        {/* Archive Path Readout */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-1.5 truncate">
            <FolderTree className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={1.5} />
            <span className="text-zinc-400">Drive Path:</span>
            <span className="text-zinc-700 dark:text-zinc-300 truncate">
              /ScoutsArchive/2026/{INITIAL_UNITS.find((u) => u.id === selectedUnitId)?.name_en}/{eventName}/
            </span>
          </div>
          <span className="text-emerald-700 dark:text-emerald-400 shrink-0">Resumable Chunked Stream &bull; Auto-unlink Buffer</span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropFiles}
        onClick={() => {
          simulateFileUpload([
            { name: `HighRes_Camp_Photo_${Date.now()}.cr3`, size: 38200000, type: 'image/x-canon-cr3' },
          ]);
        }}
        className="p-6 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-lg text-center space-y-2 cursor-pointer transition-colors"
      >
        <div className="w-10 h-10 mx-auto rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
          <UploadCloud className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{t('drag_drop_media')}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {language === 'ar'
              ? 'يدعم صور RAW عالية الدقة (CR3, ARW, NEF) وفيديوهات المخيمات 4K (MP4, MOV)'
              : 'Supports high-res RAW photos (CR3, ARW, NEF) and 4K camp videos up to multi-gigabytes.'}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-medium transition-colors"
        >
          <span>{language === 'ar' ? 'إضافة ملفات تجريبية للمخزن' : 'Simulate File Drop'}</span>
        </button>
      </div>

      {/* Media Upload Queue Table (Directive 4.A) */}
      <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
            {language === 'ar' ? 'طابور معالجة الوسائط (media_upload_queue)' : 'Media Upload Queue'}
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            {jobs.length} {language === 'ar' ? 'ملفات' : 'files'}
          </span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {jobs.map((job) => {
            const isVideo = job.mime_type.includes('video');
            const sizeMb = (job.file_size_bytes / (1024 * 1024)).toFixed(1);

            return (
              <div key={job.id} className="p-3 sm:px-4 hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                    {isVideo ? <Video className="w-4 h-4" strokeWidth={1.5} /> : <ImageIcon className="w-4 h-4" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">{job.file_name}</div>
                    <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="tabular-nums">{sizeMb} MB</span>
                      <span>&bull;</span>
                      <span>{job.mime_type}</span>
                      {job.drive_file_id && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium font-mono">Drive: {job.drive_file_id}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Queue Status Badge */}
                <div>
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
                    <span>{t(job.status as any)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
