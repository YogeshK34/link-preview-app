import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Link Storer",
  description: "A Web Application used to store links",
  openGraph: {
    title: "Link Storer . Store and preview links beautifully.",
    description: "Link Storer makes it effortless to store, organize, and preview your favorite links using beautiful OpenGraph cards",
    url: "https://link-store-app.vercel.app/",
    siteName: "Link Storer",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
        </ThemeProvider>
        <Toaster position='top-center' />
      </body>
    </html>
  );
}
