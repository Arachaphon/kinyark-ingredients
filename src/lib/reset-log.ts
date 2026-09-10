/**
 * Minimal server-side logger for the password-reset flow.
 * Format: [reset-password] {ISO timestamp} {event} {masked-email}
 * Never log passwords, tokens, or full email addresses here.
 */

export type ResetLogEvent =
  | "reset_skipped_user_not_found"
  | "reset_rate_limited"
  | "reset_smtp_error";

/** Show first char + domain only, e.g. Test@Example.com -> "t***@example.com". */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  const head = local.length > 0 ? local[0].toLowerCase() : "*";
  return `${head}***@${domain}`;
}

export function logResetEvent(event: ResetLogEvent, email: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[reset-password] ${timestamp} ${event} ${maskEmail(email)}`);
}
