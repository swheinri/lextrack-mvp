// app/api/settings/invitations/send/route.ts

import { NextResponse } from 'next/server';
import { sendMail } from '@/app/lib/mailer';

export const runtime = 'nodejs';

type InvitePayload = {
  email?: unknown;
  roleId?: unknown;
  roleLabel?: unknown;
  departmentId?: unknown;
  departmentLabel?: unknown;
  isDe?: unknown;
};

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  let payload: InvitePayload;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { message: 'Ungültiger Request Body.' },
      { status: 400 }
    );
  }

  const email = asString(payload.email);
  const roleId = asString(payload.roleId);
  const roleLabel = asString(payload.roleLabel) || roleId;
  const departmentId = asString(payload.departmentId);
  const departmentLabel = asString(payload.departmentLabel) || departmentId;
  const isDe = payload.isDe !== false;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { message: isDe ? 'Ungültige E-Mail-Adresse.' : 'Invalid email address.' },
      { status: 400 }
    );
  }

  if (!roleId) {
    return NextResponse.json(
      { message: isDe ? 'Rolle fehlt.' : 'Role is missing.' },
      { status: 400 }
    );
  }

  if (!departmentId) {
    return NextResponse.json(
      { message: isDe ? 'Abteilung fehlt.' : 'Department is missing.' },
      { status: 400 }
    );
  }

  const appUrl =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';

  const subject = isDe ? 'Einladung zu LexTrack' : 'Invitation to LexTrack';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin:0 0 12px">LexTrack</h2>

      <p>
        ${isDe
          ? 'Du wurdest zu LexTrack eingeladen.'
          : 'You have been invited to LexTrack.'}
      </p>

      <table style="border-collapse:collapse;margin:16px 0">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#475569">
            ${isDe ? 'Rolle' : 'Role'}
          </td>
          <td style="padding:6px 0;font-weight:600">
            ${escapeHtml(roleLabel)}
          </td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#475569">
            ${isDe ? 'Abteilung' : 'Department'}
          </td>
          <td style="padding:6px 0;font-weight:600">
            ${escapeHtml(departmentLabel)}
          </td>
        </tr>
      </table>

      <p>
        <a href="${escapeHtml(appUrl)}"
           style="display:inline-block;background:#00559F;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
          ${isDe ? 'LexTrack öffnen' : 'Open LexTrack'}
        </a>
      </p>

      <p style="font-size:12px;color:#64748b;margin-top:24px">
        ${isDe
          ? 'Falls du diese Einladung nicht erwartet hast, kannst du diese Nachricht ignorieren.'
          : 'If you did not expect this invitation, you can ignore this message.'}
      </p>
    </div>
  `;

  const text = isDe
    ? `Du wurdest zu LexTrack eingeladen.

Rolle: ${roleLabel}
Abteilung: ${departmentLabel}

LexTrack öffnen: ${appUrl}

Falls du diese Einladung nicht erwartet hast, kannst du diese Nachricht ignorieren.`
    : `You have been invited to LexTrack.

Role: ${roleLabel}
Department: ${departmentLabel}

Open LexTrack: ${appUrl}

If you did not expect this invitation, you can ignore this message.`;

  try {
    const result = await sendMail({
      to: email,
      subject,
      html,
      text,
    });

    if (result?.skipped) {
      return NextResponse.json(
        {
          message: isDe
            ? 'Mailversand ist noch nicht konfiguriert. RESEND_API_KEY oder MAIL_FROM fehlt.'
            : 'Mail sending is not configured yet. RESEND_API_KEY or MAIL_FROM is missing.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: isDe ? 'Einladung wurde gesendet.' : 'Invitation has been sent.',
    });
  } catch (error) {
    console.error('Invitation mail failed:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : isDe
              ? 'Einladung konnte nicht gesendet werden.'
              : 'Invitation could not be sent.',
      },
      { status: 500 }
    );
  }
}