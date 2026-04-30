import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GolfDraw — Play. Win. Give.",
  description:
    "Golf performance tracking meets monthly prize draws and charitable giving.",
  openGraph: {
    title: "GolfDraw — Play. Win. Give.",
    description: "Monthly golf draw with charity impact",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
