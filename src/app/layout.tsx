import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./motion.css";

export const metadata: Metadata = {
  title: "Afitfix — A better campus starts with speaking up",
  description: "Report campus issues at the Air Force Institute of Technology, Kaduna, and follow their progress.",
  applicationName: "Afitfix",
  icons: { icon: "/afit-crest.png", apple: "/afit-crest.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Afitfix" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#174ea6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
