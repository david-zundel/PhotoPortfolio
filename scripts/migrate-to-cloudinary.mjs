#!/usr/bin/env node
/**
 * Migration: move photos from Supabase Storage to Cloudinary.
 *
 * Default mode — for every row in `photos` whose `src` still points at Supabase Storage:
 *   1. download the original
 *   2. optionally shrink it with sharp (see --full-res / --max-edge / --quality)
 *   3. upload to Cloudinary (signed upload, public_id = the row's uuid, folder "portfolio")
 *   4. update the row's `src` + `public_id`
 *   5. (only with --delete-supabase) remove the original from the Supabase bucket
 *
 * --rematch mode — for rows ALREADY on Cloudinary, find the original still sitting in the
 *   Supabase bucket (matched by upload timestamp: the app always uploaded the file and then
 *   inserted the row a moment later) and re-upload it, overwriting the Cloudinary copy.
 *   Use this to redo a migration at a higher resolution before emptying the bucket.
 *
 * Safe to re-run: in default mode rows already on Cloudinary are skipped.
 *
 * Usage:
 *   cp .env.migrate.example .env.migrate   # fill in the values
 *   npm run migrate:cloudinary -- --dry-run
 *   npm run migrate:cloudinary
 *   npm run migrate:cloudinary -- --rematch --full-res --dry-run    # preview the re-upload
 *   npm run migrate:cloudinary -- --rematch --full-res              # do it
 *   npm run migrate:cloudinary -- --delete-supabase                 # free the Supabase space
 *
 * Options:
 *   --dry-run            download + process only; upload nothing, change nothing
 *   --full-res           upload the original bytes untouched (no resize / re-encode)
 *   --max-edge=N         longest edge in px when resizing (default 4096)
 *   --quality=N          JPEG quality when re-encoding (default 90)
 *   --rematch            see above
 *   --delete-supabase    remove the Supabase original after a successful move
 *   MIGRATE_LIMIT=N      env var: only process the first N rows
 *
 * Requires Node 20.6+ (for --env-file) and `npm install` (sharp is a devDependency).
 */

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, def) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};

const DRY_RUN = flag("dry-run");
const FULL_RES = flag("full-res");
const REMATCH = flag("rematch");
const DELETE_SUPABASE = flag("delete-supabase");
const MAX_EDGE = Number(opt("max-edge", 4096));
const JPEG_QUALITY = Number(opt("quality", 90));
const LIMIT = Number(process.env.MIGRATE_LIMIT ?? 0) || Infinity;

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const missing = Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(", ")} (see .env.migrate.example)`);
  process.exit(1);
}

const FOLDER = "portfolio";
const BUCKET = "photos";
const BUCKET_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024; // free-plan max image size
const MATCH_WINDOW_MS = 120_000; // object must have been uploaded within 2 min before its row was inserted

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fmt = (b) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(2)} MB`);
const isSupabaseUrl = (src) => src.includes(BUCKET_MARKER);
const isCloudinaryUrl = (src) => src.startsWith("https://res.cloudinary.com/");
const publicUrlFor = (path) => `${SUPABASE_URL}${BUCKET_MARKER}${encodeURIComponent(path)}`;

/** Returns { buffer, format, note }. Never enlarges; keeps PNG for images with transparency. */
const process_ = async (buffer) => {
  const meta = await sharp(buffer).metadata();
  const fmtIn = meta.format ?? "jpg";
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

  if (FULL_RES) {
    if (buffer.length > CLOUDINARY_MAX_BYTES) {
      // Too big for Cloudinary's free-plan cap: re-encode at high quality, keep dimensions.
      const out = await sharp(buffer).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
      return { buffer: out, format: "jpg", note: `re-encoded (was >10 MB), ${longest}px` };
    }
    return { buffer, format: fmtIn === "jpeg" ? "jpg" : fmtIn, note: `original, ${longest}px` };
  }

  const hasAlpha = Boolean(meta.hasAlpha);
  let pipeline = sharp(buffer)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true });
  pipeline = hasAlpha ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
  const out = await pipeline.toBuffer();
  return { buffer: out, format: hasAlpha ? "png" : "jpg", note: `${Math.min(longest, MAX_EDGE)}px q${JPEG_QUALITY}` };
};

/** Signed Cloudinary upload (needs API secret → only ever run from your machine, never in the browser). */
const uploadToCloudinary = async (buffer, publicId, format) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder: FOLDER, invalidate: "true", overwrite: "true", public_id: publicId, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const signature = createHash("sha1").update(toSign + CLOUDINARY_API_SECRET).digest("hex");

  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mime }), `${publicId}.${format}`);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", CLOUDINARY_API_KEY);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `Cloudinary upload failed (${res.status})`);
  return body; // { secure_url, public_id, bytes, width, height, ... }
};

/** Every object in the bucket root, with created_at + size. */
const listBucket = async () => {
  const all = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, offset, sortBy: { column: "created_at", order: "asc" } });
    if (error) throw error;
    all.push(...data.filter((o) => o.id)); // folders have no id
    if (data.length < 1000) break;
  }
  return all.map((o) => ({
    name: o.name,
    createdMs: new Date(o.created_at).getTime(),
    size: o.metadata?.size ?? 0,
  }));
};

/**
 * Pair each Cloudinary-migrated row with the bucket object uploaded just before the row was
 * inserted. Each object is used at most once; a row with no candidate in the window is skipped.
 */
const rematch = (rows, objects) => {
  const taken = new Set();
  const pairs = [];
  const unmatched = [];
  const sorted = [...rows].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  for (const row of sorted) {
    const rowMs = new Date(row.created_at).getTime();
    const candidates = objects
      .filter((o) => !taken.has(o.name) && o.createdMs <= rowMs + 2000 && o.createdMs >= rowMs - MATCH_WINDOW_MS)
      .sort((a, b) => b.createdMs - a.createdMs);
    if (candidates.length === 0) {
      unmatched.push(row);
      continue;
    }
    taken.add(candidates[0].name);
    pairs.push({ row, object: candidates[0], gapMs: rowMs - candidates[0].createdMs });
  }
  return { pairs, unmatched };
};

const main = async () => {
  const { data: rows, error } = await supabase
    .from("photos")
    .select("id, src, public_id, alt, created_at")
    .order("created_at");
  if (error) throw error;

  const onSupabase = rows.filter((r) => isSupabaseUrl(r.src));
  const onCloudinary = rows.filter((r) => isCloudinaryUrl(r.src));
  console.log(`${rows.length} rows: ${onSupabase.length} on Supabase Storage, ${onCloudinary.length} on Cloudinary`);
  console.log(
    `Mode: ${REMATCH ? "REMATCH (re-upload rows already on Cloudinary)" : "migrate Supabase → Cloudinary"}; ` +
      `${FULL_RES ? "full resolution, no re-encode" : `resize to ${MAX_EDGE}px, JPEG q${JPEG_QUALITY}`}`
  );
  if (DRY_RUN) console.log("DRY RUN — nothing will be uploaded or changed");
  if (DELETE_SUPABASE && !DRY_RUN) console.log("Originals WILL be deleted from the Supabase bucket after a successful move");
  console.log();

  // Build the work list: [{ row, storagePath }]
  let work = [];
  if (REMATCH) {
    const objects = await listBucket();
    console.log(`Bucket has ${objects.length} objects (${fmt(objects.reduce((s, o) => s + o.size, 0))})`);
    const { pairs, unmatched } = rematch(onCloudinary, objects);
    console.log(`Matched ${pairs.length} rows to their originals by timestamp; ${unmatched.length} unmatched\n`);
    for (const r of unmatched) console.log(`  unmatched: ${r.id}  "${r.alt ?? ""}"  (${r.created_at})`);
    if (unmatched.length) console.log();
    work = pairs.map(({ row, object, gapMs }) => ({ row, storagePath: object.name, note: `matched ${(gapMs / 1000).toFixed(1)}s before insert` }));
  } else {
    work = onSupabase.map((row) => ({ row, storagePath: decodeURIComponent(row.src.split(BUCKET_MARKER)[1] ?? "") }));
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let ok = 0;
  let failed = 0;

  for (const { row, storagePath, note } of work.slice(0, LIMIT)) {
    process.stdout.write(`${row.id}  ${storagePath}  `);
    try {
      const res = await fetch(publicUrlFor(storagePath));
      if (!res.ok) throw new Error(`download failed (${res.status})`);
      const original = Buffer.from(await res.arrayBuffer());
      const { buffer, format, note: pnote } = await process_(original);
      totalBefore += original.length;
      totalAfter += buffer.length;
      process.stdout.write(`${fmt(original.length)} → ${fmt(buffer.length)} [${pnote}${note ? `, ${note}` : ""}]  `);

      if (DRY_RUN) {
        console.log("(dry run)");
        ok++;
        continue;
      }

      const uploaded = await uploadToCloudinary(buffer, row.id, format);

      const { error: updErr } = await supabase
        .from("photos")
        .update({ src: uploaded.secure_url, public_id: uploaded.public_id })
        .eq("id", row.id);
      if (updErr) throw updErr;

      if (DELETE_SUPABASE && storagePath) {
        const { error: rmErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
        if (rmErr) console.warn(`\n  ! could not delete ${storagePath} from Supabase: ${rmErr.message}`);
      }

      console.log("✓");
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message ?? err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${ok} ${DRY_RUN ? "would be " : ""}${REMATCH ? "re-uploaded" : "migrated"}, ${failed} failed.`);
  console.log(
    `Total: ${fmt(totalBefore)} → ${fmt(totalAfter)}` +
      (totalBefore ? ` (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)` : "")
  );
  if (!DRY_RUN && !DELETE_SUPABASE && ok > 0) {
    console.log("\nOriginals are still in Supabase Storage. Once the site looks right, empty the bucket from the Supabase dashboard.");
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
