import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/health — lightweight health check that touches the DB
export async function GET() {
  try {
    // Minimal query to verify database connectivity
    await prisma.user.count();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("/api/health check failed", error);
    return NextResponse.json(
      { ok: false, error: "Backend or database not reachable" },
      { status: 503 }
    );
  }
}

