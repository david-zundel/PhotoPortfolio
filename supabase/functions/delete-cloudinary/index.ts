// Supabase Edge Function: delete a Cloudinary asset by public_id.
//
// Cloudinary's destroy API needs the API secret, which must never be shipped to the
// browser, so the admin page calls this function instead. Supabase verifies the
// caller's JWT before the function runs (default `verify_jwt = true`), so only a
// signed-in admin can reach it.
//
// Deploy:
//   supabase functions deploy delete-cloudinary
//   supabase secrets set CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const sha1Hex = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!cloudName || !apiKey || !apiSecret) {
    return json({ error: "Cloudinary secrets not configured on the function" }, 500);
  }

  let publicId: unknown;
  try {
    ({ public_id: publicId } = await req.json());
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (typeof publicId !== "string" || publicId.length === 0) {
    return json({ error: "public_id is required" }, 400);
  }

  // Signed request: sha1("<params sorted>&<api_secret>") — see Cloudinary "Authentication signatures".
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1Hex(toSign);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("invalidate", "true");
  form.append("timestamp", timestamp);
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) return json({ error: body?.error?.message ?? `Cloudinary responded ${res.status}` }, 502);
  // Cloudinary returns { result: "ok" } or { result: "not found" }
  return json({ result: body.result ?? "unknown" });
});
