import type { Metadata } from "next";
import { Inter, Noto_Serif_Ethiopic } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoEthiopic = Noto_Serif_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-serif-ethiopic",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ",
    template: "%s | ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"
  },
  description:
    "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ ላይ ኦንላይን ይመዝገቡ። Register online for training at Bete-Yared Spiritual Instruments Training Center.",
  openGraph: {
    title: "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ",
    description: "ኦንላይን ምዝገባ — Online registration and training management.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am" className={`${inter.variable} ${notoEthiopic.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
