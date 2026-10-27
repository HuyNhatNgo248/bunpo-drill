import { requiredEnv } from "./env.server";

export type Mail = { to: string; subject: string; text: string };

/**
 * Sends an email through Resend's API (https://resend.com/docs/api-reference/emails/send-email),
 * from MAIL_FROM, a sender on a domain that Resend has verified.
 * Outside production without RESEND_API_KEY, it prints the email to the server log instead,
 * so a password reset still works on a development machine.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") {
    console.info(`[mail] To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${requiredEnv("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: requiredEnv("MAIL_FROM"), to: [mail.to], subject: mail.subject, text: mail.text }),
  });
  if (!response.ok) throw new Error(`Resend refused the email (${response.status}): ${await response.text()}`);
}
