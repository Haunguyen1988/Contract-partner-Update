import { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "../src/lib/session";

export const metadata: Metadata = {
  title: "PR COR Internal | Contract Management MVP",
  description: "Hệ thống quản trị hợp đồng truyền thông và ngân sách nội bộ cho PR COR.",
  keywords: ["contract", "management", "pr", "cor", "media", "budget"],
  openGraph: {
    title: "PR COR Internal | Contract Management",
    description: "Vận hành tập trung, kiểm soát minh bạch các hợp đồng và ngân sách truyền thông.",
    type: "website",
    locale: "vi_VN",
    url: "https://contract-partner.vercel.app",
    siteName: "PR COR Internal",
  },
  twitter: {
    card: "summary_large_image",
    title: "PR COR Internal",
    description: "Quản trị hợp đồng và ngân sách truyền thông tập trung.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

