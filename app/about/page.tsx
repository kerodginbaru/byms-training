import type { Metadata } from "next";

export const metadata: Metadata = { title: "ስለ እኛ" };

export default function AboutPage() {
  return (
    <div className="container-page py-16">
      <h1 className="amharic text-3xl font-bold text-ink-900">ስለ ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ</h1>
      <div className="amharic prose mt-6 max-w-3xl text-ink-900/80 leading-8">
        <p>
          ማሰልጠኛው ተማሪዎችንና ሠራተኞችን ያካተተ መንፈሳዊ ትምህርትና የመሳርያ ክህሎት ስልጠና ይሰጣል። ግባችን ጥራት ያለው፣
          ተደራሽና በደንብ የተደራጀ ትምህርት ማቅረብ ነው።
        </p>
      </div>
    </div>
  );
}
