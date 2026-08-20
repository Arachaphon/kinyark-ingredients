import { getAuthUserId } from "@/lib/auth-user";
import { deleteSearchHistoryParamSchema } from "@/lib/validations/search.schema";
import { deleteSearchHistoryById } from "@/lib/services/searchHistoryService";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const parsed = deleteSearchHistoryParamSchema.safeParse(resolvedParams);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid param";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { id } = parsed.data;
    const deleted = await deleteSearchHistoryById(userId, id);

    if (!deleted) {
      return Response.json({ error: "Search history entry not found" }, { status: 404 });
    }

    return Response.json({ message: "Search history entry deleted successfully", id }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/search-history/[id] error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
