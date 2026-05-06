import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../../../../packages/ui/src/styles/variables.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Awards Centre Management System",
  description: "Enterprise management for awards and sportswear",
};

import { AuthProvider } from "@/components/AuthContext";

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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
