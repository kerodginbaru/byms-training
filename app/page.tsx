import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getScheduleAvailability } from "@/lib/services/registration";
import { formatDays, SESSION_LABELS, formatCurrencyETB } from "@/lib/utils/labels";
import { HeroEntrance } from "@/components/layout/hero-entrance";
import {
  PACKAGE_DESCRIPTIONS,
  PACKAGE_LABELS,
  PACKAGE_PRICES,
  REGULATIONS_AM,
  TRAININGS_OFFERED
} from "@/components/registration/types";

export const revalidate = 30;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, schedules, totalCount] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 } }),
    getScheduleAvailability(),
    prisma.registration.count()
  ]);

  const studentCount = await prisma.registration.count({ where: { applicantType: "STUDENT" } });

  return (
    <div>
          {/* Hero — contained photo banner */}
      <section className="relative">
        <div className="container-page pt-8">
          <div className="relative h-[50vh] min-h-[320px] w-full max-w-4xl mx-auto overflow-hidden rounded-3xl shadow-lg sm:h-[55vh]">
            <Image
              src="/images/hero.jpg"
              alt="ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-ink-900/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center sm:p-10">
              <HeroEntrance>
                <p className="amharic mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  ኦንላይን ምዝገባ ክፍት ነው
                </p>
                <h1 className="amharic text-2xl font-bold leading-tight text-white sm:text-4xl">
                  {settings?.heroTitle ?? "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ"}
                </h1>
                <p className="amharic mx-auto mt-3 max-w-xl text-base text-white/85 sm:text-lg">
                  {settings?.heroDescription ??
                    "ኦንላይን በመመዝገብ የስልጠና መርሃ ግብራችንን ይቀላቀሉ። ቀላል፣ ፈጣንና ደህንነቱ የተጠበቀ ምዝገባ።"}
                </p>
              </HeroEntrance>
            </div>
          </div>
          <blockquote className="amharic mx-auto mt-5 max-w-xl border-l-4 border-brand-300 pl-4 text-center text-base italic text-ink-900/70">
            "እግዚአብሔርን በመሰንቆ አመስግኑት ዐስር አውታርም ባለው በበገና ዘምሩለት"
            <footer className="mt-1 text-sm not-italic text-ink-900/50">መዝ ፴፫፤፪</footer>
          </blockquote>
        </div>
      </section>
{/* Stats */}
      {/* About, with photo */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="amharic text-2xl font-bold text-ink-900 sm:text-3xl">ስለ ማሰልጠኛው</h2>
            <p className="amharic mt-4 text-ink-900/70 leading-8">
              ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ ተማሪዎችንና ሠራተኞችን መንፈሳዊ ትምህርትና የመሳርያ ክህሎት በደንብ የተደራጀ የስልጠና
              መርሃ ግብር ያቀርባል። ግባችን ጥራት ያለው፣ ተደራሽና ወጥ የሆነ ትምህርት በማቅረብ ቀጣዩን ትውልድ በኦርቶዶክሳዊ
              ዜማና መሳርያ ላይ ማነጽ ነው።
            </p>
            <p className="amharic mt-4 text-ink-900/70 leading-8">
              ተማሪዎቻችን ከጀማሪ እስከ ብቁ ደረጃ ድረስ በተከታታይ ክትትል የሚያድጉ ሲሆን፣ ትምህርቱም ከመሳርያ ክህሎት ባሻገር
              መንፈሳዊ ሕይወትን ያካትታል።
            </p>
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
              src="/images/gallery/gallery-4.jpg"
              alt="የቤተ-ያሬድ ተመራቂ ተማሪዎች ከቤተክርስቲያኑ ፊት ለፊት"
              width={1400}
              height={1050}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Instruments closeup band */}
      <section className="relative">
        <div className="relative h-64 w-full overflow-hidden sm:h-80">
          <Image
            src="/images/gallery/gallery-5.jpg"
            alt="የበገና መሳርያዎች"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-ink-900/50" />
          <div className="container-page absolute inset-0 flex flex-col items-center justify-center text-center">
            <h2 className="amharic text-2xl font-bold text-white sm:text-3xl">የምንሰጣቸው ስልጠናዎች</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {TRAININGS_OFFERED.map((t) => (
                <span
                  key={t}
                  className="amharic rounded-full border border-white/40 bg-white/10 px-6 py-2.5 text-base font-medium text-white backdrop-blur-sm"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Teaching / training life, with photo */}
      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="order-2 mx-auto w-full max-w-md overflow-hidden rounded-3xl shadow-lg lg:order-1">
            <Image
              src="/images/gallery/gallery-3.jpg"
              alt="መምህር ተማሪዎችን ሲያስተምር"
              width={1050}
              height={1400}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="amharic text-2xl font-bold text-ink-900 sm:text-3xl">የስልጠናው ሂደት</h2>
            <p className="amharic mt-4 text-ink-900/70 leading-8">
              ትምህርቱ ልምድ ባላቸው መምህራን የሚሰጥ ሲሆን፣ ተማሪዎች በተግባርና በንድፈ ሐሳብ የተደገፈ ክትትል ያገኛሉ። ከመደበኛው
              የመሳርያ ትምህርት ባሻገር፣ ተማሪዎች ሳምንታዊ የህይወት ቀን ትምህርት እንዲካፈሉ ይበረታታሉ፤ ይህም መንፈሳዊ
              እድገታቸውን ያግዛል።
            </p>
            <p className="amharic mt-4 text-ink-900/70 leading-8">
              ስልጠናው በተወሰነ መርሃ ግብር (መደበኛ)፣ በልዩ ጥቅል፣ ወይም ከቤት ወደ ቤት በሚደረግ አገልግሎት ሊሰጥ ይችላል፤ ለተማሪው
              በሚመች መልኩ።
            </p>
          </div>
        </div>
      </section>

      {/* Spiritual life — candlelight photos */}
      <section className="bg-ink-900 py-16">
        <div className="container-page">
          <div className="text-center">
            <h2 className="amharic text-2xl font-bold text-white sm:text-3xl">መንፈሳዊ ሕይወታችን</h2>
            <p className="amharic mx-auto mt-4 max-w-2xl text-white/70 leading-8">
              ትምህርቱ ከመሳርያ ክህሎት ባለፈ፣ ተማሪዎችን በጸሎት፣ በምስጢራተ ቤተክርስቲያን ተሳትፎና በማኅበረሰብ ኑሮ ውስጥ
              የሚያሳትፍ መንፈሳዊ ጉዞ ጭምር ነው።
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/images/gallery/gallery-1.jpg"
                alt="የሻማ ማብራት ሥነ ሥርዓት"
                width={1050}
                height={1400}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/images/gallery/gallery-2.jpg"
                alt="የሻማ ማብራት ሥነ ሥርዓት"
                width={1050}
                height={1400}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Packages teaser */}
      <section className="container-page py-16">
        <h2 className="amharic text-center text-2xl font-bold text-ink-900 sm:text-3xl">ጥቅሎች</h2>
        <p className="amharic mx-auto mt-3 max-w-2xl text-center text-ink-900/60">
          ከመደበኛ ስልጠና በተጨማሪ፣ ለተለያዩ ፍላጎቶች የሚስማሙ ልዩ ጥቅሎች አሉን።
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS.REGULAR}</p>
            <p className="amharic mt-1 text-sm text-ink-900/60">{PACKAGE_DESCRIPTIONS.REGULAR}</p>
          </div>
          {(Object.keys(PACKAGE_PRICES) as (keyof typeof PACKAGE_PRICES)[]).map((key) => (
            <div key={key} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
              <p className="amharic font-semibold text-brand-700">{PACKAGE_LABELS[key]}</p>
              <p className="amharic mt-1 text-sm text-ink-900/60">{PACKAGE_DESCRIPTIONS[key]}</p>
              <p className="amharic mt-3 text-sm font-medium text-ink-900">
                ተማሪ፡ {formatCurrencyETB(PACKAGE_PRICES[key].student)}
              </p>
              <p className="amharic text-sm font-medium text-ink-900">
                ሠራተኛ፡ {formatCurrencyETB(PACKAGE_PRICES[key].employee)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Schedules preview */}
      <section className="bg-brand-50/50 py-16">
        <div className="container-page">
          <h2 className="amharic text-center text-2xl font-bold text-ink-900 sm:text-3xl">
            የመደበኛ ስልጠና መርሃ ግብር
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="font-semibold text-brand-700">{s.name}</p>
                <p className="amharic mt-1 text-sm text-ink-900/70">{formatDays(s.days)}</p>
                <p className="amharic text-sm text-ink-900/70">{SESSION_LABELS[s.session]}</p>
                <div className="mt-4">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (s.registered / s.capacity) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-900/60">
                    {s.registered} / {s.capacity} ቦታ
                  </p>
                  <p className={`amharic text-xs font-medium ${s.isFull ? "text-red-600" : "text-brand-600"}`}>
                    {s.isFull ? "ሙሉ ነው" : `${s.remaining} ቦታ ቀርቷል`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulations */}
      <section className="container-page py-16">
        <h2 className="amharic text-center text-2xl font-bold text-ink-900 sm:text-3xl">ህገ ደንቦች</h2>
        <ol className="amharic mx-auto mt-6 max-w-2xl list-decimal space-y-2.5 pl-6 text-ink-900/75 leading-7">
          {REGULATIONS_AM.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>
{/* Final call to action */}
      <section className="bg-ink-900 py-16">
        <div className="container-page text-center">
          <h2 className="amharic text-2xl font-bold text-white sm:text-3xl">ዛሬውኑ ይመዝገቡ</h2>
          <p className="amharic mx-auto mt-3 max-w-xl text-white/70">
            ጥቂት ደቂቃዎችን በመውሰድ ኦንላይን ተመዝግበው የስልጠና ጉዞዎን ይጀምሩ።
          </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="amharic rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-brand-600 active:scale-95"
            >
              ለመመዝገብ
            </Link>
            <Link
              href="/training"
              className="amharic rounded-full border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10"
            >
              የስልጠና መርሃ ግብር ይመልከቱ
            </Link>
          </div>
          <p className="amharic mx-auto mt-6 max-w-md text-sm text-white/60">
            የመጀመሪያ ወር ክፍያዎን ከከፈሉ በኋላ፣ የክፍያ ደረሰኝ ስክሪንሾት ወይም PDF ከ5 ሜባ ያልበለጠ እንዲያስገቡ ይጠየቃሉ።
          </p>
        </div>
      </section>

      {/* Contact */}
      
      {/* Contact */}

    </div>
  );
}