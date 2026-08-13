"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
      <p className="amharic mt-2 text-ink-900/70">የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white"
      >
        Try Again
      </button>
    </div>
  );
}
