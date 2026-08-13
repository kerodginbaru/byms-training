import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-brand-600">404</h1>
      <p className="amharic mt-2 text-ink-900/70">ገጹ አልተገኘም / Page not found</p>
      <Link href="/" className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
        ወደ መነሻ ገጽ ይመለሱ
      </Link>
    </div>
  );
}
