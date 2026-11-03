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

  // Default rank labels matching the official template: 1: CP, 2: CG, 3: 3rd
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
      style={{ minHeight: '280mm' }}
    >
      {/* Outer Double Frame Border (Classic Scout Certificate / Attendance Template) */}
      <div className="border-[3px] border-black p-1 h-full min-h-[270mm] flex flex-col justify-between box-border">
        <div className="border border-black p-5 sm:p-7 flex-1 flex flex-col justify-between">
          
          {/* Top Section */}
          <div>
            {/* Header: Logo, Cross, Title */}
            <div className="grid grid-cols-3 items-start gap-2 mb-4">
              
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
              <div className="text-center pt-1">
                {/* Ornate Cross */}
                <div className="text-3xl font-serif text-black leading-none mb-2 select-none">
                  ♱
                </div>
                <div className="text-base sm:text-lg font-bold border-b-2 border-black pb-1 inline-block px-3">
                  تمام حضور وغياب {patrolNameAr}
                </div>
              </div>

              {/* Top Left: Attendance Statistics & Roll Call */}
              <div className="text-left text-xs sm:text-sm font-bold space-y-1 pr-2 pt-1">
                <div className="flex items-center justify-end gap-1">
                  <span className="font-semibold">اليوم:</span>
                  <span>{dayName}</span>
                  <span className="font-mono text-xs">{formattedDate}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold">أصل القوة:</span>
                  <span className="font-mono font-bold text-sm underline decoration-2">{members.length}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="font-semibold text-zinc-800">أرض الطابور:</span>
                  <span className="inline-block w-16 border-b border-black"></span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="font-semibold text-zinc-800">غياب بعذر:</span>
                  <span className="inline-block w-16 border-b border-black"></span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="font-semibold text-zinc-800">غياب بدون عذر:</span>
                  <span className="inline-block w-14 border-b border-black"></span>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="w-full mt-4">
              <table className="w-full border-collapse border-2 border-black text-center text-xs sm:text-sm">
                <thead>
                  <tr className="bg-zinc-100/60 print:bg-transparent border-b-2 border-black h-11 text-black font-bold">
                    <th className="border border-black w-10 py-1.5">م</th>
                    <th className="border border-black w-24 py-1.5 leading-tight">
                      الرتبه<br />الكشفيه
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
                    const rank = getRank(idx, scout);
                    return (
                      <tr key={idx} className="h-11 sm:h-12 border-b border-black">
                        {/* 1. Sequence Number */}
                        <td className="border border-black font-mono font-bold text-sm bg-zinc-50/40 print:bg-transparent">
                          {idx + 1}
                        </td>

                        {/* 2. Scout Rank (CP / CG / 3rd) */}
                        <td className="border border-black font-bold font-mono text-sm uppercase">
                          {rank}
                        </td>

                        {/* 3. Scout Name */}
                        <td className="border border-black font-semibold text-right px-3 text-xs sm:text-[13px] text-zinc-950">
                          {scout ? (
                            <div className="flex items-center justify-between">
                              <span>{scout.full_name_ar}</span>
                              {scout.member_code && (
                                <span className="font-mono text-[10px] text-zinc-400 print:text-zinc-600">
                                  {scout.member_code}
                                </span>
                              )}
                            </div>
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

          {/* Bottom Notes / Signatures Section */}
          <div className="pt-8 grid grid-cols-3 text-xs font-bold text-center border-t border-dashed border-zinc-400 mt-6 print:mt-4">
            <div>
              <span>توقيع رائد الطليعة (CP):</span>
              <div className="mt-6 border-b border-black w-3/4 mx-auto"></div>
            </div>
            <div>
              <span>ملاحظات إضافية:</span>
              <div className="mt-6 border-b border-black w-3/4 mx-auto"></div>
            </div>
            <div>
              <span>اعتماد قائد المرحلة:</span>
              <div className="mt-6 border-b border-black w-3/4 mx-auto"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

