import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getScheduleAvailability } from "@/lib/services/registration";
import { RegistrationWizard } from "@/components/registration/registration-wizard";

export const metadata: Metadata = { title: "ይመዝገቡ" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const [schedules, settings] = await Promise.all([
    getScheduleAvailability(),
    prisma.settings.findUnique({ where: { id: 1 } })
  ]);

  return (
    <div className="container-page py-12 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
        <h1 className="amharic text-3xl font-bold text-ink-900">ለስልጠና ይመዝገቡ</h1>
        <p className="amharic mt-2 text-ink-900/60">Register for training in a few simple steps</p>
        <div className="amharic mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-left text-sm text-ink-900/80">
          <p className="font-semibold text-brand-700">ማሳሰቢያ</p>
          <p className="mt-1 leading-6">
            የመጀመሪያ ወር ክፍያዎን ከከፈሉ በኋላ፣ የክፍያ ደረሰኝ ስክሪንሾት ወይም PDF ከ5 ሜባ ያልበለጠ እንዲያስገቡ ስለሚጠየቁ፣ ከመመዝገብዎ በፊት ዝግጁ ያድርጉት።
          </p>
        </div>
      </div>

      <div className="mt-10">
        <RegistrationWizard
          schedules={schedules}
          registrationOpen={settings?.registrationOpen ?? true}
        />
      </div>
    </div>
  );
}