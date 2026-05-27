"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem("freeq-theme") || "dark";
    setDark(t !== "light");
    document.documentElement.setAttribute("data-theme", t);
  }, []);
  return (
    <button
      onClick={() => {
        const next = dark ? "light" : "dark";
        setDark(!dark);
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("freeq-theme", next);
      }}
      className="fixed top-4 right-4 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-gray-800/80 border border-gray-700 text-white text-sm cursor-pointer hover:bg-gray-700 transition-colors"
      title="Toggle theme"
    >
      {dark ? "\u263E" : "\u2600"}
    </button>
  );
}
