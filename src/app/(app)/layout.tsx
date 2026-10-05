import { AddFoodProvider } from "@/components/food-search/add-food-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { KeyboardShortcuts } from "@/components/layout/shortcuts";
import { ThemeSync } from "@/components/providers/theme-sync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AddFoodProvider>
      <div className="min-h-dvh lg:pl-60">
        <AppSidebar />
        <main className="pb-28 lg:pb-16">{children}</main>
        <MobileNav />
      </div>
      <KeyboardShortcuts />
      <ThemeSync />
    </AddFoodProvider>
  );
}
