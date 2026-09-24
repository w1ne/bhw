// POST /api/join — association signup from the homepage Join section.
//
// One intake and one store: the record goes to the JOIN KV namespace and a
// notification goes to the club inbox with Reply-To set to the signer. The
// list is read back only through the token-gated CSV export below.
//
// Bindings: JOIN (KV).
// Secrets: JOIN_TOKEN guards the export.
//
// Export the list from a machine with a Cloudflare session:
//
//   curl "https://bhw.hu/api/join?token=$JOIN_TOKEN" -o join.csv
//
// Past 900 signups the HTTP export returns 503 (KV caps a Worker invocation
// at 1,000 operations); read the namespace with `wrangler kv key list/get`
// instead.

import { send, OPS } from "../../lib/mail.js";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
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
  // Reject overlong input instead of truncating it: a truncated address is a
  // different address. The byte check keeps the KV key under its 512-byte cap.
  if (!EMAIL.test(email) || email.length > 254 || new TextEncoder().encode(email).length > 500) {
    return json({ ok: false, error: "a valid email is required" }, 400);
  }

  const record = {
    name,
    email,
    submittedAt: new Date().toISOString(),
    ip_country: request.headers.get("cf-ipcountry") || "",
  };

  // Keyed by the lowercased address: a repeat signup updates the record
  // instead of duplicating it.
  const key = `join:${email.toLowerCase()}`;
  try {
    await env.JOIN.put(key, JSON.stringify(record, null, 2));
  } catch (error) {
    console.log("[join] KV write failed:", error && error.message);
    return json({ ok: false, error: "signup could not be stored" }, 503);
  }

  // The record is safe now. The mail goes out after the response, so a slow
  // send never becomes a slow form. send() swallows its own failures.
  const mail = send(env, OPS, `Join: ${name} <${email}>`, bodyFor(record, key), email);
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
    page = await env.JOIN.list({ prefix: "join:" });
  } catch (error) {
    console.log("[join] KV list failed:", error && error.message);
    return json({ error: "storage unavailable" }, 503);
  }

  // KV caps a Worker invocation at 1,000 operations, so a one-shot HTTP
  // export stops being safe well before the list gets big. Say so instead
  // of silently truncating; the wrangler path in the README has no cap.
  if (!page.list_complete || page.keys.length > 900) {
    return json({ error: "list is too large for the HTTP export; use wrangler kv" }, 503);
  }

  let rows;
  try {
    rows = (await Promise.all(page.keys.map((k) => env.JOIN.get(k.name, "json")))).filter(Boolean);
  } catch (error) {
    console.log("[join] KV read failed:", error && error.message);
    return json({ error: "storage unavailable" }, 503);
  }

  if (rows.length !== page.keys.length) {
    console.log("[join] dropped", page.keys.length - rows.length, "unreadable record(s) from the export");
  }

  // A leading =, +, - or @ is evaluated as a formula by Excel or Sheets when
  // the operator opens the export; neutralize it.
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    "submitted_at,name,email,country",
    ...rows
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .map((r) => [r.submittedAt, r.name, r.email, r.ip_country].map(cell).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bhw-join.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// ------------------------------------------------------------------- the mail
// Written to be actionable from the phone: reply goes straight to the signer.

function bodyFor(record, key) {
  return [
    `${record.name} <${record.email}>`,
    "",
    `Wants to join the association. Signed up on bhw.hu on ${record.submittedAt}`,
    record.ip_country ? `Country: ${record.ip_country}` : null,
    "",
    "--",
    `Reply to this mail and it goes to them: ${record.email}`,
    `KV key: ${key}`,
  ].filter((line) => line !== null).join("\n");
}
