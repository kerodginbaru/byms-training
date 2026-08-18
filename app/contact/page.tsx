import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "አድራሻ" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return (
    <div className="container-page py-16">
      <h1 className="amharic text-3xl font-bold text-ink-900">ያግኙን</h1>
      <div className="amharic mt-6 space-y-2 text-ink-900/80">
        <p>አድራሻ፡ {settings?.address}</p>
        <p>ስልክ፡ {settings?.phone}</p>
        <p>ኢሜይል፡ {settings?.email}</p>
      </div>
    </div>
  );
}
