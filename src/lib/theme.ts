export type ThemeChoice = "system" | "light" | "dark";

export function applyTheme(t: ThemeChoice) {
  try {
    if (t === "system") {
      delete document.documentElement.dataset.theme;
      localStorage.removeItem("plate-theme");
    } else {
      document.documentElement.dataset.theme = t;
      localStorage.setItem("plate-theme", t);
    }
  } catch {}
}
