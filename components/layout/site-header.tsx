import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { href: "/", label: "መነሻ" },
  { href: "/about", label: "ስለ እኛ" },
  { href: "/training", label: "ስልጠና" },
  { href: "/contact", label: "አድራሻ" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-brand-700">
          <Image
            src="/images/logo.png"
            alt="ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            priority
          />
          <span className="amharic text-lg leading-tight">ቤተ-ያሬድ ማሰልጠኛ</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="amharic text-sm font-medium text-ink-900/80 transition hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/register"
          className="amharic rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
        >
          ለመመዝገብ
        </Link>
      </div>
    </header>
  );
}