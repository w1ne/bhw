// POST /api/upload — the file door for the production service.
//
// The upload lands in R2 under a key that the request record then cites. The
// bytes are never served back over HTTP, so a customer file cannot be guessed,
// crawled or hotlinked. To collect one:
//
//   npx wrangler r2 object get bhw-uploads/uploads/<date>/<batch>/<name>
//
// The format list is a permit list, not a blocklist: a format is accepted
// because it is named below, so adding one is a deliberate edit. `.gcode` is
// absent on purpose. Every job is resliced for the club's own machines, and
// running a stranger's toolpath breaks nozzles and parts and teaches nobody
// anything.
//
// The endpoint is public and unauthenticated, so the caps are the defence:
// 6 files, 25 MB each, 60 MB in total. A Turnstile check or an edge rate limit
// belongs in front of it before it is linked from anywhere with real traffic.
//
// The binding is optional by design. A deployment without UPLOADS (a preview,
// or the branch before the bucket exists) answers 503, and the request
// endpoint still accepts the brief without files.

const MAX_FILES = 6;
const MAX_FILE = 25 * 1024 * 1024;
const MAX_TOTAL = 60 * 1024 * 1024;

// What the club can actually work with: print files, laser vectors, drawings,
// photos of the broken thing, and a ZIP when a job is more than one file.
const EXT = new Set([
  "stl", "3mf", "step", "stp", "iges", "igs", "obj",
  "dxf", "svg", "pdf", "png", "jpg", "jpeg", "zip",
]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      // A stored key is not something a cache should keep a copy of.
      "cache-control": "no-store",
    },
  });
}

// Returns null when the extension is not on the permit list, so the caller can
// name the file it refused instead of failing the whole batch anonymously.
function safeName(raw) {
  const base = String(raw || "").split(/[\\/]/).pop().trim();
  const match = /\.([A-Za-z0-9]+)$/.exec(base);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (!EXT.has(ext)) return null;
  const stem = base.slice(0, base.length - ext.length - 1)
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+/, "")
    .slice(0, 60) || "file";
  return { name: `${stem}.${ext}`, ext };
}

export async function onRequestPost({ request, env }) {
  if (!env.UPLOADS) {
    return json({ ok: false, error: "uploads are not configured on this deployment" }, 503);
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ ok: false, error: "send the files as a multipart form" }, 415);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "could not read the upload" }, 400);
  }

  // An empty <input type=file> posts a part with an empty name; it is not a
  // file and not an error either.
  const files = form.getAll("files").filter(
    (file) => typeof file === "object" && file !== null
      && typeof file.arrayBuffer === "function" && file.name);

  if (!files.length) return json({ ok: false, error: "no files in the request" }, 400);
  if (files.length > MAX_FILES) {
    return json({ ok: false, error: `at most ${MAX_FILES} files per request` }, 400);
  }

  // Validate everything before writing anything: a batch with one bad file
  // must not leave the good ones orphaned in the bucket.
  const batch = [];
  let total = 0;
  for (const file of files) {
    const safe = safeName(file.name);
    if (!safe) {
      return json({
        ok: false,
        error: `${file.name}: that file type is not accepted — send STL, 3MF, STEP, IGES, OBJ, DXF, SVG, PDF, PNG, JPG or ZIP`,
      }, 415);
    }
    if (file.size > MAX_FILE) {
      return json({ ok: false, error: `${file.name} is larger than 25 MB` }, 413);
    }
    if (file.size === 0) {
      return json({ ok: false, error: `${file.name} is empty` }, 400);
    }
    total += file.size;
    if (total > MAX_TOTAL) {
      return json({ ok: false, error: "the batch is larger than 60 MB in total" }, 413);
    }
    batch.push({ file, safe });
  }

  const day = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  const written = [];

  for (const { file, safe } of batch) {
    const key = `uploads/${day}/${id}/${safe.name}`;
    // The length is known (a File in a parsed form), so an ArrayBuffer put is
    // exact and needs no streaming bookkeeping.
    await env.UPLOADS.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { original: String(file.name).slice(0, 200) },
    });
    written.push({ key, name: file.name, size: file.size });
  }

  return json({ ok: true, files: written });
}
