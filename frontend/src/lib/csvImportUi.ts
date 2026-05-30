/** Client-side helpers for admin CSV import UX (no backend changes). */

export async function countCsvDataRows(file: File): Promise<number> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return 0;
  return lines.length - 1;
}

export function formatImportElapsedStatus(
  elapsedSec: number,
  rowCount: number | null,
  isArabic: boolean
): string {
  const rows =
    rowCount != null
      ? isArabic
        ? `${rowCount} صف`
        : `${rowCount} row${rowCount === 1 ? "" : "s"}`
      : isArabic
        ? "الصفوف"
        : "rows";

  if (elapsedSec < 2) {
    return isArabic ? "جاري رفع الملف إلى الخادم…" : "Uploading file to server…";
  }
  if (elapsedSec < 6) {
    return isArabic
      ? `جاري معالجة ${rows} على الخادم…`
      : `Processing ${rows} on the server…`;
  }
  return isArabic
    ? `لا تزال العملية جارية (${elapsedSec} ث). الحسابات الجديدة تتطلب إرسال بريد ترحيبي لكل صف — هذا يبطئ الاستيراد على الخادم.`
    : `Still working (${elapsedSec}s). New accounts trigger one welcome email each on the server — that is usually what makes large imports slow.`;
}

export function formatRowCountHint(rowCount: number | null, isArabic: boolean): string | null {
  if (rowCount == null) return null;
  if (rowCount === 0) {
    return isArabic ? "لا توجد صفوف بيانات (الملف فارغ أو رأس فقط)." : "No data rows (empty file or header only).";
  }
  return isArabic
    ? `حوالي ${rowCount} صف بيانات — الاستيراد قد يستغرق دقيقة إذا وُجدت حسابات جديدة.`
    : `About ${rowCount} data row${rowCount === 1 ? "" : "s"} — import may take up to a minute if many new accounts are created.`;
}
