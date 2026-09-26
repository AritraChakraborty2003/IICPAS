import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:3000",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:3000",
  "https://iicpa.in",
  "https://www.iicpa.in",
  "https://api.iicpa.in",
];

if (process.env.NEXT_PUBLIC_API_URL) {
  try {
    const customOrigin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
    if (!ALLOWED_ORIGINS.includes(customOrigin)) {
      ALLOWED_ORIGINS.push(customOrigin);
    }
  } catch (e) {}
}

export async function GET(request) {
  const targetUrl = request.nextUrl.searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const isAllowed = ALLOWED_ORIGINS.some(
    (origin) => parsed.origin.toLowerCase() === origin.toLowerCase()
  );

  if (!isAllowed) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: upstream.status }
      );
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Error proxying image:", targetUrl, err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
