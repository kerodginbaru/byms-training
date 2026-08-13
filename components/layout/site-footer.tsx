export function SiteFooter() {
  return (
    <footer className="border-t border-brand-100 bg-brand-50/60">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <p className="amharic text-lg font-semibold text-brand-700">ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ</p>
          <p className="amharic mt-2 text-sm text-ink-900/70">
            መንፈሳዊ ትምህርትና ሥልጠና ለሁሉም ተማሪዎችና ሠራተኞች።
          </p>
        </div>
        <div>
          <p className="amharic text-sm font-semibold text-ink-900">አድራሻ</p>
          <p className="amharic mt-2 text-sm text-ink-900/70">አዲስ አበባ፣ ኢትዮጵያ</p>
        </div>
        <div>
          <p className="amharic text-sm font-semibold text-ink-900">ፈጣን ማገናኛዎች</p>
          <ul className="amharic mt-2 space-y-1 text-sm text-ink-900/70">
            <li><a href="/register" className="hover:text-brand-600">ለመመዝገብ</a></li>
            <li><a href="/training" className="hover:text-brand-600">የስልጠና መርሃ ግብር</a></li>
            <li><a href="/contact" className="hover:text-brand-600">አድራሻ</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-100 py-4 text-center text-xs text-ink-900/50">
        © {new Date().getFullYear()} ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ. ሁሉም መብቶች የተጠበቁ ናቸው.
      </div>
    </footer>
  );
}
