import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import Script from "next/script";
import { getTypographyCssInline } from "@/lib/typography-css";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "National Check-in Week — Student Wellbeing for Australian Schools",
    template: "%s | National Check-in Week",
  },
  description:
    "National Check-in Week (NCIW) is a FREE initiative tackling the student wellbeing crisis in Australian schools. Access free webinars, expert panels, and resources to support your whole school community.",
  keywords: [
    "National Check-in Week",
    "NCIW",
    "Australian schools wellbeing",
    "student mental health Australia",
    "school wellbeing assessment",
    "student check-in",
    "school leader wellbeing tools",
    "emotional literacy schools",
    "student voice",
    "school wellbeing data",
  ],
  metadataBase: new URL("https://nationalcheckinweek.com"),
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "National Check-in Week",
    title: "National Check-in Week — Student Wellbeing for Australian Schools",
    description:
      "A FREE national initiative empowering school leaders with real-time wellbeing data, expert webinars, and resources to ensure no child falls through the gaps.",
  },
  twitter: {
    card: "summary_large_image",
    title: "National Check-in Week — Student Wellbeing for Australian Schools",
    description:
      "Free webinars, expert panels, and wellbeing resources for Australian schools. Join the national movement for student wellbeing.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const typographyCss = await getTypographyCssInline();

  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable}`}>
      <head>
        {/* Preconnect to Google Fonts origins to eliminate DNS + TCP handshake latency */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for third-party resources */}
        <link rel="dns-prefetch" href="https://js-ap1.hsforms.net" />
        <link rel="dns-prefetch" href="https://f.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        {/* Material Symbols — display=swap prevents render-blocking */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Typography CSS inlined — eliminates render-blocking network request to /api/typography/css */}
        {typographyCss && (
          <style dangerouslySetInnerHTML={{ __html: typographyCss }} />
        )}
      </head>
      <body>
        {children}
        <Script
          src="https://lsgo-resources.s3.ap-southeast-2.amazonaws.com/utilities/lsgo_ac/lsgo_ac_global_v4.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
