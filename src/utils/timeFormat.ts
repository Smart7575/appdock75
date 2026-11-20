/**
 * Time formatting & date-time calculation helpers for Production Time Tracking.
 */

export function formatElapsedClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map(v => String(v).padStart(2, '0')).join(':');
}

export function formatDurationCompact(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return secs > 0 && mins < 10 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${secs}s`;
}

export function toLocalDateString(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toLocalTimeHHMM(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return '09:00';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function buildIsoRangeFromDateAndTimes(
  dateStr: string,
  startHHMM: string,
  endHHMM: string
): { startedAt: string; endedAt: string; durationSeconds: number; spansNextDay: boolean } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [sh, sm] = startHHMM.split(':').map(Number);
  const [eh, em] = endHHMM.split(':').map(Number);

  const startDate = new Date(y, (m || 1) - 1, d || 1, sh || 0, sm || 0, 0, 0);
  let endDate = new Date(y, (m || 1) - 1, d || 1, eh || 0, em || 0, 0, 0);
  let spansNextDay = false;

  if (endDate.getTime() <= startDate.getTime()) {
    // Allow sessions crossing midnight when end time is earlier than start time
    endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    spansNextDay = true;
  }

  const durationSeconds = Math.max(60, Math.round((endDate.getTime() - startDate.getTime()) / 1000));
  return {
    startedAt: startDate.toISOString(),
    endedAt: endDate.toISOString(),
    durationSeconds,
    spansNextDay,
  };
}
