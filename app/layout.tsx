//import type { Metadata } from "next";
//import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

//const geistSans = Geist({
 // variable: "--font-geist-sans",
//  subsets: ["latin"],
//});

//const geistMono = Geist_Mono({
  //variable: "--font-geist-mono",
  //subsets: ["latin"],
//});

export const metadata = {
  title: "User Information Form",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#5865f2" />
        {/* Put any global <title>, <meta> etc. here, or in `metadata` above */}
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}