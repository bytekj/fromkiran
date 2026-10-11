const DEVANAGARI_DIGITS = '०१२३४५६७८९';

const MONTHS = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

/** 12 -> "१२" */
export function marathiNumber(n: number): string {
  return String(n).replace(/\d/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/** Date -> "१० ऑक्टोबर २०२६" (uses UTC so the day never shifts) */
export function formatDate(date: Date): string {
  return `${marathiNumber(date.getUTCDate())} ${MONTHS[date.getUTCMonth()]} ${marathiNumber(date.getUTCFullYear())}`;
}

/** Rough reading time in minutes from the raw essay text. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 150));
}

/** "१ मिनिट" / "५ मिनिटे" */
export function readingLabel(body: string | undefined): string {
  const n = readingMinutes(body);
  return `${marathiNumber(n)} ${n === 1 ? 'मिनिट' : 'मिनिटे'}`;
}
