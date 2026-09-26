import type { Client } from "./types";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" });

/** First of the current month, as a YYYY-MM-01 date string. */
export function currentMonthDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatMonthLabel(monthDate: string): string {
  // Parse as local, not UTC, so "2026-09-01" doesn't shift to August in
  // timezones behind UTC.
  const [year, month] = monthDate.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

/**
 * A pre-filled mailto: link for the monthly statement request. Opens in
 * the staff member's own mail client (Outlook) for them to review and
 * send — not a fully automated send. Wiring true one-click/unattended
 * sending needs a real email-sending provider (Resend, Microsoft Graph,
 * etc.), which is a separate infrastructure decision.
 */
export function buildStatementRequestMailto(client: Client, monthLabel: string): string | null {
  if (!client.email) return null;

  const subject = `${client.display_name} — statements needed for ${monthLabel}`;
  const body = [
    `Hi ${client.contact_name ?? "there"},`,
    "",
    `We're starting the ${monthLabel} bookkeeping close for ${client.display_name}. Could you send over:`,
    "",
    "- Bank statement(s)",
    "- Credit card statement(s)",
    "- Any loan or line of credit statements",
    "",
    "Thanks!",
  ].join("\n");

  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(client.email)}?${params.toString()}`;
}
