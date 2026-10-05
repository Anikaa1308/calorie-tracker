import type { Metadata } from "next";
import { Suspense } from "react";
import { TodayView } from "./today-view";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <Suspense>
      <TodayView />
    </Suspense>
  );
}
