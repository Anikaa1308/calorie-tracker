import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Plate", template: "%s · Plate" },
  description: "A calm calorie and macro tracker that knows roti, dal and paneer as well as oats and Greek yogurt.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e3" },
    { media: "(prefers-color-scheme: dark)", color: "#151411" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Applies a saved theme choice before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("plate-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
