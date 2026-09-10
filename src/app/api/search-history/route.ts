import { getAuthUserId } from "@/lib/auth-user";
import { saveSearchHistorySchema } from "@/lib/validations/search.schema";
import {
  saveSearchHistory,
  getSearchHistory,
  clearAllSearchHistory,
} from "@/lib/services/searchHistoryService";

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    let limit = 20;

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    const histories = await getSearchHistory(userId, limit);

    return Response.json({ data: histories }, { status: 200 });
  } catch (error) {
    console.error("GET /api/search-history error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const parsed = saveSearchHistorySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Validation failed";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const record = await saveSearchHistory(userId, parsed.data.searchQuery);

    return Response.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error("POST /api/search-history error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearAllSearchHistory(userId);

    return Response.json({ message: "Search history cleared successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/search-history error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
