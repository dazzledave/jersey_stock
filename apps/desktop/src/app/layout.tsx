import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../../../../packages/ui/src/styles/variables.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Awards Centre Management System",
  description: "Enterprise management for awards and sportswear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
