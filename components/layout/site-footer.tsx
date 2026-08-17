import Image from "next/image";
import { prisma } from "@/lib/db";
import { TRAININGS_OFFERED } from "@/components/registration/types";

export async function SiteFooter() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <footer className="border-t border-brand-100 bg-brand-50/60">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/logo.png"
              alt="ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full"
            />
            <p className="amharic text-base font-semibold text-brand-700">ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ</p>
          </div>
          <p className="amharic mt-3 text-sm text-ink-900/70">
            መንፈሳዊ ትምህርትና ሥልጠና ለሁሉም ተማሪዎችና ሠራተኞች።
          </p>
        </div>
        <div>
          <p className="amharic text-sm font-semibold text-ink-900">አድራሻ</p>
          <p className="amharic mt-2 text-sm text-ink-900/70">{settings?.location ?? "ጉብሬ ቤተ-ማርያም አጠገብ"}</p>
          <p className="amharic mt-3 text-sm font-semibold text-ink-900">ስልክ</p>
          <p className="amharic mt-1 text-sm text-ink-900/70">
            {settings?.contactPersonName ?? "መምህር ዲያቆን አሸናፊ"} · {settings?.contactPersonPhone ?? "099 318 4466"}
          </p>
        </div>
        <div>
          <p className="amharic text-sm font-semibold text-ink-900">የሚሰጡ ስልጠናዎች</p>
          <ul className="amharic mt-2 space-y-1 text-sm text-ink-900/70">
            {TRAININGS_OFFERED.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
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
        <br />
        Developed by <span className="font-medium text-ink-900/70">ኬሮድ ግንባሩ</span>
      </div>
    </footer>
  );
}