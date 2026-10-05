import { AddFoodProvider } from "@/components/food-search/add-food-provider";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { KeyboardShortcuts } from "@/components/layout/shortcuts";
import { ThemeSync } from "@/components/providers/theme-sync";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AddFoodProvider>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="min-h-dvh lg:pl-60">
        <AppSidebar />
        <main id="main" tabIndex={-1} className="pb-28 focus:outline-none lg:pb-16">{children}</main>
        <MobileNav />
      </div>
      <KeyboardShortcuts />
      <ThemeSync />
    </AddFoodProvider>
  );
}
