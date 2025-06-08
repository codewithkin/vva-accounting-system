import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vumba View Academy Accounting"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex h-screen flex-col md:flex-row ${inter.className}`}>
        <Sidebar />
        <main className="flex-1 overflow-auto md:ml-[10%] md:mt-0 mt-[10vh]">
          {children}
        </main>
      </body>
    </html>
  );
}
