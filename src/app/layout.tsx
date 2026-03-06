import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShopFlow - E-Commerce Management Tool",
  description: "All-in-one e-commerce management: inventory, orders, analytics, customer support, and multi-platform integration.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
