import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import QueryClientProviderWrapper from "@/providers/QueryClientWrapper";
import { Toaster } from "sonner";

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
        <QueryClientProviderWrapper>
          <Sidebar />
          <main className="flex-1 overflow-auto md:ml-[10%] md:mt-0 mt-[10vh]">
            {children}
            <Toaster richColors expand visibleToasts={10} />
          </main>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
