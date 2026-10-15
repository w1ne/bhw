// POST /api/pitch — founder and investor intake from /pitch/.
//
// Same shape as /api/join: validate, store in the JOIN KV namespace under a
// "pitch:" prefix, mail the club inbox with Reply-To set to the sender.
// Spam guard is the bhw_hp honeypot (no Turnstile is configured on the site).
// A plain form post (no JS) gets a 303 back to /pitch/?sent=<kind>.
//
// Read submissions: wrangler kv key list --binding JOIN --prefix pitch:

import { send, OPS } from "../../lib/mail.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URLISH = /^https?:\/\/\S+$/i;

const FIELDS = {
  founder: {
    required: ["name", "email", "what", "consent"],
    text: { project: 200, link: 300, what: 200, stage: 40, raise: 40, raise_for: 300, deck: 300, attend: 20 },
    multi: ["needs"],
  },
  investor: {
    required: ["name", "email", "consent"],
    text: { fund: 200, linkedin: 300, ticket: 40, stage: 40, judge: 10 },
    multi: ["sectors"],
  },
};

function reply(body, status, plain, kind) {
  if (plain) {
    const to = body.ok ? `/pitch/?sent=${kind}#sent` : `/pitch/?error=1#failed`;
    return new Response(null, { status: 303, headers: { location: to } });
  }
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const clean = (v, max) => String(v ?? "").trim().replace(/[\r\n\t]+/g, " ").slice(0, max);

export async function onRequestPost({ request, env, waitUntil }) {
  const contentType = request.headers.get("content-type") || "";
  const plain = !contentType.includes("application/json");
  let data = {};
  try {
    if (plain) {
      const fd = await request.formData();
      for (const key of new Set(fd.keys())) {
        const all = fd.getAll(key);
        data[key] = all.length > 1 ? all : all[0];
      }
    } else {
      data = await request.json();
    }
  } catch {
    return reply({ ok: false, error: "could not read the form" }, 400, plain);
  }
  if (!data || typeof data !== "object") return reply({ ok: false, error: "could not read the form" }, 400, plain);

  const kind = data.kind === "investor" ? "investor" : data.kind === "founder" ? "founder" : "";
  if (!kind) return reply({ ok: false, error: "unknown form" }, 400, plain);

  if (String(data.bhw_hp || "").trim()) return reply({ ok: true }, 200, plain, kind);
  if (!env.JOIN) return reply({ ok: false, error: "pitch intake is not configured on this deployment" }, 503, plain);

  const spec = FIELDS[kind];
  const record = { kind, name: clean(data.name, 200), email: String(data.email || "").trim() };
  if (!record.name) return reply({ ok: false, error: "name is required" }, 400, plain);
  if (!EMAIL.test(record.email) || record.email.length > 254) {
    return reply({ ok: false, error: "a valid email is required" }, 400, plain);
  }
  for (const [key, max] of Object.entries(spec.text)) record[key] = clean(data[key], max);
  for (const key of spec.multi) {
    const v = data[key];
    record[key] = (Array.isArray(v) ? v : v ? [v] : []).map((x) => clean(x, 40)).filter(Boolean).slice(0, 10);
  }
  record.consent = ["on", "yes", "true", true].includes(data.consent);
  if (!record.consent) return reply({ ok: false, error: "consent is required" }, 400, plain);
  if (kind === "founder" && !record.what) return reply({ ok: false, error: "describe what you are building" }, 400, plain);
  for (const key of ["link", "deck", "linkedin"]) {
    if (record[key] && !URLISH.test(record[key])) return reply({ ok: false, error: `${key} must be a URL` }, 400, plain);
  }
  record.submittedAt = new Date().toISOString();
  record.ip_country = request.headers.get("cf-ipcountry") || "";

  // One record per person and form: a repeat submission updates it.
  const key = `pitch:${kind}:${record.email.toLowerCase()}`;
  try {
    await env.JOIN.put(key, JSON.stringify(record, null, 2));
  } catch (error) {
    console.log("[pitch] KV write failed:", error && error.message);
    return reply({ ok: false, error: "submission could not be stored" }, 503, plain);
  }

  const label = kind === "founder" ? `Pitch: ${record.project || record.name}` : `Investor: ${record.fund || record.name}`;
  const body = Object.entries(record).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n") + `\n\nKV key: ${key}\n`;
  const mail = send(env, OPS, `${label} <${record.email}>`, body, record.email);
  if (waitUntil) waitUntil(mail); else await mail;

  return reply({ ok: true }, 200, plain, kind);
}
