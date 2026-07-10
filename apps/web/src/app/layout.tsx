import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listwright",
  description: "Review and normalize messy CRM lead CSV files before import.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}<Toaster position="bottom-right" richColors closeButton /></body>
    </html>
  );
}
