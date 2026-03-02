import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Schools Wellbeing Australia — The State of Our Students",
    template: "%s | Schools Wellbeing Australia",
  },
  description:
    "Data-driven analysis of mental health and wellbeing challenges facing Australian school children. Covering anxiety, bullying, cyberbullying, school refusal, attendance, and more — backed by AIHW, Mission Australia, eSafety Commissioner, and RoGS 2026 data.",
  keywords: [
    "Australian schools wellbeing",
    "child mental health Australia",
    "school bullying data",
    "cyberbullying Australia",
    "school refusal",
    "youth anxiety",
    "AIHW",
    "Mission Australia",
    "student mental health",
    "school attendance",
  ],
  metadataBase: new URL("https://schoolswellbeing.com.au"),
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Schools Wellbeing Australia",
    title: "Schools Wellbeing Australia — The State of Our Students",
    description:
      "One in seven Australian children has a mental disorder. Track the 15 priority wellbeing issues facing students across every state and territory.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Schools Wellbeing Australia — The State of Our Students",
    description:
      "Data on mental health, bullying, cyberbullying, school refusal, attendance and more across Australian schools.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
