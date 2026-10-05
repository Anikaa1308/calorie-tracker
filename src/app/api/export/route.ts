import { handle } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { exportAllJson, exportDiaryCsv } from "@/server/services/account";
import { requireUserId } from "@/server/session";

export const GET = handle(async (req: Request) => {
  const userId = await requireUserId();
  rateLimit(`export:${userId}`, 10, 60_000);
  const format = new URL(req.url).searchParams.get("format");
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    return new Response(JSON.stringify(await exportAllJson(userId), null, 2), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="plate-export-${stamp}.json"` },
    });
  }
  return new Response(await exportDiaryCsv(userId), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="plate-diary-${stamp}.csv"` },
  });
});
