import type { Metadata } from "next";
import { Montserrat, Poppins, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
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
  metadataBase: new URL("https://schoolswellbeing.com.au"),
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${poppins.variable} ${inter.variable} ${cormorant.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
