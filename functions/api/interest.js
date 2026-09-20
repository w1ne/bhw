// GET /api/interest?token=... — CSV export of the hackathon interest list that
// the old homepage form collected. The form is retired now that the event is
// live on Luma, so there is no POST handler any more: nothing can write to the
// INTEREST KV namespace, and this endpoint only reads what is already there.
// Once the list has been exported and mailed, this file and the KV namespace
// can go.

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.INTEREST_TOKEN || token !== env.INTEREST_TOKEN) {
    return new Response('not found', { status: 404 });
  }
  if (!env.INTEREST) return json({ error: 'storage not configured' }, 500);

  const { keys } = await env.INTEREST.list({ prefix: 'interest:' });
  const rows = await Promise.all(keys.map((k) => env.INTEREST.get(k.name, 'json')));

  // A leading =, +, - or @ is evaluated as a formula by Excel or Sheets when
  // the operator opens the export; neutralize it.
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
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
