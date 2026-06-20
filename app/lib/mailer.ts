// app/lib/mailer.ts
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MAIL_FROM = process.env.MAIL_FROM || process.env.EMAIL_FROM || '';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendMail({ to, subject, html, text }: SendMailArgs) {
  // Dev/Local: wenn Key/From fehlt, nur minimal loggen (ohne Links/Tokens)
  if (!resend || !MAIL_FROM) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[mail] skipped (missing RESEND_API_KEY or MAIL_FROM)', {
        to,
        subject,
      });
    }
    return { skipped: true as const };
  }

  await resend.emails.send({
    from: MAIL_FROM, // z.B. "LexTrack <no-reply@lextrack.de>"
    to,
    subject,
    html,
    text,
  });

  return { skipped: false as const };
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}) {
  const { to, resetUrl, expiresInMinutes } = opts;

  const subject = 'LexTrack – Passwort zurücksetzen';

  const html = `
  <div style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Passwort zurücksetzen</h2>
    <p>Du hast einen Reset-Link angefordert. Klicke auf den Button, um ein neues Passwort zu vergeben.</p>
    <p style="margin:16px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#009A93;color:white;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
        Passwort festlegen
      </a>
    </p>
    <p style="font-size:12px;color:#475569;">
      Der Link ist ${expiresInMinutes} Minuten gültig. Falls du das nicht warst, ignoriere diese E-Mail.
    </p>
    <p style="font-size:12px;color:#475569;">Wenn der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
    <p style="font-size:12px; word-break:break-all; color:#0f172a;">${resetUrl}</p>
  </div>
  `.trim();

  const text =
    `Passwort zurücksetzen\n\n` +
    `Öffne diesen Link, um ein neues Passwort zu vergeben (gültig ${expiresInMinutes} Minuten):\n` +
    `${resetUrl}\n\n` +
    `Wenn du das nicht warst, ignoriere diese E-Mail.`;

  await sendMail({ to, subject, html, text });
}

export async function sendInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  expiresInMinutes: number;
  invitedBy?: string;
}) {
  const { to, inviteUrl, expiresInMinutes, invitedBy } = opts;

  const subject = 'LexTrack – Einladung zur Registrierung';

  const invitedByLine = invitedBy
    ? `<p style="font-size:12px;color:#475569;">Eingeladen von: <strong>${invitedBy}</strong></p>`
    : '';

  const html = `
  <div style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Einladung zu LexTrack</h2>
    <p>Du wurdest zu LexTrack eingeladen. Klicke auf den Button, um deinen Account zu aktivieren und ein Passwort zu setzen.</p>
    ${invitedByLine}
    <p style="margin:16px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#009A93;color:white;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
        Einladung annehmen
      </a>
    </p>
    <p style="font-size:12px;color:#475569;">
      Der Link ist ${expiresInMinutes} Minuten gültig. Falls du diese Einladung nicht erwartest, ignoriere diese E-Mail.
    </p>
    <p style="font-size:12px;color:#475569;">Wenn der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
    <p style="font-size:12px; word-break:break-all; color:#0f172a;">${inviteUrl}</p>
  </div>
  `.trim();

  const text =
    `Einladung zu LexTrack\n\n` +
    (invitedBy ? `Eingeladen von: ${invitedBy}\n\n` : '') +
    `Öffne diesen Link, um deinen Account zu aktivieren (gültig ${expiresInMinutes} Minuten):\n` +
    `${inviteUrl}\n\n` +
    `Wenn du diese Einladung nicht erwartest, ignoriere diese E-Mail.`;

  await sendMail({ to, subject, html, text });
}
export async function sendUserInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  expiresInMinutes: number;
}) {
  const { to, inviteUrl, expiresInMinutes } = opts;

  // Dev/Local: wenn Key/From fehlt, nur loggen (ohne URL/Token)
  if (!resend || !MAIL_FROM) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[mail] skipped (missing RESEND_API_KEY or MAIL_FROM)', {
        to,
        expiresInMinutes,
        kind: 'INVITE',
      });
    }
    return;
  }

  const subject = 'LexTrack – Einladung';

  const html = `
  <div style="font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px;">Du wurdest zu LexTrack eingeladen</h2>
    <p>Bitte klicke auf den Button, um dein Passwort festzulegen und den Zugang zu aktivieren.</p>
    <p style="margin:16px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#009A93;color:white;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;">
        Zugang aktivieren
      </a>
    </p>
    <p style="font-size:12px;color:#475569;">
      Der Link ist ${expiresInMinutes} Minuten gültig. Falls du diese Einladung nicht erwartest, ignoriere diese E-Mail.
    </p>
    <p style="font-size:12px;color:#475569;">Wenn der Button nicht funktioniert, kopiere diesen Link in deinen Browser:</p>
    <p style="font-size:12px; word-break:break-all; color:#0f172a;">${inviteUrl}</p>
  </div>
  `.trim();

  const text =
    `LexTrack – Einladung\n\n` +
    `Öffne diesen Link, um dein Passwort festzulegen (gültig ${expiresInMinutes} Minuten):\n` +
    `${inviteUrl}\n\n` +
    `Wenn du diese Einladung nicht erwartest, ignoriere diese E-Mail.`;

  await resend.emails.send({
    from: MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
}
