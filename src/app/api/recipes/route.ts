export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") ?? "1"
  return Response.json({ page })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ data: body })
}

