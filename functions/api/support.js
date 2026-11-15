// POST /api/support — small, discretionary sponsorship requests.
// Reuse the JOIN KV binding and MAILER notification service. No new infrastructure.
// Records expire after 365 days; no public read endpoint.
import { send, OPS } from "../../lib/mail.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TYPES = new Set(["tickets", "travel", "event", "prototype", "other"]);
const clean = (value, limit) => String(value ?? "").trim().slice(0, limit);

function reply(ok, status, plain) {
  if (plain) {
    return new Response(null, { status: 303, headers: { location: `/support/?${ok ? "sent=1#sent" : "error=1#failed"}` } });
  }
  return new Response(JSON.stringify({ ok }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const plain = !(request.headers.get("content-type") || "").includes("application/json");
  let data;
  try {
    data = plain ? Object.fromEntries((await request.formData()).entries()) : await request.json();
  } catch {
    return reply(false, 400, plain);
  }
  if (!data || typeof data !== "object") return reply(false, 400, plain);
  if (clean(data.bhw_hp, 100)) return reply(true, 200, plain); // honeypot
  if (!env.JOIN) return reply(false, 503, plain);

  const record = {
    name: clean(data.name, 120),
    email: clean(data.email, 254),
    project: clean(data.project, 500),
    link: clean(data.link, 300),
    category: clean(data.category, 30),
    help: clean(data.help, 1000),
    cost: clean(data.cost, 100),
    when: clean(data.when, 100),
    received: new Date().toISOString(),
  };
  if (!record.name || !EMAIL.test(record.email) || record.project.length < 5 ||
      record.help.length < 10 || !TYPES.has(record.category) || data.consent !== "on") {
    return reply(false, 400, plain);
  }
  if (record.link && !/^https?:\/\/\S+$/i.test(record.link)) return reply(false, 400, plain);
  const key = `support:${record.received}:${crypto.randomUUID().slice(0, 8)}`;
  try {
    await env.JOIN.put(key, JSON.stringify(record), { expirationTtl: 365 * 24 * 60 * 60 });
  } catch (error) {
    console.log("[support] KV write failed:", error && error.message);
    return reply(false, 503, plain);
  }

  const details = Object.entries(record).map(([k, v]) => `${k}: ${v}`).join("\n");
  const mail = send(env, OPS, `Builder support: ${record.category} — ${record.name}`,
    `${details}\n\nKV key: ${key}`, record.email);
  if (waitUntil) waitUntil(mail); else await mail;
  return reply(true, 200, plain);
}
