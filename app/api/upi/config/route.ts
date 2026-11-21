import { NextResponse } from "next/server";
import { getUpiConfig } from "@/lib/payments";

export async function GET() {
  try {
    const config = await getUpiConfig();
    return NextResponse.json({
      upi_id: config.upi_id,
      payee_name: config.payee_name,
      qr_image_url: config.qr_image_url,
      auto_enroll: config.auto_enroll,
      instructions: config.instructions,
      active: config.active,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching UPI config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
