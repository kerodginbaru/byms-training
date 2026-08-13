const TONE_CLASSES: Record<string, string> = {
  default: "bg-white border-brand-100 text-ink-900",
  amber: "bg-amber-50 border-amber-100 text-amber-800",
  green: "bg-green-50 border-green-100 text-green-800",
  red: "bg-red-50 border-red-100 text-red-800"
};

export function DashboardCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "green" | "red";
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${TONE_CLASSES[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-70">{label}</p>
    </div>
  );
}
