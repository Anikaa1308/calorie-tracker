import type { Metadata } from "next";
import { NewFoodView } from "./new-food-view";

export const metadata: Metadata = { title: "New food" };

export default async function NewFoodPage({ searchParams }: PageProps<"/foods/new">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <NewFoodView defaults={{ name: one(sp.name), brand: one(sp.brand), barcode: one(sp.barcode) }} />;
}
