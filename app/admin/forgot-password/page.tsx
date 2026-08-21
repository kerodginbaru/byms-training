"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to request a reset link.");
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-ink-900">Forgot password</h1>
        <p className="mt-2 text-sm text-ink-900/60">Enter your administrator email to receive a reset link.</p>
        <label htmlFor="email" className="mt-6 block text-sm font-medium text-ink-900">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-brand-200 px-4 py-2.5 focus:border-brand-500 focus:outline-none"
        />
        {message && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="mt-6 w-full rounded-full bg-brand-500 px-4 py-2.5 font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <Link href="/admin/login" className="mt-4 block text-center text-sm text-brand-600 hover:underline">Back to login</Link>
      </form>
    </div>
  );
}
