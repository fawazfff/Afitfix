import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Afitfix — A better campus starts with speaking up",
  description: "A student-built campus reporting platform for the Air Force Institute of Technology, Kaduna. Report issues and follow their progress.",
  applicationName: "Afitfix",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Afitfix" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f3e9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
