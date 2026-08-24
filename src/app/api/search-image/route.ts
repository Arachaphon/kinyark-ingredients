import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "thai food";

  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&gsrlimit=4&prop=imageinfo&iiprop=url&format=json&origin=*`;

    const res = await fetch(url);
    const data = await res.json();

    const pages = data.query?.pages || {};
    const images = Object.values(pages).map(
      (page: any) => page.imageinfo?.[0]?.url
    ).filter(Boolean);

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}