import { prisma } from "@/lib/prisma"
import { cache } from "@/lib/cache"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const TTL_HEALTH = 15_000

export async function GET() {
  try {
    // Liveness ping only — cache briefly so load tests and frequent
    // polling don't pay a full DB round-trip every hit.
    await cache.getOrSet("health:status", TTL_HEALTH, TTL_HEALTH, async () => {
      await prisma.$queryRaw`SELECT 1`
      return true
    })
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    )
  }
}
