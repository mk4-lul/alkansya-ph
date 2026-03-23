"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "alkansya_fb_dismissed";

export default function FacebookCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const t = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(t);
      }
    } catch {
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative animate-[fadeSlideUp_0.4s_ease-out]">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <a
        href="https://www.facebook.com/alkansya/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-white rounded-[16px] shadow-lg px-5 py-4 no-underline hover:shadow-xl transition-shadow"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-[#1877F2]">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1a1a1a]">Follow Alkansya.ph on Facebook</p>
          <p className="text-[11px] text-[#888]">For money tips and market updates</p>
        </div>
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-[#ccc]">
          <path d="M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.41 1.41l4.59-4.59a1 1 0 0 0 0-1.41L10.7 6.71a1 1 0 0 0-1.41 0z"/>
        </svg>
      </a>
      <button
        onClick={dismiss}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 24 24" className="w-3 h-3 fill-[#999]">
          <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/>
        </svg>
      </button>
    </div>
  );
}
