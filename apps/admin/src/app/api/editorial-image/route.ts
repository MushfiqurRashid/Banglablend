import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sourcePath = request.nextUrl.searchParams.get("src");
  if (!sourcePath?.startsWith("/images/") || sourcePath.includes("..")) {
    return NextResponse.json({ error: "Invalid editorial image path." }, { status: 400 });
  }

  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim();
  if (!storefrontUrl) return NextResponse.json({ error: "Storefront URL is not configured." }, { status: 503 });

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(sourcePath, `${storefrontUrl.replace(/\/+$/, "")}/`);
  } catch {
    return NextResponse.json({ error: "Invalid editorial image URL." }, { status: 400 });
  }

  const response = await fetch(sourceUrl, { next: { revalidate: 3600 } });
  if (!response.ok) return NextResponse.json({ error: "Editorial image was not found." }, { status: response.status });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Editorial asset is not an image." }, { status: 415 });

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
