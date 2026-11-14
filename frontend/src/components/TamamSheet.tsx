'use client';

import React from 'react';

export interface TamamMember {
  id?: string;
  full_name_ar: string;
  member_code?: string;
  rank?: string;
}

export interface TamamSheetProps {
  unitNameAr?: string;
  unitNameEn?: string;
  patrolNameAr: string;
  patrolNameEn?: string;
  members: TamamMember[];
  dayName?: string; // e.g. "الجمعة" or "الخميس"
  dateStr?: string; // e.g. "2026 / 11 / 06"
  minRows?: number;
}

export default function TamamSheet({
  unitNameAr,
  patrolNameAr,
  members,
  dayName = 'الجمعة',
  dateStr,
  minRows = 8,
}: TamamSheetProps) {
  // Pad table with empty rows if fewer than minRows
  const totalRows = Math.max(members.length, minRows);
  const rows = Array.from({ length: totalRows }, (_, idx) => members[idx] || null);

  // Default role labels matching the official template: 1: CP, 2: CG, 3: 3rd
  const getRank = (idx: number, member: TamamMember | null) => {
    if (member?.rank) return member.rank;
    if (idx === 0) return 'CP';
    if (idx === 1) return 'CG';
    if (idx === 2) return '3rd';
    return '';
  };

  const formattedDate = dateStr || new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <div
      dir="rtl"
      className="tamam-sheet-page w-full max-w-[210mm] mx-auto bg-white text-black font-sans box-border p-2 sm:p-4 print:p-0 print:m-0 print:max-w-none print:w-full"
    >
      {/* Outer Double Frame Border (Classic Scout Certificate / Attendance Template) */}
      <div className="border-[3px] border-black p-1 box-border">
        <div className="border border-black p-4 sm:p-6">
          
          {/* Top Section */}
          <div>
            {/* Header: Logo, Cross, Title */}
            <div className="grid grid-cols-3 items-center gap-2 mb-4">
              
              {/* Top Right: Scout Group Details */}
              <div className="flex items-center gap-3">
                {/* Official High-Res Emblem */}
                <img
                  src="/logo.jpg"
                  alt="شعار المجموعة الكشفية البحرية"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
                />
                <div className="text-[11px] sm:text-xs font-bold leading-relaxed text-black">
                  <div>المجموعة الكشفية البحرية</div>
                  <div className="text-[10px] sm:text-[11px] font-semibold text-zinc-800">بكنيسة السيدة العذراء بالرحاب</div>
                  {unitNameAr && (
                    <div className="mt-1 inline-block px-1.5 py-0.5 border border-black rounded text-[10px] font-bold">
                      {unitNameAr}
                    </div>
                  )}
                </div>
              </div>

              {/* Center: Coptic Cross & Tamam Title */}
              <div className="text-center">
                {/* Ornate Cross */}
                <div className="text-3xl font-serif text-black leading-none mb-2 select-none">
                  ♱
                </div>
                <div className="text-base sm:text-lg font-bold border-b-2 border-black pb-1 inline-block px-3">
                  تمام حضور وغياب {patrolNameAr}
                </div>
              </div>

              {/* Top Left: Day & Date */}
              <div className="text-left text-xs sm:text-sm font-bold space-y-1.5 pr-2">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold">اليوم:</span>
                  <span>{dayName}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold">التاريخ:</span>
                  <span className="font-mono text-xs">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Roll-Call Summary Bar (Below Logo, On Top of Table) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 border-2 border-black bg-zinc-50/60 print:bg-transparent px-4 py-2.5 mb-3 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold">أصل القوة:</span>
                <span className="font-mono font-bold text-sm underline decoration-2">{members.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-800">أرض الطابور:</span>
                <span className="inline-block flex-1 min-w-10 border-b border-black"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-800">غياب بعذر:</span>
                <span className="inline-block flex-1 min-w-10 border-b border-black"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-zinc-800">غياب بدون عذر:</span>
                <span className="inline-block flex-1 min-w-10 border-b border-black"></span>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="w-full">
              <table className="w-full border-collapse border-2 border-black text-center text-xs sm:text-sm">
                <thead>
                  <tr className="bg-zinc-100/60 print:bg-transparent border-b-2 border-black h-10 sm:h-11 text-black font-bold">
                    <th className="border border-black w-10 py-1.5">م</th>
                    <th className="border border-black w-24 py-1.5 leading-tight">
                      الدور<br />الكشفي
                    </th>
                    <th className="border border-black py-1.5 text-center px-3">الأسم</th>
                    <th className="border border-black w-24 py-1.5 leading-tight">
                      الاجتماع<br />الكشفى
                    </th>
                    <th className="border border-black w-16 py-1.5">قداس</th>
                    <th className="border border-black w-20 py-1.5 leading-tight">
                      مدارس<br />احد
                    </th>
                    <th className="border border-black w-16 py-1.5">الزي</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((scout, idx) => {
                    const role = getRank(idx, scout);
                    return (
                      <tr key={idx} className="h-10 sm:h-11 border-b border-black">
                        {/* 1. Sequence Number */}
                        <td className="border border-black font-mono font-bold text-xs sm:text-sm bg-zinc-50/40 print:bg-transparent">
                          {idx + 1}
                        </td>

                        {/* 2. Scout Role (CP / CG / 3rd) */}
                        <td className="border border-black font-bold font-mono text-xs sm:text-sm uppercase">
                          {role}
                        </td>

                        {/* 3. Scout Name */}
                        <td className="border border-black font-semibold text-right px-3 py-1.5 text-xs sm:text-sm text-zinc-950">
                          {scout ? (
                            <span>{scout.full_name_ar}</span>
                          ) : (
                            <span className="text-transparent">.</span>
                          )}
                        </td>

                        {/* 4. Scout Meeting */}
                        <td className="border border-black"></td>

                        {/* 5. Mass */}
                        <td className="border border-black"></td>

                        {/* 6. Sunday School */}
                        <td className="border border-black"></td>

                        {/* 7. Uniform */}
                        <td className="border border-black"></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

