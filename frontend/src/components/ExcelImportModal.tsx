'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck,
  Download,
  AlertCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  transliterateArabicName,
  translateAddress,
  translateAcademicYear,
  matchUnitId,
} from '@/lib/transliteration';
import { INITIAL_UNITS } from '@/lib/data';

interface ParsedScout {
  member_code: string;
  full_name_ar: string;
  full_name_en: string;
  unit_name: string;
  unit_id: number | null;
  academic_year: string;
  academic_year_en: string;
  member_phone: string;
  date_of_birth: string;
  address_ar: string;
  address_en: string;
  father_phone: string;
  mother_phone: string;
  school_or_college: string;
  school_or_college_en: string;
  sunday_school_class: string;
  sunday_school_class_en: string;
  father_of_confession: string;
  notes: string;
  has_missing_data: boolean;
  missing_fields: string[];
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
}: ExcelImportModalProps) {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [parsedScouts, setParsedScouts] = useState<ParsedScout[]>([]);
  const [filterView, setFilterView] = useState<'all' | 'incomplete' | 'complete'>('all');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    message: string;
    insertedCount: number;
    updatedCount: number;
  } | null>(null);

  if (!isOpen) return null;

  // Clean and parse cell value
  const cleanVal = (val: any): string => {
    if (val === undefined || val === null) return '';
    return String(val).trim();
  };

  // Format date cell from excel
  const formatDateVal = (raw: any): string => {
    if (!raw) return '';
    if (raw instanceof Date && !isNaN(raw.getTime())) {
      return raw.toISOString().split('T')[0];
    }
    const str = String(raw).trim();
    // Excel serial number
    if (/^\d{4,5}$/.test(str)) {
      const serial = parseInt(str, 10);
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }
    // Match DD/MM/YYYY or DD-MM-YYYY
    const dmy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    return str;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rows || rows.length < 2) {
          setErrorMessage(
            language === 'ar'
              ? 'الملف فارغ أو لا يحتوي على صفوف بيانات كافية'
              : 'File is empty or contains no data rows'
          );
          setIsProcessing(false);
          return;
        }

        // Header mapping
        const headerRow = rows[0].map((h) => cleanVal(h).toLowerCase());

        const findColIdx = (aliases: string[]): number => {
          return headerRow.findIndex((h) =>
            aliases.some((alias) => h === alias.toLowerCase() || h.includes(alias.toLowerCase()))
          );
        };

        const idxNotes = findColIdx(['notes', 'ملاحظات']);
        const idxCode = findColIdx(['الكود', 'كود', 'code', 'member_code']);
        const idxName = findColIdx(['الاسم', 'اسم', 'name', 'full_name']);
        const idxTeam = findColIdx(['اسم الفريق', 'الفريق', 'الوحدة', 'team', 'unit']);
        const idxAcademicYear = findColIdx(['السنة الدراسية', 'سنة دراسية', 'academic_year', 'grade']);
        const idxMobile = findColIdx(['رقم الموبايل', 'موبايل', 'mobile', 'member_phone']);
        const idxDob = findColIdx(['تاريخ الميلاد', 'ميلاد', 'dob', 'birth']);
        const idxAddress = findColIdx(['العنوان بالعربى', 'العنوان', 'address']);
        const idxFatherPhone = findColIdx(['رقم الأب', 'رقم الاب', 'هاتف الأب', 'father_phone', 'father']);
        const idxMotherPhone = findColIdx(['رقم الأم', 'رقم الام', 'هاتف الأم', 'mother_phone', 'mother']);
        const idxSchool = findColIdx(['Name of School / College ?', 'school', 'المدرسة', 'الكلية']);
        const idxSundaySchool = findColIdx(['اسم فصل مدارس الاحد (بالعربى)', 'مدارس الاحد', 'مدارس الأحد', 'فصل']);
        const idxConfessionFather = findColIdx(['اسم اب الاعتراف', 'اب الاعتراف', 'أب الاعتراف', 'confession']);

        const results: ParsedScout[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const rawName = idxName !== -1 ? cleanVal(row[idxName]) : '';
          // If no name found anywhere on the row, skip empty row
          if (!rawName) continue;

          const rawCode = idxCode !== -1 ? cleanVal(row[idxCode]) : '';
          const rawTeam = idxTeam !== -1 ? cleanVal(row[idxTeam]) : '';
          const rawAcademic = idxAcademicYear !== -1 ? cleanVal(row[idxAcademicYear]) : '';
          const rawMobile = idxMobile !== -1 ? cleanVal(row[idxMobile]) : '';
          const rawDob = idxDob !== -1 ? formatDateVal(row[idxDob]) : '';
          const rawAddress = idxAddress !== -1 ? cleanVal(row[idxAddress]) : '';
          const rawFather = idxFatherPhone !== -1 ? cleanVal(row[idxFatherPhone]) : '';
          const rawMother = idxMotherPhone !== -1 ? cleanVal(row[idxMotherPhone]) : '';
          const rawSchool = idxSchool !== -1 ? cleanVal(row[idxSchool]) : '';
          const rawSundaySchool = idxSundaySchool !== -1 ? cleanVal(row[idxSundaySchool]) : '';
          const rawConfession = idxConfessionFather !== -1 ? cleanVal(row[idxConfessionFather]) : '';
          const rawNotes = idxNotes !== -1 ? cleanVal(row[idxNotes]) : '';

          // Match unit
          const unitId = matchUnitId(rawTeam);

          // Transliterate & Translate
          const nameEn = transliterateArabicName(rawName);
          const addressEn = translateAddress(rawAddress);
          const academicYearEn = translateAcademicYear(rawAcademic);

          // Detect missing fields
          const missing: string[] = [];
          if (!rawName) missing.push(language === 'ar' ? 'الاسم' : 'Name');
          if (!unitId && !rawTeam) missing.push(language === 'ar' ? 'اسم الفريق' : 'Team');
          if (!rawDob) missing.push(language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth');
          if (!rawAcademic) missing.push(language === 'ar' ? 'السنة الدراسية' : 'Academic Year');
          if (!rawFather) missing.push(language === 'ar' ? 'رقم الأب' : 'Father Phone');
          if (!rawMother) missing.push(language === 'ar' ? 'رقم الأم' : 'Mother Phone');
          if (!rawAddress) missing.push(language === 'ar' ? 'العنوان' : 'Address');
          if (!rawConfession) missing.push(language === 'ar' ? 'اسم أب الاعتراف' : 'Father of Confession');
          if (!rawSundaySchool) missing.push(language === 'ar' ? 'مدارس الأحد' : 'Sunday School Class');
          if (!rawSchool) missing.push(language === 'ar' ? 'المدرسة / الكلية' : 'School/College');

          results.push({
            member_code: rawCode,
            full_name_ar: rawName,
            full_name_en: nameEn,
            unit_name: rawTeam || (unitId ? INITIAL_UNITS.find((u) => u.id === unitId)?.name_ar || '' : ''),
            unit_id: unitId,
            academic_year: rawAcademic,
            academic_year_en: academicYearEn,
            member_phone: rawMobile,
            date_of_birth: rawDob,
            address_ar: rawAddress,
            address_en: addressEn,
            father_phone: rawFather,
            mother_phone: rawMother,
            school_or_college: rawSchool,
            school_or_college_en: rawSchool,
            sunday_school_class: rawSundaySchool,
            sunday_school_class_en: rawSundaySchool,
            father_of_confession: rawConfession,
            notes: rawNotes,
            has_missing_data: missing.length > 0,
            missing_fields: missing,
          });
        }

        setParsedScouts(results);
        setIsProcessing(false);
      } catch (err: any) {
        console.error('Error parsing excel:', err);
        setErrorMessage(
          language === 'ar'
            ? `حدث خطأ أثناء قراءة الملف: ${err.message || 'صيغة غير صالحة'}`
            : `Error parsing file: ${err.message || 'Invalid format'}`
        );
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (parsedScouts.length === 0) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/members/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: parsedScouts }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessResult({
          message: data.message,
          insertedCount: data.insertedCount,
          updatedCount: data.updatedCount,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      } else {
        setErrorMessage(data.error || 'Failed to import scouts');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred during import');
    } finally {
      setIsUploading(false);
    }
  };

  // Download official excel template
  const handleDownloadTemplate = () => {
    const headers = [
      'Notes',
      'الكود',
      'الاسم',
      'اسم الفريق',
      'السنة الدراسية',
      'رقم الموبايل',
      'تاريخ الميلاد',
      'العنوان بالعربى',
      'رقم الأب',
      'رقم الأم',
      'Name of School / College ?',
      'اسم فصل مدارس الاحد (بالعربى)',
      'اسم اب الاعتراف',
    ];

    const sampleRow = [
      'ملتزم ومشارك في الأنشطة',
      'SCT-2026-0001',
      'مينا سمير رمزي',
      'كشافة A',
      'أولى إعدادي',
      '01200000001',
      '2012-05-15',
      'الرحاب - مجموعة 120 عمارة 5 شقة 2',
      '01000000001',
      '01100000002',
      'Rehab Language School',
      'فصل مارمرقس',
      'أبونا أنطونيوس',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scouts');
    XLSX.writeFile(wb, 'SMSR_Scouts_Import_Template.xlsx');
  };

  const incompleteCount = parsedScouts.filter((s) => s.has_missing_data).length;
  const completeCount = parsedScouts.length - incompleteCount;

  const displayedScouts = parsedScouts.filter((s) => {
    if (filterView === 'incomplete') return s.has_missing_data;
    if (filterView === 'complete') return !s.has_missing_data;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'استيراد بيانات الكشافة من ملف إكسيل' : 'Import Scouts from Excel Sheet'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {language === 'ar'
                  ? 'رفع ملف الإكسيل مع الترجمة الآلية للأعمدة الإنجليزية، ومتابعة الحقول الناقصة.'
                  : 'Upload scouts excel with automatic English translation and missing field tracking.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone / Template Download */}
        {parsedScouts.length === 0 ? (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-zinc-50 dark:bg-zinc-900/40 hover:bg-emerald-50/20 transition-all flex flex-col items-center justify-center space-y-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {language === 'ar' ? 'اضغط لاختيار ملف الإكسيل أو اسحبه هنا' : 'Click to select or drag and drop Excel file'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {language === 'ar' ? 'يدعم ملفات بصيغة (.xlsx, .xls, .csv)' : 'Supports (.xlsx, .xls, .csv) files'}
                </p>
              </div>
            </div>

            {/* Template Download Card */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {language === 'ar' ? 'تحميل نموذج الإكسيل الرسمي للأفواج' : 'Download Official SMSR Excel Template'}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {language === 'ar'
                      ? 'يحتوي على الأعمدة الـ 13 المعتمدة مع مثال توضيحي'
                      : 'Contains the 13 approved columns with sample row'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تحميل النموذج' : 'Download Template'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview and Confirmation Table */
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Summary Statistics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
              <div
                onClick={() => setFilterView('all')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  filterView === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="text-[11px] font-medium opacity-80">
                  {language === 'ar' ? 'إجمالي السجلات المقروءة' : 'Total Read Rows'}
                </div>
                <div className="text-lg font-black">{parsedScouts.length}</div>
              </div>

              <div
                onClick={() => setFilterView('complete')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  filterView === 'complete'
                    ? 'bg-emerald-700 text-white border-transparent shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'سجلات كاملة البيانات' : 'Complete Profiles'}</span>
                </div>
                <div className="text-lg font-black">{completeCount}</div>
              </div>

              <div
                onClick={() => setFilterView('incomplete')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  filterView === 'incomplete'
                    ? 'bg-amber-600 text-white border-transparent shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'سجلات بها بيانات ناقصة' : 'Incomplete (Marked)'}</span>
                </div>
                <div className="text-lg font-black">{incompleteCount}</div>
              </div>
            </div>

            {/* Note alert */}
            {incompleteCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  {language === 'ar'
                    ? `تم تمييز ${incompleteCount} كشاف ببيانات ناقصة (مثل هاتف الوالدين أو أب الاعتراف). سيتم إضافتهم جميعاً للنظام بشكل طبيعي مع وضع علامة تنبيه عليهم.`
                    : `${incompleteCount} scouts have missing fields. They will be added normally and marked with a warning badge for follow-up.`}
                </span>
              </div>
            )}

            {/* Preview Table */}
            <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[220px]">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'الاسم (مترجم EN)' : 'Name (EN Transliterated)'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'الفريق' : 'Team'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'السنة الدراسية' : 'Grade'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'هاتف الأب' : 'Father Phone'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'أب الاعتراف' : 'Confession Father'}</th>
                    <th className="p-2.5">{language === 'ar' ? 'الحقول الناقصة' : 'Missing Fields'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-[11px]">
                  {displayedScouts.slice(0, 100).map((s, idx) => (
                    <tr
                      key={idx}
                      className={
                        s.has_missing_data
                          ? 'bg-amber-50/40 dark:bg-amber-950/15 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                      }
                    >
                      <td className="p-2.5 text-zinc-400">{idx + 1}</td>
                      <td className="p-2.5 font-sans">
                        {s.has_missing_data ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold font-mono">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {language === 'ar' ? 'ناقص' : 'Incomplete'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold font-mono">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {language === 'ar' ? 'مكتمل' : 'Complete'}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-sans font-bold text-zinc-900 dark:text-zinc-100">{s.full_name_ar}</td>
                      <td className="p-2.5 font-sans text-sky-700 dark:text-sky-300">{s.full_name_en}</td>
                      <td className="p-2.5 font-sans">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px]">
                          {s.unit_name || (language === 'ar' ? 'افتراضي: كشافة A' : 'Default: Kashafa A')}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans">{s.academic_year || '-'}</td>
                      <td className="p-2.5">{s.father_phone || '-'}</td>
                      <td className="p-2.5 font-sans">{s.father_of_confession || '-'}</td>
                      <td className="p-2.5 font-sans text-amber-700 dark:text-amber-400">
                        {s.has_missing_data ? s.missing_fields.join('، ') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setParsedScouts([]);
                  setFileName('');
                  setFilterView('all');
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'اختيار ملف آخر' : 'Choose Another File'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>
                    {isUploading
                      ? language === 'ar'
                        ? 'جاري حفظ وترجمة البيانات...'
                        : 'Importing & Translating...'
                      : language === 'ar'
                      ? `تأكيد واستيراد (${parsedScouts.length}) كشاف`
                      : `Confirm & Import (${parsedScouts.length}) Scouts`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">{successResult.message}</p>
              <p className="text-[11px] opacity-80">
                {language === 'ar'
                  ? 'تم تحديث قاعدة البيانات وقائمة الكشافة بنجاح.'
                  : 'Database and members directory updated successfully.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
