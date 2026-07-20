// POST /api/interest — stores hackathon interest signups in the INTEREST KV namespace.
// Requires a KV binding named INTEREST on the Cloudflare Pages project.

const MAX = { name: 120, email: 200, notes: 1000 };

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const clean = (value, limit) => String(value ?? '').trim().slice(0, limit);

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  // Honeypot: real people never fill a hidden field.
  if (clean(payload.company_website, 100)) return json({ ok: true }, 200);

  const name = clean(payload.name, MAX.name);
  const email = clean(payload.email, MAX.email);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'name and a valid email are required' }, 400);
  }

  if (!env.INTEREST) return json({ error: 'storage not configured' }, 500);

  const entry = {
    name,
    email,
    background: clean(payload.background, 40),
    team: clean(payload.team, 40),
    dates: Array.isArray(payload.dates) ? payload.dates.slice(0, 10).map((d) => clean(d, 40)) : [],
    notes: clean(payload.notes, MAX.notes),
    submittedAt: new Date().toISOString(),
    country: request.headers.get('cf-ipcountry') || ''
  };

  // Key on the email so a repeat submission updates rather than duplicates.
  await env.INTEREST.put(`interest:${email.toLowerCase()}`, JSON.stringify(entry));

  return json({ ok: true }, 200);
}

// GET /api/interest?token=... — export signups as CSV. Requires INTEREST_TOKEN secret.
export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.INTEREST_TOKEN || token !== env.INTEREST_TOKEN) {
    return new Response('not found', { status: 404 });
  }
  if (!env.INTEREST) return json({ error: 'storage not configured' }, 500);

  const { keys } = await env.INTEREST.list({ prefix: 'interest:' });
  const rows = await Promise.all(keys.map((k) => env.INTEREST.get(k.name, 'json')));

  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    'submitted_at,name,email,background,team,dates,notes,country',
    ...rows
      .filter(Boolean)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
      .map((r) =>
        [r.submittedAt, r.name, r.email, r.background, r.team, (r.dates || []).join(' '), r.notes, r.country]
          .map(cell)
          .join(',')
      )
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bhw-hackathon-interest.csv"'
    }
  });
}
