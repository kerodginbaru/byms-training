import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getScheduleAvailability } from "@/lib/services/registration";
import { RegistrationWizard } from "@/components/registration/registration-wizard";

export const metadata: Metadata = { title: "ይመዝገቡ" };
export const dynamic = "force-dynamic"; // seat counts must always be fresh

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
      </div>

      <div className="mt-10">
        <RegistrationWizard
          schedules={schedules}
          registrationFee={Number(settings?.registrationFee ?? 0)}
          firstMonthFee={Number(settings?.firstMonthFee ?? 0)}
          registrationOpen={settings?.registrationOpen ?? true}
        />
      </div>
    </div>
  );
}
