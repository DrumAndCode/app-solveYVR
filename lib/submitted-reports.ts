/**
 * Client-side persistence for submitted reports (localStorage).
 * No auth required — reports are stored per-browser.
 */

export interface SubmittedReport {
  id: string;
  ref: string;
  caseid?: string;
  address?: string;
  category?: string;
  description?: string;
  submittedAt: number; // epoch ms
}

const LS_KEY = "solveyvr-submitted-reports";

export function getSubmittedReports(): SubmittedReport[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSubmittedReport(report: SubmittedReport): void {
  try {
    const existing = getSubmittedReports();
    // Avoid duplicates by ref
    if (existing.some((r) => r.ref === report.ref)) return;
    existing.unshift(report);
    localStorage.setItem(LS_KEY, JSON.stringify(existing));
  } catch {
    // Storage full or unavailable
  }
}
