import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Awards Centre Management System",
  description: "Enterprise management for awards and sportswear",
};

import { AuthProvider } from "@/components/AuthContext";
import { ErrorBoundaryProvider } from "@/components/ErrorBoundaryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const settings = JSON.parse(localStorage.getItem('ac_settings'));
                  if (settings && settings.darkMode) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundaryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
