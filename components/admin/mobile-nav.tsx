"use client";

import { useState } from "react";
import Link from "next/link";

export function AdminMobileNav({ nav }: { nav: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-brand-100 bg-white px-4 py-3 lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-brand-700"
      >
        <span className="text-lg">☰</span> ማውጫ
      </button>
      {open && (
        <nav className="mt-3 space-y-1 border-t border-brand-50 pt-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-900/70 hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}