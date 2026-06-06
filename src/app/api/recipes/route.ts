export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? "1"
  return Response.json({ page })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ data: body })
}

// GET → เรียก action แล้ว return Response.json()
// POST → รับ request.json() → ส่งให้ action → return Response.json()
// error → return Response.json({ error }, { status: 400/401/500 })