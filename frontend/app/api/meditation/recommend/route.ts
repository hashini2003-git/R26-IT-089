import { NextResponse } from "next/server";

const configuredBackend = process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;
const backendCandidates = Array.from(
  new Set(
    [configuredBackend, "http://127.0.0.1:8001", "http://127.0.0.1:8000"].filter(
      (value): value is string => Boolean(value),
    ),
  ),
);

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid recommendation request." }, { status: 400 });
  }

  for (const backendUrl of backendCandidates) {
    try {
      const response = await fetch(`${backendUrl.replace(/\/$/, "")}/meditation/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const body = await response.text();

      return new NextResponse(body, {
        status: response.status,
        headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { detail: "Meditation recommendation service is unavailable. Start the FastAPI backend." },
    { status: 503 },
  );
}
