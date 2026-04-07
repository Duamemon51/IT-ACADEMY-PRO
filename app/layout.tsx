import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance System",
  description: "QR Code based Employee Attendance Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
