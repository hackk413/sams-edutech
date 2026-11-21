import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs";
import path from "node:path";
import { verifyAdminSessionToken } from "@/lib/crypto";
import { saveUpiConfig } from "@/lib/payments";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sams_admin_session")?.value;
  if (!verifyAdminSessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized. Admin session required." }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    let fileBuffer: Buffer | null = null;
    let fileExt = "png";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No image file provided in upload" }, { status: 400 });
      }

      const mimeType = file.type;
      if (!mimeType.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files (PNG, JPG, WebP, SVG) are allowed." }, { status: 400 });
      }

      if (mimeType.includes("jpeg") || mimeType.includes("jpg")) fileExt = "jpg";
      else if (mimeType.includes("webp")) fileExt = "webp";
      else if (mimeType.includes("svg")) fileExt = "svg";
      else fileExt = "png";

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON with base64 dataUrl
      const body = await request.json();
      const { dataUrl } = body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return NextResponse.json({ error: "No image data URL provided." }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json({ error: "Invalid image format." }, { status: 400 });
      }
      fileExt = matches[1] === "jpeg" ? "jpg" : matches[1];
      fileBuffer = Buffer.from(matches[2], "base64");
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Empty image data." }, { status: 400 });
    }

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save with timestamped filename and constant filename for stability
    const fileName = `upi-qr-${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);

    // Also overwrite canonical public/uploads/upi-qr.png
    const canonicalPath = path.join(uploadsDir, "upi-qr.png");
    fs.writeFileSync(canonicalPath, fileBuffer);

    const publicUrl = `/uploads/${fileName}`;

    // Update UPI config
    const updated = await saveUpiConfig({
      qr_image_url: publicUrl,
    });

    return NextResponse.json({
      success: true,
      message: "Personal UPI QR code uploaded and activated successfully!",
      qr_image_url: publicUrl,
      config: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error uploading QR image";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
