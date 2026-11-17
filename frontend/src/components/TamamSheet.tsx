'use client';

import React from 'react';

export interface TamamMember {
  id?: string;
  full_name_ar: string;
  member_code?: string;
  rank?: string | null;
  patrol_role?: string | null;
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
  const getRolePriority = (m: TamamMember) => {
    const r = (m.patrol_role ?? m.rank ?? '').trim().toUpperCase();
    if (r === 'CP') return 1;
    if (r === 'CG') return 2;
    if (r === '3RD') return 3;
    if (r.length > 0) return 4;
    return 5;
  };
  const sortedMembers = [...members].sort((a, b) => getRolePriority(a) - getRolePriority(b));

  // Pad table with empty rows if fewer than minRows
  const totalRows = Math.max(sortedMembers.length, minRows);
  const rows = Array.from({ length: totalRows }, (_, idx) => sortedMembers[idx] || null);

  // Return each scout's assigned role (CP, CG, 3rd, or custom role)
  const getRank = (_idx: number, member: TamamMember | null) => {
    if (!member) return '';
    return (member.patrol_role ?? member.rank ?? '').trim();
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
            <div className="grid grid-cols-3 items-center gap-2 mb-4">
              
              {/* Top Right: Scout Group Emblem & Unit */}
              <div className="flex items-center gap-3">
                {/* Official High-Res Emblem */}
                <img
                  src="/logo.jpg"
                  alt="شعار المجموعة الكشفية البحرية"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0"
                />
                {unitNameAr && (
                  <div className="px-2.5 py-1 border border-black rounded text-sm sm:text-base font-bold">
                    {unitNameAr}
                  </div>
                )}
              </div>

              {/* Center: Coptic Cross & Tamam Title */}
              <div className="text-center">
                {/* Ornate Cross */}
                <div className="text-4xl font-serif text-black leading-none mb-2 select-none">
                  ♱
                </div>
                <div className="text-lg sm:text-xl font-bold border-b-2 border-black pb-1.5 inline-block px-4">
                  تمام حضور وغياب {patrolNameAr}
                </div>
              </div>

              {/* Top Left: Day & Date */}
              <div className="text-left text-sm sm:text-base font-bold space-y-2 pr-2">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold">اليوم:</span>
                  <span>{dayName}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-semibold">التاريخ:</span>
                  <span className="font-mono text-sm sm:text-base">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Roll-Call Summary (Stacked Vertically Below Logo, On Top of Table) */}
            <div className="flex flex-col items-start space-y-2 mb-4 text-sm sm:text-base font-bold">
              <div className="flex items-center gap-2">
                <span className="font-semibold">أصل القوة:</span>
                <span className="font-mono font-bold text-base sm:text-lg underline decoration-2">{members.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800">أرض الطابور:</span>
                <span className="inline-block w-24 border-b border-black"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800">غياب بعذر:</span>
                <span className="inline-block w-24 border-b border-black"></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-800">غياب بدون عذر:</span>
                <span className="inline-block w-24 border-b border-black"></span>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="w-full">
              <table className="w-full border-collapse border-2 border-black text-center text-sm sm:text-base">
                <thead>
                  <tr className="bg-zinc-100/60 print:bg-transparent border-b-2 border-black h-12 sm:h-14 text-black font-bold">
                    <th className="border border-black w-12 py-2">م</th>
                    <th className="border border-black w-28 py-2 leading-tight">
                      الدور<br />الكشفي
                    </th>
                    <th className="border border-black py-2 text-center px-3">الأسم</th>
                    <th className="border border-black w-28 py-2 leading-tight">
                      الاجتماع<br />الكشفى
                    </th>
                    <th className="border border-black w-20 py-2">قداس</th>
                    <th className="border border-black w-24 py-2 leading-tight">
                      مدارس<br />احد
                    </th>
                    <th className="border border-black w-20 py-2">الزي</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((scout, idx) => {
                    const role = getRank(idx, scout);
                    return (
                      <tr key={idx} className="h-12 sm:h-14 border-b border-black">
                        {/* 1. Sequence Number */}
                        <td className="border border-black font-mono font-bold text-base sm:text-lg bg-zinc-50/40 print:bg-transparent">
                          {idx + 1}
                        </td>

                        {/* 2. Scout Role (CP / CG / 3rd / Custom) */}
                        <td
                          dir="auto"
                          className="border border-black font-bold text-base sm:text-lg px-1.5"
                        >
                          {role}
                        </td>

                        {/* 3. Scout Name */}
                        <td className="border border-black font-semibold text-right px-3.5 py-2 text-base sm:text-lg text-zinc-950">
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

