export interface TamamPdfMember {
  id?: string;
  full_name_ar: string;
  rank?: string | null;
  patrol_role?: string | null;
}

export interface TamamPdfSheetInput {
  unitNameAr?: string;
  patrolNameAr: string;
  members: TamamPdfMember[];
  dayName?: string;
  dateStr?: string;
  minRows?: number;
}

const A4_PX_W = 1654; // ~200 DPI A4 portrait width (210mm)
const A4_PX_H = 2339; // ~200 DPI A4 portrait height (297mm)
const A4_PT_W = 595.28;
const A4_PT_H = 841.89;

const ARABIC_FONT_FAMILY = '"Cairo", "Segoe UI", Tahoma, Arial, sans-serif';

function getRolePriority(m: TamamPdfMember): number {
  const r = (m.patrol_role ?? m.rank ?? '').trim().toUpperCase();
  if (r === 'CP') return 1;
  if (r === 'CG') return 2;
  if (r === '3RD') return 3;
  if (r.length > 0) return 4;
  return 5;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function formatDefaultArabicDate(): string {
  return new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function renderTamamPageToJpeg(
  sheet: TamamPdfSheetInput,
  logoImg: HTMLImageElement | null
): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = A4_PX_W;
  canvas.height = A4_PX_H;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for Tamam PDF');
  }

  // White paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, A4_PX_W, A4_PX_H);

  // Outer Double Frame Border (classic A4 certificate border matching TamamSheet.tsx)
  const outerMargin = 48;
  const outerW = A4_PX_W - outerMargin * 2;
  const outerH = A4_PX_H - outerMargin * 2;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(outerMargin, outerMargin, outerW, outerH);

  const innerOffset = 10;
  const innerX = outerMargin + innerOffset;
  const innerY = outerMargin + innerOffset;
  const innerW = outerW - innerOffset * 2;
  const innerH = outerH - innerOffset * 2;
  ctx.lineWidth = 2;
  ctx.strokeRect(innerX, innerY, innerW, innerH);

  // Content box bounds inside inner frame
  const pad = 54;
  const cx = innerX + pad;
  const cy = innerY + pad;
  const cw = innerW - pad * 2;
  const contentBottom = innerY + innerH - pad;

  const sortedMembers = [...sheet.members].sort(
    (a, b) => getRolePriority(a) - getRolePriority(b)
  );
  const minRows = sheet.minRows ?? 8;
  const totalRows = Math.max(sortedMembers.length, minRows);
  const dayName = sheet.dayName || 'الجمعة';
  const formattedDate = sheet.dateStr || formatDefaultArabicDate();

  // ---------------- 1. TOP HEADER (3 columns RTL) ----------------
  const colW = cw / 3;

  // Right third (RTL start): Logo + Unit badge (no redundant group text next to logo)
  const logoSize = 220;
  const logoX = cx + cw - logoSize;
  const logoY = cy;
  if (logoImg) {
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  }

  if (sheet.unitNameAr) {
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = `bold 32px ${ARABIC_FONT_FAMILY}`;
    const textW = ctx.measureText(sheet.unitNameAr).width;
    const badgeW = textW + 38;
    const badgeH = 54;
    const badgeX = logoX - 20 - badgeW;
    const badgeY = logoY + (logoSize - badgeH) / 2;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 10);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sheet.unitNameAr, badgeX + badgeW / 2, badgeY + badgeH / 2 + 2);
    ctx.restore();
  }

  // Center third: Coptic Cross + Patrol Title with bottom rule
  const centerX = cx + colW * 1.5;
  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `72px Georgia, "Times New Roman", serif`;
  ctx.fillText('♱', centerX, cy + 6);

  const titleText = `تمام حضور وغياب ${sheet.patrolNameAr}`;
  ctx.font = `bold 46px ${ARABIC_FONT_FAMILY}`;
  const titleY = cy + 98;
  ctx.fillText(titleText, centerX, titleY, colW + 140);

  const titleW = Math.min(ctx.measureText(titleText).width + 50, colW + 140);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(centerX - titleW / 2, titleY + 68);
  ctx.lineTo(centerX + titleW / 2, titleY + 68);
  ctx.stroke();
  ctx.restore();

  // Left third (RTL end): Day & Date
  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `bold 33px ${ARABIC_FONT_FAMILY}`;
  ctx.fillText(`اليوم: ${dayName}`, cx + 10, cy + 44);
  ctx.fillText(`التاريخ: ${formattedDate}`, cx + 10, cy + 104);
  ctx.restore();

  // ---------------- 2. ROLL-CALL SUMMARY (Stacked Vertically Below Logo) ----------------
  const summaryY = cy + Math.max(logoSize, 175) + 32;
  const lineStep = 58;
  const rightEdge = cx + cw;

  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Line 1: أصل القوة: <count>
  ctx.font = `bold 35px ${ARABIC_FONT_FAMILY}`;
  const forceLabel = `أصل القوة: `;
  ctx.fillText(forceLabel, rightEdge, summaryY + 18);
  const forceLabelW = ctx.measureText(forceLabel).width;
  const countStr = String(sheet.members.length);
  ctx.font = `bold 38px ${ARABIC_FONT_FAMILY}`;
  const countW = ctx.measureText(countStr).width;
  ctx.fillText(countStr, rightEdge - forceLabelW, summaryY + 18);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(rightEdge - forceLabelW - countW, summaryY + 34);
  ctx.lineTo(rightEdge - forceLabelW, summaryY + 34);
  ctx.stroke();

  const blankFields = ['أرض الطابور:', 'غياب بعذر:', 'غياب بدون عذر:'];
  ctx.font = `bold 34px ${ARABIC_FONT_FAMILY}`;
  for (let i = 0; i < blankFields.length; i++) {
    const rowY = summaryY + lineStep * (i + 1);
    const label = blankFields[i];
    ctx.fillText(label, rightEdge, rowY + 18);
    const labelW = ctx.measureText(label).width + 20;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rightEdge - labelW - 210, rowY + 30);
    ctx.lineTo(rightEdge - labelW, rowY + 30);
    ctx.stroke();
  }
  ctx.restore();

  // ---------------- 3. ATTENDANCE TABLE (RTL, Right-to-Left Columns) ----------------
  const tableTop = summaryY + lineStep * 4 + 36;
  const headerH = 118;
  const availableTableH = contentBottom - tableTop - headerH;
  const defaultRowH = 96;
  const rowH =
    totalRows * defaultRowH <= availableTableH
      ? defaultRowH
      : Math.max(46, Math.floor(availableTableH / totalRows));
  const tableH = headerH + totalRows * rowH;

  // Column proportions scaled cleanly to cw (1434px)
  // Order (Right -> Left): م | الدور الكشفي | الأسم | الاجتماع الكشفى | قداس | مدارس احد | الزي
  const rawWidths = [70, 185, 585, 178, 128, 158, 130];
  const widthSum = rawWidths.reduce((acc, v) => acc + v, 0);
  const colWidths = rawWidths.map((w, idx) =>
    idx === rawWidths.length - 1
      ? cw -
        rawWidths
          .slice(0, -1)
          .reduce((acc, v) => acc + Math.round((v / widthSum) * cw), 0)
      : Math.round((w / widthSum) * cw)
  );

  // Compute left X coordinates for each column ordered right-to-left
  const colRects: { x: number; w: number }[] = [];
  let cursorRight = cx + cw;
  for (const w of colWidths) {
    cursorRight -= w;
    colRects.push({ x: cursorRight, w });
  }

  // Header tint for sequence/header matching print styling
  ctx.fillStyle = '#F7F7F8';
  ctx.fillRect(cx, tableTop, cw, headerH);
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(colRects[0].x, tableTop + headerH, colRects[0].w, totalRows * rowH);

  // Outer thick border around table
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(cx, tableTop, cw, tableH);

  // Horizontal divider lines
  ctx.beginPath();
  ctx.moveTo(cx, tableTop + headerH);
  ctx.lineTo(cx + cw, tableTop + headerH);
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.lineWidth = 2;
  for (let r = 1; r < totalRows; r++) {
    const y = tableTop + headerH + r * rowH;
    ctx.beginPath();
    ctx.moveTo(cx, y);
    ctx.lineTo(cx + cw, y);
    ctx.stroke();
  }

  // Vertical column dividers
  ctx.lineWidth = 2;
  for (let c = 0; c < colRects.length - 1; c++) {
    const xLine = colRects[c].x;
    ctx.beginPath();
    ctx.moveTo(xLine, tableTop);
    ctx.lineTo(xLine, tableTop + tableH);
    ctx.stroke();
  }

  // Column Header Labels
  const headers: string[][] = [
    ['م'],
    ['الدور', 'الكشفي'],
    ['الأسم'],
    ['الاجتماع', 'الكشفى'],
    ['قداس'],
    ['مدارس', 'احد'],
    ['الزي'],
  ];

  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold 32px ${ARABIC_FONT_FAMILY}`;

  headers.forEach((lines, colIdx) => {
    const rect = colRects[colIdx];
    const centerColX = rect.x + rect.w / 2;
    if (lines.length === 1) {
      ctx.fillText(lines[0], centerColX, tableTop + headerH / 2 + 2);
    } else {
      ctx.fillText(lines[0], centerColX, tableTop + headerH / 2 - 19);
      ctx.fillText(lines[1], centerColX, tableTop + headerH / 2 + 20);
    }
  });
  ctx.restore();

  // Table Row Data
  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';

  const rowFontScale = rowH < 80 ? Math.max(0.65, rowH / defaultRowH) : 1;
  const seqFontPx = Math.round(32 * rowFontScale);
  const roleFontPx = Math.round(30 * rowFontScale);
  const nameFontPx = Math.round(36 * rowFontScale);

  for (let r = 0; r < totalRows; r++) {
    const scout = sortedMembers[r] || null;
    const rowMidY = tableTop + headerH + r * rowH + rowH / 2 + 1;

    // 1. Sequence number
    ctx.font = `bold ${seqFontPx}px ${ARABIC_FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(String(r + 1), colRects[0].x + colRects[0].w / 2, rowMidY);

    if (scout) {
      // 2. Role
      const role = (scout.patrol_role ?? scout.rank ?? '').trim();
      if (role) {
        ctx.font = `bold ${roleFontPx}px ${ARABIC_FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(role, colRects[1].x + colRects[1].w / 2, rowMidY, colRects[1].w - 16);
      }

      // 3. Scout Full Name (Arabic) - no IDs
      ctx.font = `bold ${nameFontPx}px ${ARABIC_FONT_FAMILY}`;
      ctx.textAlign = 'right';
      ctx.fillText(
        scout.full_name_ar || '',
        colRects[2].x + colRects[2].w - 22,
        rowMidY,
        colRects[2].w - 44
      );
    }
  }
  ctx.restore();

  const jpegUrl = canvas.toDataURL('image/jpeg', 0.92);
  return dataUrlToUint8Array(jpegUrl);
}

/**
 * Assemble one or more A4 JPEG pages into a standards-compliant PDF 1.4 Blob.
 */
export function buildPdfFromJpegs(jpegs: Uint8Array[]): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let byteOffset = 0;

  const pushStr = (s: string) => {
    const bytes = encoder.encode(s);
    chunks.push(bytes);
    byteOffset += bytes.length;
  };
  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    byteOffset += bytes.length;
  };

  const offsets: number[] = [0]; // 1-indexed object table

  pushStr('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  const pageCount = jpegs.length;
  // Object IDs: 1 = Catalog, 2 = Pages, then 3 per page: (pageObj, contentObj, imgObj)
  const pageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) {
    pageObjIds.push(3 + i * 3);
  }

  // 1: Catalog
  offsets[1] = byteOffset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  offsets[2] = byteOffset;
  const kidsRef = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${kidsRef}] /Count ${pageCount} >>\nendobj\n`);

  const contentStreamStr = `q\n${A4_PT_W} 0 0 ${A4_PT_H} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentStreamBytes = encoder.encode(contentStreamStr);

  for (let i = 0; i < pageCount; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = pageObjId + 1;
    const imgObjId = pageObjId + 2;
    const jpeg = jpegs[i];

    // Page object
    offsets[pageObjId] = byteOffset;
    pushStr(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_PT_W} ${A4_PT_H}] /Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content stream object
    offsets[contentObjId] = byteOffset;
    pushStr(`${contentObjId} 0 obj\n<< /Length ${contentStreamBytes.length} >>\nstream\n`);
    pushBytes(contentStreamBytes);
    pushStr('\nendstream\nendobj\n');

    // JPEG XObject
    offsets[imgObjId] = byteOffset;
    pushStr(
      `${imgObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${A4_PX_W} /Height ${A4_PX_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
    );
    pushBytes(jpeg);
    pushStr('\nendstream\nendobj\n');
  }

  const xrefOffset = byteOffset;
  const totalObjects = 2 + pageCount * 3;
  pushStr(`xref\n0 ${totalObjects + 1}\n`);
  pushStr('0000000000 65535 f \n');
  for (let id = 1; id <= totalObjects; id++) {
    const padded = String(offsets[id]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
}

/**
 * Generates an A4 PDF (single-page or multi-page) for the supplied Tamam sheet(s)
 * and immediately triggers browser file download with no intermediate preview modal.
 */
export async function downloadTamamPdf(
  sheets: TamamPdfSheetInput | TamamPdfSheetInput[],
  fileName?: string
): Promise<void> {
  const sheetList = Array.isArray(sheets) ? sheets : [sheets];
  if (sheetList.length === 0) return;

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {}

  const logoImg = await loadImage('/logo.jpg');
  const jpegPages: Uint8Array[] = [];
  for (const sheet of sheetList) {
    jpegPages.push(await renderTamamPageToJpeg(sheet, logoImg));
  }

  const pdfBlob = buildPdfFromJpegs(jpegPages);
  const url = URL.createObjectURL(pdfBlob);

  const defaultName =
    sheetList.length === 1
      ? `تمام_${sheetList[0].patrolNameAr}`
      : `تمام_${sheetList[0].unitNameAr || 'الطلائع'}`;
  const safeBase = sanitizeFileName((fileName || defaultName).replace(/\.pdf$/i, ''));

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeBase}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
