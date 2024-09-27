import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthProvider from "@/lib/auth/Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VxRN - Generate React Native UI",
  description: "Generate React Native UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  );
}
