import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
        <script src="https://freeq.one/theme-toggle.js" />
        <script dangerouslySetInnerHTML={{ __html: '(function(){var t=localStorage.getItem("freeq-theme")||"dark";document.documentElement.setAttribute("data-theme",t);})()' }} />
        <button id="theme-toggle-btn" className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full border text-sm cursor-pointer" style={{borderColor:"rgba(255,255,255,0.2)",background:"rgba(55,65,81,0.8)",color:"#fff",lineHeight:"1"}}>
          {"\u263E"}
        </button>
        {children}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      </body>
    </html>
  );
}
