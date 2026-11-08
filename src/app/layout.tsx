import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = { title: { default: "Jarvis", template: "%s · Jarvis" }, description: "A calm command center for your schedule, work, and life." };
const themeScript = `try{const saved=localStorage.getItem('jarvis-theme');const dark=saved==='dark'||(!saved&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark)}catch(_){}`;
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body><Script id="theme-init" strategy="beforeInteractive">{themeScript}</Script>{children}</body></html>; }
