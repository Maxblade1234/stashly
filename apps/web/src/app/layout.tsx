import type { Metadata } from "next";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Stashly — Save More at Checkout",
  description:
    "Save up to 15% at checkout with discounted gift cards. Works at Apple, Chipotle, eBay, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${ibmPlexMono.variable} antialiased`}
        style={{ backgroundColor: "#FDFAF6" }}
      >
        <Navbar />
        <main className="pt-16">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </body>
    </html>
  );
}
