import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { TRAININGS_OFFERED } from "@/components/registration/types";
import { PhotoGallery } from "@/components/layout/photo-gallery";

export const metadata: Metadata = { title: "ስለ እኛ" };

export default async function AboutPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  return (
    <div className="container-page py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="amharic text-3xl font-bold text-ink-900">ስለ ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ</h1>
          <div className="amharic prose mt-6 max-w-xl text-ink-900/80 leading-8">
            <p>
              ማሰልጠኛው ተማሪዎችንና ሠራተኞችን ያካተተ መንፈሳዊ ትምህርትና የመሳርያ ክህሎት ስልጠና ይሰጣል። ግባችን ጥራት ያለው፣
              ተደራሽና በደንብ የተደራጀ ትምህርት ማቅረብ ነው።
            </p>
            <p className="mt-4">
              የሚገኝበት ቦታ፡ {settings?.location} · {settings?.address}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRAININGS_OFFERED.map((t) => (
              <span key={t} className="amharic rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-lg">
          <Image
            src="/images/hero.jpg"
            alt="የቤተ-ያሬድ ተማሪዎች በገና ሲጫወቱ"
            width={1200}
            height={1600}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <PhotoGallery />
    </div>
  );
}