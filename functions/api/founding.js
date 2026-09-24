// POST /api/founding — association founding-member / dues LOI interest.
//
// Same JOIN KV namespace as /api/join, keyed founding:<email>. GET export is
// token-gated with JOIN_TOKEN and returns only founding: keys as CSV.
//
// Bindings: JOIN (KV). Secrets: JOIN_TOKEN.
//
//   curl "https://bhw.hu/api/founding?token=$JOIN_TOKEN" -o founding.csv

import { send, OPS } from "../../lib/mail.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = new Set([
  "Firmware",
  "Electronics & PCB",
  "Mechanical",
  "Embedded software",
  "Other",
]);
const DUES = new Set(["~5k HUF", "~10k HUF", "~15k+ HUF", "not sure"]);
const HELP = new Set(["venue", "sponsor", "talks", "legal", "other"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function truthy(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.JOIN) {
    return json({ ok: false, error: "signups are not configured on this deployment" }, 503);
  }

  let data;
  try {
    const contentType = request.headers.get("content-type") || "";
    data = contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());
  } catch {
    return json({ ok: false, error: "could not read the form" }, 400);
  }
  if (!data || typeof data !== "object") {
    return json({ ok: false, error: "could not read the form" }, 400);
  }

  // Honeypot: a real person never sees this field. Pretend success so a bot
  // has nothing to learn from a rejection.
  if (String(data.bhw_hp || "").trim()) return json({ ok: true });

  const name = String(data.name || "").trim().replace(/[\r\n\t]+/g, " ").slice(0, 200);
  const email = String(data.email || "").trim();

  if (!name) return json({ ok: false, error: "name is required" }, 400);
  if (!EMAIL.test(email) || email.length > 254 || new TextEncoder().encode(email).length > 500) {
    return json({ ok: false, error: "a valid email is required" }, 400);
  }

  const intentFounding = truthy(data.intent_founding);
  const intentDues = truthy(data.intent_dues);
  if (!intentFounding && !intentDues) {
    return json({ ok: false, error: "pick at least one intent" }, 400);
  }

  if (!truthy(data.consent)) {
    return json({ ok: false, error: "consent is required" }, 400);
  }

  const roleRaw = String(data.role || "").trim();
  const role = ROLES.has(roleRaw) ? roleRaw : "";

  const duesRaw = String(data.dues || "").trim();
  const dues = DUES.has(duesRaw) ? duesRaw : "";

  let helpList = Array.isArray(data.help) ? data.help : data.help ? [data.help] : [];
  helpList = [...new Set(helpList.map((h) => String(h).trim()).filter((h) => HELP.has(h)))];

  const notes = String(data.notes || "").trim().replace(/[\r\n]+/g, " ").slice(0, 1000);

  const record = {
    name,
    email,
    role,
    intent_founding: intentFounding,
    intent_dues: intentDues,
    dues,
    help: helpList,
    notes,
    consent: true,
    submittedAt: new Date().toISOString(),
    ip_country: request.headers.get("cf-ipcountry") || "",
  };

  const key = `founding:${email.toLowerCase()}`;
  try {
    await env.JOIN.put(key, JSON.stringify(record, null, 2));
  } catch (error) {
    console.log("[founding] KV write failed:", error && error.message);
    return json({ ok: false, error: "signup could not be stored" }, 503);
  }

  const mail = send(env, OPS, `Founding: ${name} <${email}>`, bodyFor(record, key), email);
  if (waitUntil) waitUntil(mail); else await mail;

  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get("token");
  if (!env.JOIN_TOKEN || token !== env.JOIN_TOKEN) {
    return new Response("not found", { status: 404 });
  }
  if (!env.JOIN) return json({ error: "storage not configured" }, 500);

  let page;
  try {
    page = await env.JOIN.list({ prefix: "founding:" });
  } catch (error) {
    console.log("[founding] KV list failed:", error && error.message);
    return json({ error: "storage unavailable" }, 503);
  }

  if (!page.list_complete || page.keys.length > 900) {
    return json({ error: "list is too large for the HTTP export; use wrangler kv" }, 503);
  }

  let rows;
  try {
    rows = (await Promise.all(page.keys.map((k) => env.JOIN.get(k.name, "json")))).filter(Boolean);
  } catch (error) {
    console.log("[founding] KV read failed:", error && error.message);
    return json({ error: "storage unavailable" }, 503);
  }

  if (rows.length !== page.keys.length) {
    console.log("[founding] dropped", page.keys.length - rows.length, "unreadable record(s) from the export");
  }

  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    "submitted_at,name,email,role,intent_founding,intent_dues,dues,help,notes,country",
    ...rows
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .map((r) =>
        [
          r.submittedAt,
          r.name,
          r.email,
          r.role || "",
          r.intent_founding ? "yes" : "no",
          r.intent_dues ? "yes" : "no",
          r.dues || "",
          Array.isArray(r.help) ? r.help.join(";") : "",
          r.notes || "",
          r.ip_country,
        ]
          .map(cell)
          .join(",")
      ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bhw-founding.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function bodyFor(record, key) {
  const intents = [
    record.intent_founding ? "founding member" : null,
    record.intent_dues ? "dues LOI" : null,
  ].filter(Boolean).join(", ");
  return [
    `${record.name} <${record.email}>`,
    "",
    `Founding interest on bhw.hu on ${record.submittedAt}`,
    `Intents: ${intents}`,
    record.role ? `Role: ${record.role}` : null,
    record.dues ? `Dues band: ${record.dues}` : null,
    record.help && record.help.length ? `Help: ${record.help.join(", ")}` : null,
    record.notes ? `Notes: ${record.notes}` : null,
    record.ip_country ? `Country: ${record.ip_country}` : null,
    "",
    "--",
    `Reply to this mail and it goes to them: ${record.email}`,
    `KV key: ${key}`,
  ].filter((line) => line !== null).join("\n");
}
