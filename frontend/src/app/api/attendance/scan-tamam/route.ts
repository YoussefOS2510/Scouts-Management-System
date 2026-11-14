import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

interface InputImage {
  mimeType?: string;
  data: string;
  fileName?: string;
}

interface InputMember {
  id: string;
  full_name_ar: string;
  full_name_en?: string;
  member_code?: string;
  patrol_id?: number | null;
  patrol_name_ar?: string;
  patrol_role?: string | null;
}

interface GeminiExtractedRow {
  memberId?: string | null;
  scannedNameAr?: string;
  patrolNameAr?: string | null;
  status?: string;
  massPresent?: boolean | null;
  sundaySchoolPresent?: boolean | null;
  uniformComplete?: boolean | null;
  excuseOrNotes?: string | null;
  confidence?: string;
}

interface GeminiParsedPayload {
  patrolsDetected?: string[];
  rows?: GeminiExtractedRow[];
}

function getServerGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() ||
    ''
  );
}

/**
 * Normalize Arabic text so slight orthographic variations (أ/إ/آ, ة/ه, ى/ي, diacritics)
 * still match reliably between handwritten/OCR'd Tamam sheets and database names.
 */
function normalizeArabicName(input: string): string {
  return input
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // remove tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findBestMemberMatch(
  scannedNameAr: string,
  patrolNameAr: string | null | undefined,
  members: InputMember[]
): { member: InputMember | null; confidence: 'high' | 'medium' | 'low' } {
  const normScanned = normalizeArabicName(scannedNameAr);
  if (!normScanned) return { member: null, confidence: 'low' };

  const normPatrol = patrolNameAr ? normalizeArabicName(patrolNameAr) : '';

  // 1. Exact normalized full name match
  const exactMatches = members.filter(
    (m) => normalizeArabicName(m.full_name_ar) === normScanned
  );
  if (exactMatches.length === 1) {
    return { member: exactMatches[0], confidence: 'high' };
  }
  if (exactMatches.length > 1 && normPatrol) {
    const patrolFiltered = exactMatches.find(
      (m) => m.patrol_name_ar && normalizeArabicName(m.patrol_name_ar).includes(normPatrol)
    );
    if (patrolFiltered) return { member: patrolFiltered, confidence: 'high' };
    return { member: exactMatches[0], confidence: 'medium' };
  }

  // 2. Token overlap scoring (prefer members in matching patrol when tied)
  const scannedTokens = normScanned.split(' ').filter((t) => t.length >= 2);
  if (scannedTokens.length === 0) return { member: null, confidence: 'low' };

  let bestMember: InputMember | null = null;
  let bestScore = 0;

  for (const member of members) {
    const mNorm = normalizeArabicName(member.full_name_ar);
    const mTokens = mNorm.split(' ').filter((t) => t.length >= 2);
    if (mTokens.length === 0) continue;

    let overlap = 0;
    for (const st of scannedTokens) {
      if (mTokens.some((mt) => mt === st || mt.startsWith(st) || st.startsWith(mt))) {
        overlap += 1;
      }
    }

    if (overlap === 0) continue;

    const coverageScanned = overlap / scannedTokens.length;
    const coverageMember = overlap / mTokens.length;
    let score = coverageScanned * 0.6 + coverageMember * 0.4;

    if (
      normPatrol &&
      member.patrol_name_ar &&
      normalizeArabicName(member.patrol_name_ar).includes(normPatrol)
    ) {
      score += 0.08;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMember = member;
    }
  }

  if (bestMember && bestScore >= 0.72) {
    return { member: bestMember, confidence: 'high' };
  }
  if (bestMember && bestScore >= 0.5) {
    return { member: bestMember, confidence: 'medium' };
  }

  return { member: null, confidence: 'low' };
}

function normalizeStatus(raw: string | undefined): AttendanceStatus {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'present' || s === 'حاضر' || s === 'ح') return 'present';
  if (s === 'excused' || s === 'معتذر' || s === 'بعذر' || s === 'عذر' || s === 'ع') return 'excused';
  if (s === 'late' || s === 'متأخر' || s === 'تأخير' || s === 'ت') return 'late';
  return 'absent';
}

function normalizeConfidence(raw: string | undefined, fallback: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
  const s = (raw || '').trim().toLowerCase();
  if (s === 'high' || s === 'medium' || s === 'low') return s;
  return fallback;
}

function buildNotes(
  excuseOrNotes: string | null | undefined,
  massPresent: boolean | null | undefined,
  sundaySchoolPresent: boolean | null | undefined,
  uniformComplete: boolean | null | undefined,
  includeSubColumnsInNotes: boolean
): string {
  const parts: string[] = [];
  const trimmedExcuse = (excuseOrNotes || '').trim();
  if (trimmedExcuse) {
    parts.push(trimmedExcuse);
  }

  if (includeSubColumnsInNotes) {
    const subTags: string[] = [];
    if (massPresent === true) subTags.push('قداس ✓');
    else if (massPresent === false) subTags.push('قداس ✗');

    if (sundaySchoolPresent === true) subTags.push('مدارس أحد ✓');
    else if (sundaySchoolPresent === false) subTags.push('مدارس أحد ✗');

    if (uniformComplete === true) subTags.push('الزي ✓');
    else if (uniformComplete === false) subTags.push('الزي ✗');

    if (subTags.length > 0) {
      parts.push(subTags.join(' | '));
    }
  }

  return parts.join(' - ');
}

function stripBase64Prefix(data: string): string {
  const idx = data.indexOf('base64,');
  return idx !== -1 ? data.slice(idx + 7) : data;
}

async function callGeminiWithImages(
  apiKey: string,
  images: InputImage[],
  members: InputMember[]
): Promise<{ payload: GeminiParsedPayload; modelUsed: string }> {
  const compactRoster = members.map((m) => ({
    id: m.id,
    full_name_ar: m.full_name_ar,
    patrol_name_ar: m.patrol_name_ar || '',
    patrol_role: m.patrol_role || '',
  }));

  const promptText = `You are an expert Arabic OCR and document-understanding assistant for a Scout organization attendance system (كشوف تمام حضور وغياب الطلائع / السداسيات).

The user has uploaded ${images.length} photo(s) of printed & hand-marked "Tamam" (تمام حضور وغياب) sheets for one or more patrols/sixes in the same scout unit.

Each Tamam sheet typically has:
- A header like "تمام حضور وغياب طليعة ..." or "تمام حضور وغياب سداسي ..." showing the patrol/six name.
- A table with RTL Arabic columns (from right to left):
  1. "م" (Row number)
  2. "الدور الكشفي" (Patrol role: CP, CG, 3rd, etc.)
  3. "الأسم" (Scout's Arabic full name)
  4. "الاجتماع الكشفى" (Main Scout Meeting attendance mark - THIS DETERMINES THE PRIMARY STATUS)
  5. "قداس" (Mass attendance mark)
  6. "مدارس احد" (Sunday School attendance mark)
  7. "الزي" (Scout Uniform compliance mark)

Rules for interpreting marks in "الاجتماع الكشفى" (and excuse/notes):
- "present": Checkmark (✓, ✔, صح), "+", "1", "ح", "حاضر", dot/filled mark, or slash clearly meaning attended.
- "absent": Cross (✗, ✘, ×, X), "-", "0", "غ", "غائب", or a clearly blank/unmarked cell when other rows in that sheet ARE marked (e.g., leaders only checked present scouts and left absent ones blank).
- "excused": "ع", "عذر", "بعذر", "معتذر", "اعتذار", or a written excuse (e.g., "سفر", "امتحان", "مرض") in the row or notes. Extract the excuse text into "excuseOrNotes".
- "late": "ت", "تأخير", "متأخر", or time written indicating lateness.

For the 3 sub-columns ("قداس", "مدارس احد", "الزي"):
- Set true if marked ✓ / ✔ / صح / +.
- Set false if marked ✗ / × / X / -.
- Set null if blank/unclear/not used on that sheet.

Match EVERY visible scout row across ALL images against this exact JSON roster of the unit's members (using Arabic name similarity + patrol context):
${JSON.stringify(compactRoster)}

Return ONLY valid JSON matching this schema:
{
  "patrolsDetected": ["اسم الطليعة أو السداسي المكتشف"],
  "rows": [
    {
      "memberId": "exact member id from roster JSON, or null if not in roster",
      "scannedNameAr": "Arabic name read from sheet",
      "patrolNameAr": "patrol name read from sheet header or null",
      "status": "present" | "absent" | "excused" | "late",
      "massPresent": true | false | null,
      "sundaySchoolPresent": true | false | null,
      "uniformComplete": true | false | null,
      "excuseOrNotes": "string or null",
      "confidence": "high" | "medium" | "low"
    }
  ]
}`;

  const parts: any[] = [{ text: promptText }];
  for (const img of images) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType || 'image/jpeg',
        data: stripBase64Prefix(img.data),
      },
    });
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastErrorMsg = 'Failed to communicate with Gemini API';
  let lastStatus = 500;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      lastStatus = res.status;
      lastErrorMsg =
        json?.error?.message || `Gemini API returned HTTP ${res.status} for model ${model}`;
      // Fall back to next model only if model not found or temporarily unsupported
      if (res.status === 404 || res.status === 400) {
        continue;
      }
      throw Object.assign(new Error(lastErrorMsg), { status: lastStatus });
    }

    const candidateText: string | undefined =
      json?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text || '')
        .join('')
        .trim();

    if (!candidateText) {
      lastErrorMsg = `Gemini model ${model} returned an empty response.`;
      continue;
    }

    // Parse JSON safely (strip markdown fences if Gemini ever emits them despite responseMimeType)
    const cleanedJson = candidateText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanedJson);
      const payload: GeminiParsedPayload = Array.isArray(parsed)
        ? { patrolsDetected: [], rows: parsed }
        : {
            patrolsDetected: Array.isArray(parsed?.patrolsDetected) ? parsed.patrolsDetected : [],
            rows: Array.isArray(parsed?.rows) ? parsed.rows : [],
          };
      return { payload, modelUsed: model };
    } catch {
      lastErrorMsg = `Could not parse JSON output from ${model}`;
      continue;
    }
  }

  throw Object.assign(new Error(lastErrorMsg), { status: lastStatus });
}

export async function GET() {
  const serverKey = getServerGeminiApiKey();
  return NextResponse.json({
    success: true,
    hasServerApiKey: Boolean(serverKey),
    model: 'gemini-2.5-flash',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const images: InputImage[] = Array.isArray(body?.images) ? body.images : [];
    const members: InputMember[] = Array.isArray(body?.members) ? body.members : [];
    const includeSubColumnsInNotes = body?.includeSubColumnsInNotes !== false;
    const providedKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
    const apiKey = providedKey || getServerGeminiApiKey();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          errorCode: 'MISSING_API_KEY',
          error:
            'لم يتم العثور على مفتاح Gemini API. يرجى إدخال المفتاح للمتابعة أو إضافته في GEMINI_API_KEY.',
        },
        { status: 400 }
      );
    }

    if (images.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'يرجى إرفاق صورة واحدة على الأقل لكشف التمام.',
        },
        { status: 400 }
      );
    }

    if (members.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'لا يوجد كشافون مسجلون في هذه الوحدة لمطابقة الأسماء معهم.',
        },
        { status: 400 }
      );
    }

    const { payload, modelUsed } = await callGeminiWithImages(apiKey, images, members);

    const memberById = new Map<string, InputMember>();
    members.forEach((m) => memberById.set(m.id, m));

    const matchedMap = new Map<
      string,
      {
        memberId: string;
        full_name_ar: string;
        patrol_name_ar: string;
        patrol_role: string;
        status: AttendanceStatus;
        notes: string;
        scannedNameAr: string;
        confidence: 'high' | 'medium' | 'low';
      }
    >();

    const unmatchedRows: {
      scannedNameAr: string;
      patrolNameAr: string;
      status: AttendanceStatus;
      notes: string;
    }[] = [];

    const detectedPatrolsSet = new Set<string>(
      (payload.patrolsDetected || []).map((p) => String(p).trim()).filter(Boolean)
    );

    const statusPriority: Record<AttendanceStatus, number> = {
      present: 4,
      late: 3,
      excused: 2,
      absent: 1,
    };

    for (const row of payload.rows || []) {
      const scannedName = (row.scannedNameAr || '').trim();
      const patrolName = (row.patrolNameAr || '').trim();
      if (patrolName) detectedPatrolsSet.add(patrolName);

      let matchedMember: InputMember | null =
        row.memberId && memberById.has(row.memberId) ? memberById.get(row.memberId)! : null;
      let fallbackConfidence: 'high' | 'medium' | 'low' = matchedMember ? 'high' : 'medium';

      if (!matchedMember && scannedName) {
        const fuzzy = findBestMemberMatch(scannedName, patrolName, members);
        matchedMember = fuzzy.member;
        fallbackConfidence = fuzzy.confidence;
      }

      const status = normalizeStatus(row.status);
      const notes = buildNotes(
        row.excuseOrNotes,
        row.massPresent,
        row.sundaySchoolPresent,
        row.uniformComplete,
        includeSubColumnsInNotes
      );

      if (!matchedMember) {
        if (scannedName) {
          unmatchedRows.push({
            scannedNameAr: scannedName,
            patrolNameAr: patrolName,
            status,
            notes,
          });
        }
        continue;
      }

      const confidence = normalizeConfidence(row.confidence, fallbackConfidence);
      const existing = matchedMap.get(matchedMember.id);

      // If the same scout appears across images, keep higher priority status or higher confidence
      if (
        !existing ||
        statusPriority[status] > statusPriority[existing.status] ||
        (confidence === 'high' && existing.confidence !== 'high')
      ) {
        matchedMap.set(matchedMember.id, {
          memberId: matchedMember.id,
          full_name_ar: matchedMember.full_name_ar,
          patrol_name_ar: matchedMember.patrol_name_ar || patrolName,
          patrol_role: matchedMember.patrol_role || '',
          status,
          notes,
          scannedNameAr: scannedName || matchedMember.full_name_ar,
          confidence,
        });
      }
    }

    const results = Array.from(matchedMap.values());
    const presentCount = results.filter((r) => r.status === 'present').length;
    const absentCount = results.filter((r) => r.status === 'absent').length;
    const excusedCount = results.filter((r) => r.status === 'excused').length;
    const lateCount = results.filter((r) => r.status === 'late').length;

    return NextResponse.json({
      success: true,
      modelUsed,
      patrolsDetected: Array.from(detectedPatrolsSet),
      results,
      unmatchedRows,
      summary: {
        imagesScanned: images.length,
        totalMatched: results.length,
        presentCount,
        absentCount,
        excusedCount,
        lateCount,
        unmatchedCount: unmatchedRows.length,
      },
    });
  } catch (error: any) {
    console.error('POST /api/attendance/scan-tamam error:', error);
    const status = typeof error?.status === 'number' && error.status >= 400 ? error.status : 500;
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'حدث خطأ أثناء تحليل صور التمام باستخدام Gemini API',
      },
      { status }
    );
  }
}
