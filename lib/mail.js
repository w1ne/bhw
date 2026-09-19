// One place that sends mail for the production service.
//
// Sent from andrii@shylenko.com over PrivateEmail SMTP: shylenko.com has SPF
// and a real mailbox, while bhw.hu currently publishes no MX or SPF records at
// all — mail claiming to come from bhw.hu would fail authentication and land
// in spam. When the club has its own mailbox and DNS records, this is the one
// file to change.
//
// Failure is logged and swallowed on purpose. The caller has already written
// its record to KV by the time this runs; a mail server having a bad minute
// must not undo a write we have already made.
//
//   npx wrangler pages secret put SMTP_PASSWORD --project-name bhw

import { sendMail } from "./smtp.js";

export const SMTP_HOST = "mail.privateemail.com";

// SENDER is where mail comes FROM: the PrivateEmail mailbox the SMTP account
// authenticates as, and the domain whose SPF record makes the mail survive a
// spam filter. OPS is where the club's copies go TO.
export const SENDER = "andrii@shylenko.com";
export const OPS = "shylenkoa@gmail.com";

// replyTo defaults to our own mailbox; an internal message about somebody
// passes their address instead, so hitting reply answers the person.
export async function send(env, to, subject, text, replyTo) {
  if (!env.SMTP_PASSWORD) { console.log("[mail] no SMTP_PASSWORD, skipping:", subject); return; }
  try {
    await sendMail({
      host: SMTP_HOST,
      user: env.SMTP_USER || SENDER,
      pass: env.SMTP_PASSWORD,
      from: env.SMTP_USER || SENDER,
      fromName: "Budapest Hardware Club",
      replyTo: replyTo || SENDER,
      to, subject, text,
    });
    console.log("[mail] sent:", subject, "->", to);
  } catch (error) {
    console.log("[mail] failed:", subject, "->", to, "-", error && error.message);
  }
}
