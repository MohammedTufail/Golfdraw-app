/**
 * lib/email.ts — Email Notifications via Resend
 *
 * WHY: PRD §13 requires system emails for:
 *   - Draw results (all participants notified when draw is published)
 *   - Winner alerts (winner told they've won + told to upload proof)
 *   - Subscription confirmations
 *
 * HOW: Uses Resend (resend.com) — free tier = 100 emails/day, no domain required for testing.
 * In production: add a custom domain in Resend dashboard and update FROM_EMAIL.
 *
 * Setup: npm install resend → add RESEND_API_KEY to .env.local
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "GolfDraw <noreply@golfdraw.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://golfdraw.app";

// ── Shared email wrapper ──────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) console.error("Email send error:", error);
    return !error;
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}

// ── Shared HTML wrapper (dark theme to match brand) ──────────
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080808;font-family:'DM Sans',system-ui,sans-serif;color:#f5f5f5;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:1.4rem;font-weight:700;letter-spacing:-0.02em;">
        Golf<span style="background:linear-gradient(90deg,#c9a84c,#f0d87a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Draw</span>
      </span>
    </div>
    <!-- Card -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.10);border-radius:16px;padding:36px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;color:rgba(255,255,255,0.3);font-size:0.8rem;">
      © 2026 GolfDraw · <a href="${APP_URL}" style="color:rgba(255,255,255,0.4);">golfdraw.app</a>
    </div>
  </div>
</body>
</html>`;
}

const goldBtn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#f0d87a);color:#080808;font-weight:700;border-radius:10px;text-decoration:none;">${label}</a>`;

const mutedText = (t: string) =>
  `<p style="color:rgba(255,255,255,0.5);font-size:0.9rem;line-height:1.7;">${t}</p>`;

// ── 1. Draw Published — notify ALL participants ───────────────
export async function sendDrawResultEmail({
  to,
  name,
  drawTitle,
  winningNumbers,
  didWin,
  matchType,
  prizeAmount,
  drawId,
}: {
  to: string;
  name: string;
  drawTitle: string;
  winningNumbers: number[];
  didWin: boolean;
  matchType?: string;
  prizeAmount?: number;
  drawId: string;
}) {
  const numbersHtml = winningNumbers
    .map(
      (n) =>
        `<span style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:8px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);color:#f0d87a;font-weight:700;margin:3px;">${n}</span>`,
    )
    .join("");

  const winBlock = didWin
    ? `
    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.25);border-radius:12px;padding:20px;margin-top:20px;">
      <p style="color:#f0d87a;font-weight:700;font-size:1.1rem;margin:0 0 8px;">🏆 You won ${matchType?.replace("_", "-")}!</p>
      <p style="color:rgba(255,255,255,0.6);margin:0;">Prize amount: <strong style="color:white;">£${prizeAmount?.toFixed(2)}</strong></p>
      <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-top:8px;">Upload your score proof in the dashboard to claim your prize.</p>
    </div>
    ${goldBtn(`${APP_URL}/dashboard/winnings`, "Upload Proof & Claim Prize")}
  `
    : `${mutedText("Better luck next draw! Keep your scores updated for the best chance.")}`;

  const html = emailWrapper(`
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;">Results are in: ${drawTitle}</h2>
    ${mutedText(`Hi ${name}, the monthly draw has been published. Here are the winning numbers:`)}
    <div style="margin:20px 0;">${numbersHtml}</div>
    ${winBlock}
    ${goldBtn(`${APP_URL}/dashboard`, "Go to Dashboard")}
  `);

  return sendEmail(to, `🎯 ${drawTitle} — Results Published`, html);
}

// ── 2. Winner Alert — sent to verified winners on approval ────
export async function sendWinnerApprovedEmail({
  to,
  name,
  matchType,
  prizeAmount,
}: {
  to: string;
  name: string;
  matchType: string;
  prizeAmount: number;
}) {
  const html = emailWrapper(`
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;">✅ Proof Approved!</h2>
    ${mutedText(`Hi ${name}, your score proof has been verified by our team.`)}
    <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:20px;margin-top:20px;">
      <p style="color:#4ade80;font-weight:700;margin:0 0 6px;">${matchType.replace("_", "-")} Winner</p>
      <p style="font-size:2rem;font-weight:700;color:white;margin:0;">£${prizeAmount.toFixed(2)}</p>
      <p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-top:6px;">Your prize will be paid out shortly. We'll be in touch with payment details.</p>
    </div>
    ${goldBtn(`${APP_URL}/dashboard/winnings`, "View Winnings")}
  `);
  return sendEmail(to, "🏆 Your prize has been approved!", html);
}

// ── 3. Winner Rejected — ask for re-upload ───────────────────
export async function sendProofRejectedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const html = emailWrapper(`
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;">Proof Submission Update</h2>
    ${mutedText(`Hi ${name}, unfortunately your score proof submission was rejected. This may be because the screenshot was unclear, didn't show the required dates, or didn't match the scores on record.`)}
    ${mutedText("Please re-upload a clear screenshot from your official golf platform showing your scores with dates clearly visible.")}
    ${goldBtn(`${APP_URL}/dashboard/winnings`, "Re-upload Proof")}
  `);
  return sendEmail(
    to,
    "Action required: Please re-submit your score proof",
    html,
  );
}

// ── 4. Subscription Confirmed ────────────────────────────────
export async function sendSubscriptionConfirmedEmail({
  to,
  name,
  plan,
}: {
  to: string;
  name: string;
  plan: "monthly" | "yearly";
}) {
  const html = emailWrapper(`
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;">Welcome to GolfDraw! 🎉</h2>
    ${mutedText(`Hi ${name}, your ${plan} subscription is now active. You're eligible to enter the next monthly draw.`)}
    <div style="margin:20px 0;">
      <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;">Next steps:</p>
      <ol style="color:rgba(255,255,255,0.5);font-size:0.9rem;line-height:2;">
        <li>Choose your charity in the dashboard</li>
        <li>Enter up to 5 Stableford scores</li>
        <li>Wait for the monthly draw!</li>
      </ol>
    </div>
    ${goldBtn(`${APP_URL}/dashboard`, "Get Started")}
  `);
  return sendEmail(to, "🏌️ Your GolfDraw subscription is active", html);
}

// ── 5. Subscription Cancelled ────────────────────────────────
export async function sendSubscriptionCancelledEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const html = emailWrapper(`
    <h2 style="font-size:1.5rem;font-weight:700;margin:0 0 8px;">Subscription Cancelled</h2>
    ${mutedText(`Hi ${name}, your GolfDraw subscription has been cancelled. You'll retain access until your current billing period ends.`)}
    ${mutedText("We hope to see you back on the course soon.")}
    ${goldBtn(`${APP_URL}/signup`, "Resubscribe")}
  `);
  return sendEmail(to, "Your GolfDraw subscription has been cancelled", html);
}
