import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Melotech — Distribution Pipeline",
  description: "AI content distribution pipeline",
};

/**
 * Root layout for the entire Next.js application.
 *
 * Imports the global CSS with Tailwind and custom Melotech theme tokens.
 * Provides the dark background and base typography for all pages.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
