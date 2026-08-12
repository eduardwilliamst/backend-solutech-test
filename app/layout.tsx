import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solutech Backend Test",
  description: "E-commerce backend API for the Solutech technical test",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
