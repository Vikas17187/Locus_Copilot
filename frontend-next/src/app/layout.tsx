import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Locus Copilot - Intelligent Location Analytics",
  description: "Identify high-potential business locations with AI-powered data analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (t === 'dark' || (!t && prefersDark)) {
                  document.documentElement.classList.add('dark-theme');
                } else {
                  document.documentElement.classList.remove('dark-theme');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
