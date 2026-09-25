/**
 * Date helper utilities for Tripmakerz Hotel PMS
 * Provides robust, timezone-safe date calculations and formatting
 */

/**
 * Returns today's date in 'YYYY-MM-DD' format based on client local time
 */
export const getTodayDateStr = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Safely adds or subtracts days to a 'YYYY-MM-DD' string without UTC drift
 */
export const addDaysToStr = (dateStr: string, days: number): string => {
  if (!dateStr || !dateStr.includes('-')) {
    dateStr = getTodayDateStr();
  }
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  return getTodayDateStr(date);
};

/**
 * Returns the difference in calendar days between two 'YYYY-MM-DD' strings (end - start)
 */
export const getDaysDifference = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const p1 = startDateStr.split('-').map(Number);
  const p2 = endDateStr.split('-').map(Number);
  const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
  const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Formats 'YYYY-MM-DD' to human readable string (e.g. "25 Sep 2026")
 */
export const formatDisplayDate = (
  dateStr: string, 
  options: { showYear?: boolean; weekday?: boolean } = { showYear: true }
): string => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '';
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();

  let formatted = `${day} ${month}`;
  if (options.showYear !== false) {
    formatted += ` ${year}`;
  }
  if (options.weekday) {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    formatted = `${weekday}, ${formatted}`;
  }
  return formatted;
};

/**
 * Formats a range: e.g. "25 Sep 2026 — 15 Oct 2026"
 */
export const formatDateRange = (startDateStr: string, endDateStr: string): string => {
  if (!startDateStr || !endDateStr) return '';
  return `${formatDisplayDate(startDateStr)} — ${formatDisplayDate(endDateStr)}`;
};
