// POST /api/founding — founding-member signup for the egyesület.
//
// Same JOIN KV namespace as /api/join, keyed founding:<email>. GET export is
// token-gated with JOIN_TOKEN and returns only founding: keys as CSV.
// Each signup emails the club inbox (see lib/mail.js), Reply-To the signer.
//
// Bindings: JOIN (KV), MAILER (service). Secrets: JOIN_TOKEN.
//
//   curl "https://bhw.hu/api/founding?token=$JOIN_TOKEN" -o founding.csv

import { send, OPS } from "../../lib/mail.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DUES = new Set(["~5k HUF", "~10k HUF", "~15k+ HUF", "not sure"]);

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
  if (!truthy(data.consent)) {
    return json({ ok: false, error: "consent is required" }, 400);
  }

  const duesRaw = String(data.dues || "").trim();
  const dues = DUES.has(duesRaw) ? duesRaw : "";
  const notes = String(data.notes || "").trim().replace(/[\r\n]+/g, " ").slice(0, 1000);

  const record = {
    name,
    email,
    dues,
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
    "submitted_at,name,email,dues,notes,country",
    ...rows
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .map((r) =>
        [r.submittedAt, r.name, r.email, r.dues || "", r.notes || "", r.ip_country]
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
  return [
    `${record.name} <${record.email}>`,
    "",
    `Founding interest on bhw.hu on ${record.submittedAt}`,
    record.dues ? `Dues they could pay: ${record.dues}` : null,
    record.notes ? `Note: ${record.notes}` : null,
    record.ip_country ? `Country: ${record.ip_country}` : null,
    "",
    "--",
    `Reply to this mail and it goes to them: ${record.email}`,
    `KV key: ${key}`,
  ].filter((line) => line !== null).join("\n");
}
