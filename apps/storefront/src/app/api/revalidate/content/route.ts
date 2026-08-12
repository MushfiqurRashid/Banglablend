import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// Called by the content-publishing admin app after a publish/verify action, so cached storefront
// content (revalidate: 120, tag "content" -- see lib/content/client.ts) doesn't wait out the full
// TTL. Auth is a shared secret rather than Sanity's per-payload HMAC since there's no longer a
// single trusted webhook sender signing each request; both apps hold REVALIDATE_SECRET.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret");
  // Local development can run the two apps without a shared secret. Production always requires
  // the configured secret so public callers cannot trigger storefront cache invalidations.
  const localDevelopmentWithoutSecret = process.env.NODE_ENV !== "production" && !secret;
  if (!localDevelopmentWithoutSecret && (!secret || !provided || !safeEqual(provided, secret))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  revalidateTag("content", "max");
  return NextResponse.json({ revalidated: true });
}
