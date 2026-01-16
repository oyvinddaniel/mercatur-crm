import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercatur CRM",
  description: "Internal CRM system for customer management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
