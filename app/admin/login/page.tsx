"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      router.push(params.get("from") ?? "/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">Admin Login</h1>
        <p className="amharic mt-1 text-sm text-ink-900/60">የአስተዳዳሪ መግቢያ</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-brand-500 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
