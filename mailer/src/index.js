// POST a rendered notification here and it becomes an email. Reachable only
// through the Pages service binding -- there is no workers.dev route and no
// public URL.
//
// This exists because Pages Functions cannot carry a send_email binding
// ("Configuration file for Pages projects does not support send_email"), but a
// Worker can. The body arrives already rendered, so this Worker knows nothing
// about requests and has no formatting to keep in step.
//
// Email Routing's send binding needs no credential at all. It can only deliver
// to an address already verified as a destination in the Cloudflare account,
// which is exactly the "tell us something arrived" case and nothing more.

import { EmailMessage } from "cloudflare:email";

const FROM = "notifications@bhw.hu";
const TO = "shylenkoa@gmail.com";

function mime({ subject, text, replyTo }) {
  // Minimal RFC 5322. The body is base64 so a line starting with "." or a
  // non-ASCII character cannot break the message.
  const b64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  };
  const encodeHeader = (value) =>
    /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`;
  const wrap = (value) => (value.match(/.{1,76}/g) || []).join("\r\n");

  return [
    `From: Budapest Hardware Club <${FROM}>`,
    `To: ${TO}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@bhw.hu>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(text)),
  ].filter((line) => line !== null).join("\r\n");
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }
    if (!env.NOTIFY) {
      return new Response(JSON.stringify({ ok: false, error: "no send binding" }),
        { status: 503, headers: { "content-type": "application/json" } });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "bad json" }),
        { status: 400, headers: { "content-type": "application/json" } });
    }

    const subject = String(body.subject || "Budapest Hardware Club").slice(0, 200);
    const text = String(body.text || "").slice(0, 20000);
    const replyTo = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.replyTo || ""))
      ? String(body.replyTo) : "";

    try {
      await env.NOTIFY.send(new EmailMessage(FROM, TO, mime({ subject, text, replyTo })));
      return new Response(JSON.stringify({ ok: true }),
        { headers: { "content-type": "application/json" } });
    } catch (error) {
      // Surfaced to the caller, which logs and carries on. A mail failure must
      // never lose the request: the record is already in KV by now.
      return new Response(JSON.stringify({ ok: false, error: String(error && error.message) }),
        { status: 502, headers: { "content-type": "application/json" } });
    }
  },
};
