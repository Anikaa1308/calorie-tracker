import type { Metadata } from "next";
import { EditFoodView } from "./edit-food-view";

export const metadata: Metadata = { title: "Edit food" };

export default async function EditFoodPage({ params }: PageProps<"/foods/[id]/edit">) {
  return <EditFoodView id={(await params).id} />;
}
