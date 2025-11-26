import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ToastProvider } from "../context/ToastContext";
import { PrivacyProvider } from "../context/PrivacyContext";
import PrivacyCurtain from "../components/PrivacyCurtain";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Goal Master",
  description: "IEP Goal Tracking Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-200 transition-colors duration-300`}
      >
        <Providers>
          <ToastProvider>
            <PrivacyProvider>
              <PrivacyCurtain />
              {children}
            </PrivacyProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
