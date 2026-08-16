import { NextResponse } from "next/server";

const BACKEND = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const authorization = request.headers.get("authorization") || "";
  const visitorId = request.headers.get("x-visitor-id") || "";

  if (!authorization) {
    return NextResponse.json({ error: "Inicia sesión para guardar la ubicación" }, { status: 401 });
  }

  try {
    const res = await fetch(`${BACKEND.replace(/\/$/, "")}/api/session/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        "X-Visitor-Id": visitorId,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la ubicación en el laboratorio" }, { status: 502 });
  }
}
