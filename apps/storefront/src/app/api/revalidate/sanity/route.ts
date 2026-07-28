import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export async function POST(request: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-bangla-blend-signature");
  const body = await request.text();
  if (!secret || !signature) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  revalidateTag("sanity", "max");
  return NextResponse.json({ revalidated: true });
}
