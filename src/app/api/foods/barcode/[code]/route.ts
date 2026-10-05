import { lookupBarcode } from "@/server/food-data/import";
import { badRequest, handle, HttpError, notFound } from "@/server/http";
import { rateLimit } from "@/server/rate-limit";
import { requireUserId } from "@/server/session";

export const GET = handle(async (_req: Request, ctx: RouteContext<"/api/foods/barcode/[code]">) => {
  const userId = await requireUserId();
  rateLimit(`barcode:${userId}`, 30, 60_000);
  const { code } = await ctx.params;
  if (!/^\d{6,14}$/.test(code)) throw badRequest("Barcodes are 6 to 14 digits.");
  let food;
  try {
    food = await lookupBarcode(code, userId);
  } catch {
    throw new HttpError(502, "Couldn't reach the product database. Try again, or add it from the label.");
  }
  if (!food) throw notFound("We couldn't find that barcode.");
  return food;
});
