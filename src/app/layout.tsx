import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { initializeApp } from "@/lib/startup";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskGrid - CPA Practice Management",
  description: "Manage your CPA practice with ease - clients, projects, documents, and team all in one place.",
};

// Initialize application on server startup
if (typeof window === 'undefined') {
  initializeApp();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
