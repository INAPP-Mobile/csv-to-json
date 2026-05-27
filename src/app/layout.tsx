import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@freeqone/ui-theme/ThemeToggle";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSV to JSON Converter — freeq.one",
  description: "Convert CSV to JSON and JSON to CSV instantly. Support for comma, tab, and custom delimiters. Part of the freeq.one tools suite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full text-white" style={{background: "var(--bg-body)"}}>
        <link rel="stylesheet" href="https://freeq.one/theme.css" />
        <script dangerouslySetInnerHTML={{ __html: '(function(){var t=localStorage.getItem("freeq-theme")||"dark";document.documentElement.setAttribute("data-theme",t);})()' }} />
        <ThemeToggle />
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </body>
    </html>
  );
}
