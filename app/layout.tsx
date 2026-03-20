import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/layout/app-navbar";

export const metadata: Metadata = {
  title: "READ — R&D Dashboard",
  description:
    "Execution tracking, project alignment, and executive dashboards for R&D teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <AppNavbar />
        {children}
      </body>
    </html>
  );
}
