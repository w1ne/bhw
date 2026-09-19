// POST /api/request — the production-service brief.
//
// One intake and one store: the record goes to the REQUESTS KV namespace and a
// notification goes to the club inbox. Files are cited by R2 key only; the
// bytes never pass through this endpoint. Nothing reads requests back over
// HTTP, so there is deliberately no GET handler and no public list.
//
// Bindings: REQUESTS (KV). The UPLOADS binding belongs to /api/upload.
// Secrets: SMTP_PASSWORD; optional SMTP_USER and REQUEST_TO.
//
// Read the archive from a machine with a Cloudflare session:
//
//   npx wrangler kv namespace list
//   npx wrangler kv key list --namespace-id <id>
//   npx wrangler kv key get  --namespace-id <id> "request:..."

import { send, OPS } from "../../lib/mail.js";

const FIELDS = [
  "name", "email", "org", "entry", "process", "material",
  "quantity", "timeline", "budget", "application",
];

// A file key is accepted only if it has the shape /api/upload writes, so a
// hand-made request cannot point a record at an arbitrary object.
const FILE_KEY = /^uploads\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/;
const MAX_FILES = 6;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.REQUESTS) {
    return json({ ok: false, error: "requests are not configured on this deployment" }, 503);
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

  const name = String(data.name || "").trim();
  const email = String(data.email || "").trim();
  const application = String(data.application || "").trim();

  if (!name) return json({ ok: false, error: "name is required" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "a valid email is required" }, 400);
  }
  if (application.length < 10) {
    return json({ ok: false, error: "please describe what you need made" }, 400);
  }

  const record = { received: new Date().toISOString() };
  for (const field of FIELDS) record[field] = String(data[field] ?? "").slice(0, 2000);
  record.ip_country = request.headers.get("cf-ipcountry") || "";

  // Keys only, and only ones with the shape /api/upload writes. The bytes stay
  // in R2; a brief that cites no valid file is still a brief.
  record.files = (Array.isArray(data.files) ? data.files : [])
    .map((file) => String(file || ""))
    .filter((key) => FILE_KEY.test(key))
    .slice(0, MAX_FILES);

  // Timestamp first so a key list comes back in order; a random suffix keeps
  // two requests in the same millisecond from overwriting each other.
  const key = `request:${record.received}:${crypto.randomUUID().slice(0, 8)}`;
  await env.REQUESTS.put(key, JSON.stringify(record, null, 2));

  // The record is safe now. The mail goes out after the response, so a slow
  // SMTP handshake never becomes a slow form. send() swallows its own failures.
  const to = env.REQUEST_TO || OPS;
  const mail = send(env, to, subjectFor(record), bodyFor(record, key), record.email);
  if (waitUntil) waitUntil(mail); else await mail;

  return json({ ok: true });
}

// ------------------------------------------------------------------- the mail
// Written to be actionable from the phone: everything the request said, in the
// order you would ask it, with Reply-To already pointing at the person.

function subjectFor(record) {
  const who = record.org ? `${record.name}, ${record.org}` : record.name;
  const count = (record.files || []).length;
  const files = count ? ` (+${count} file${count === 1 ? "" : "s"})` : "";
  return `Job: ${record.process || record.entry || "request"}${files} — ${who}`;
}

function line(label, value) {
  return value ? `${label}: ${value}` : null;
}

function bodyFor(record, key) {
  const rows = [
    line("Has", record.entry),
    line("Process", record.process),
    line("Material", record.material),
    line("How many", record.quantity),
    line("When", record.timeline),
    line("Budget", record.budget),
    line("Country", record.ip_country),
    "",
    record.application ? `What they need:\n${record.application}` : null,
    record.files && record.files.length
      ? `\nFiles, private in R2:\n${record.files.map((file) => `  ${file}`).join("\n")}`
      : null,
  ];

  return [
    `${record.name} <${record.email}>`,
    "",
    ...rows.filter((row) => row !== null),
    "",
    "--",
    `Reply to this mail and it goes to them: ${record.email}`,
    `KV key: ${key}`,
  ].join("\n");
}
