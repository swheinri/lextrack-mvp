// app/lib/password-policy.ts

export const PASSWORD_POLICY = {
  minLen: 10,
  minDigits: 1,
  minSpecial: 1,
  requireUpper: true,
  requireLower: true,
} as const;

export type PasswordPolicyResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

function countMatches(value: string, re: RegExp): number {
  const m = value.match(re);
  return m ? m.length : 0;
}

export function validatePassword(pw: string): PasswordPolicyResult {
  const s = String(pw ?? '');

  const reasons: string[] = [];

  if (s.length < PASSWORD_POLICY.minLen) {
    reasons.push(`Mindestens ${PASSWORD_POLICY.minLen} Zeichen`);
  }

  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(s)) {
    reasons.push('Mindestens 1 Großbuchstabe (A–Z)');
  }

  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(s)) {
    reasons.push('Mindestens 1 Kleinbuchstabe (a–z)');
  }

  const digits = countMatches(s, /\d/g);
  if (digits < PASSWORD_POLICY.minDigits) {
    reasons.push(`Mindestens ${PASSWORD_POLICY.minDigits} Zahl (0–9)`);
  }

  const special = countMatches(s, /[^A-Za-z0-9]/g);
  if (special < PASSWORD_POLICY.minSpecial) {
    reasons.push(`Mindestens ${PASSWORD_POLICY.minSpecial} Sonderzeichen (z. B. ! ? # @ _)`);
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true };
}