import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HydrationGuard } from "@/components/layout/hydration-guard";
import { AuthGuard } from "@/components/layout/auth-guard";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LexOps — Legal Operations Platform",
  description:
    "Streamline legal operations with case management, client tracking, finance, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HydrationGuard>
          <AuthGuard>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthGuard>
        </HydrationGuard>
      </body>
    </html>
  );
}
