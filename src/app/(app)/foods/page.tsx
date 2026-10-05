import type { Metadata } from "next";
import { FoodsView } from "./foods-view";

export const metadata: Metadata = { title: "My foods" };

export default function FoodsPage() {
  return <FoodsView />;
}
