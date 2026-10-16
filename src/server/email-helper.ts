// Server-only email helpers — imported dynamically from auth.ts
export async function sendPasswordResetEmail(userEmail: string, url: string): Promise<void> {
  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.EMAIL_FROM || "Murlit <noreply@murlit.in>";
  if (!KEY) {
    console.log(`[email] Password reset for ${userEmail}: ${url}`);
    return;
  }
  try {
    const html = `<p>Click the link below to reset your Murlit account password:</p>
<p><a href="${url}" style="color:#7a1e2a;font-weight:bold">Reset Password</a></p>
<p style="font-size:12px;color:#888">This link expires in 1 hour. If you didn't request this, ignore this email.</p>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [userEmail], subject: "Reset Your Murlit Password", html }),
    });
  } catch (e) {
    console.error("[email] password reset send failed:", e);
  }
}
