import type { Metadata } from "next";
import "./globals.css";
import AppNavbar from "@/components/layout/app-navbar";

export const metadata: Metadata = {
  title: "R&D Executive Alignment Dashboard",
  description:
    "Internal tool for task logging, project alignment, and executive dashboards.",
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
