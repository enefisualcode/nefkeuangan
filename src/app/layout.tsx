import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const JUDUL = "Keuangan — Hari Ini";
const KETERANGAN = "Catat lewat web atau bot Telegram — datanya menyatu.";

export const metadata: Metadata = {
  // Aplikasi pesan seperti WhatsApp butuh alamat lengkap untuk mengambil
  // gambar pratinjau; tanpa ini alamatnya jadi relatif dan gambarnya gagal muat.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://nefkeuangan-production.up.railway.app"
  ),
  title: JUDUL,
  description: KETERANGAN,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: JUDUL,
    description: KETERANGAN,
    siteName: "Keuangan",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: JUDUL,
    description: KETERANGAN,
  },
  // Supaya bisa dipasang di layar utama HP dan terbuka layar penuh,
  // sama seperti dashboard versi lama.
  appleWebApp: {
    capable: true,
    title: "Keuangan",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
