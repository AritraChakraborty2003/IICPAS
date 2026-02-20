import { NextResponse } from "next/server";

const getBackendBase = () => {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const publicApiBase = process.env.NEXT_PUBLIC_API_BASE;

  if (publicApiUrl) return publicApiUrl.replace(/\/+$/, "");
  if (publicApiBase) return publicApiBase.replace(/\/api\/?$/, "");
  return "http://localhost:8080";
};

export async function POST(request) {
  try {
    const backendBase = getBackendBase();
    const formData = await request.formData();
    const cookieHeader = request.headers.get("cookie");

    const upstreamResponse = await fetch(
      `${backendBase}/api/v1/students/profile`,
      {
        method: "POST",
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        body: formData,
      }
    );

    const rawBody = await upstreamResponse.text();
    let parsed = null;
    try {
      parsed = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      parsed = {
        message: rawBody || "Upload failed",
      };
    }

    return NextResponse.json(parsed, { status: upstreamResponse.status });
  } catch (error) {
    console.error("Student profile image proxy error:", error);
    return NextResponse.json(
      {
        message: "Profile image upload failed",
        error: error?.message || "Unknown proxy error",
      },
      { status: 500 }
    );
  }
}
