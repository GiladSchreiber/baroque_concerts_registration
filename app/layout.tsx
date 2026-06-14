import type { Metadata } from "next";
import { Geist, Assistant } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const assistant = Assistant({
  subsets: ["latin", "hebrew"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baroque Concerts | קונצרטים בארוקיים",
  description: "Register for baroque concert performances",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geist.variable} ${assistant.variable} h-full`}
    >
      <body className="min-h-full bg-navy text-cream antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
