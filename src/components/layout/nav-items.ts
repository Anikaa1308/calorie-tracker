import { BookOpen, CalendarDays, ChartLine, CookingPot, Search, Settings, User } from "lucide-react";

export const NAV = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/search", label: "Search", icon: Search },
  { href: "/history", label: "History", icon: ChartLine },
  { href: "/recipes", label: "Recipes", icon: CookingPot },
  { href: "/foods", label: "My foods", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
