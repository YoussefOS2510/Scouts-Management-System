'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { INITIAL_UNITS } from '@/lib/data';
import { getSubdivisionTerms } from '@/lib/scout-terms';
import TamamSheet from '@/components/TamamSheet';
import { Printer, ArrowRight, Calendar, Users, FileDown } from 'lucide-react';

function TamamPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatrolId = searchParams.get('patrolId') ? Number(searchParams.get('patrolId')) : null;
  const initialUnitId = searchParams.get('unitId') ? Number(searchParams.get('unitId')) : null;

  const { members, patrols } = useAuth();

  // Find target patrol & unit
  const activePatrol = useMemo(() => {
    if (initialPatrolId) {
      return patrols.find((p) => p.id === initialPatrolId) || null;
    }
    return null;
  }, [patrols, initialPatrolId]);

  const targetUnitId = activePatrol?.unit_id || initialUnitId || 1;
  const unit = INITIAL_UNITS.find((u) => u.id === targetUnitId);

  // State controls for date & day
  const [selectedPatrolId, setSelectedPatrolId] = useState<number | 'all'>(initialPatrolId || 'all');
  const [dayName, setDayName] = useState<string>('الجمعة');
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    // Default to the next upcoming Friday or today if Friday
    const day = d.getDay();
    const diff = (5 - day + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  });

  const unitPatrols = useMemo(() => {
    return patrols
      .filter((p) => p.unit_id === targetUnitId)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }, [patrols, targetUnitId]);

  const patrolsToRender = useMemo(() => {
    if (selectedPatrolId === 'all') {
      return unitPatrols;
    }
    const found = unitPatrols.find((p) => p.id === selectedPatrolId);
    return found ? [found] : unitPatrols;
  }, [unitPatrols, selectedPatrolId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      
      {/* Non-Printable Floating Toolbar */}
      <div className="print:hidden sticky top-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Back link & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/members"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لدليل الأعضاء</span>
            </Link>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>كشف تمام الحضور والغياب (Tamam Sheet)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#0B57D0] border border-blue-200 dark:border-blue-900">
                  {unit?.name_ar}
                </span>
              </h1>
              <p className="text-[11px] text-zinc-500">
                قالب التمام الكشفي المعتمد جاهز للطباعة أو الحفظ كملف PDF
              </p>
            </div>
          </div>

          {/* Controls: Patrol Filter, Day, Date, Print Button */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Patrol / Six Selector */}
            {(() => {
              const uTerms = getSubdivisionTerms(targetUnitId);
              return (
                <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <select
                    value={selectedPatrolId}
                    onChange={(e) => setSelectedPatrolId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all">جميع {uTerms.pluralAr} المرحلة ({unitPatrols.length})</option>
                    {unitPatrols.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_ar} ({p.name_en || uTerms.singularEn})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

            {/* Day Selector */}
            <select
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="الجمعة">يوم الجمعة</option>
              <option value="الخميس">يوم الخميس</option>
              <option value="السبت">يوم السبت</option>
              <option value="الأحد">يوم الأحد</option>
            </select>

            {/* Date Picker */}
            <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-transparent text-xs font-mono focus:outline-none cursor-pointer"
              />
            </div>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Paper Sheets Preview */}
      <div className="py-6 sm:py-8 px-2 sm:px-4 max-w-5xl mx-auto space-y-8 print:p-0 print:m-0 print:space-y-0">
        {patrolsToRender.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <p className="text-sm text-zinc-500">لا توجد طلائع مسجلة لهذه المرحلة حالياً.</p>
          </div>
        ) : (
          patrolsToRender.map((patrol) => {
            const pMembers = members.filter((m) => m.patrol_id === patrol.id);

            return (
              <div
                key={patrol.id}
                className="bg-white rounded-xl shadow-lg border border-zinc-200 print:border-none print:shadow-none print:rounded-none overflow-hidden print:break-after-page"
              >
                <TamamSheet
                  unitNameAr={unit?.name_ar}
                  unitNameEn={unit?.name_en}
                  patrolNameAr={patrol.name_ar}
                  patrolNameEn={patrol.name_en}
                  members={pMembers}
                  dayName={dayName}
                  dateStr={customDate.replace(/-/g, ' / ')}
                  minRows={8}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Print styles injection */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:break-after-page {
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}

export default function TamamPrintPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">جاري تجهيز كشوف التمام...</div>}>
      <TamamPrintContent />
    </Suspense>
  );
}

