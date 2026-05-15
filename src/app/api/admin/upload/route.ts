import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin, sanitizeFilename } from "@/lib/auth";

const BUCKET = "avatars";
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// POST /api/admin/upload — upload an image to Supabase Storage
export const POST = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();

  // Ensure the bucket exists (idempotent)
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    const { error: createErr } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    });
    if (createErr) {
      return NextResponse.json({ error: `Bucket error: ${createErr.message}` }, { status: 500 });
    }
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "ambassadors";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPG, PNG, WebP, or GIF." }, { status: 400 });
  }

  // Validate size
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 400 });
  }

  // Sanitize filename and validate extension (prevents .jpg.php bypass)
  const sanitized = sanitizeFilename(file.name, ALLOWED_EXTENSIONS);
  if (!sanitized.valid) {
    return NextResponse.json({ error: sanitized.error }, { status: 400 });
  }

  // Use UUID-based filename to prevent path traversal and predictable names
  const ext = sanitized.safe.split(".").pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadErr } = await sb.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(fileName);

  return NextResponse.json({ url: urlData.publicUrl });
});
