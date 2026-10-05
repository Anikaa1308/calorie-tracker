import type { Metadata } from "next";
import { RecipeView } from "./recipe-view";

export const metadata: Metadata = { title: "Recipe" };

export default async function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  return <RecipeView id={(await params).id} />;
}
