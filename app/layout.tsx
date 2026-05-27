import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pilot Briefing Centre",
  description:
    "Retrieve real-time METAR, TAF, and SIGMET reports for airports and countries. Enter ICAO airport codes and WMO country codes to generate an aviation weather briefing.",
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
