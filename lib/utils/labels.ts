export const STUDENT_YEAR_LABELS: Record<string, string> = {
  REMEDIAL: "መቅድም (Remedial)",
  YEAR_1: "1ኛ ዓመት",
  YEAR_2: "2ኛ ዓመት",
  YEAR_3: "3ኛ ዓመት",
  YEAR_4: "4ኛ ዓመት",
  YEAR_5: "5ኛ ዓመት",
  YEAR_6: "6ኛ ዓመት"
};

export const DAY_LABELS: Record<string, string> = {
  MON: "ሰኞ",
  TUE: "ማክሰኞ",
  WED: "ረቡዕ",
  THU: "ሐሙስ",
  FRI: "ዓርብ",
  SAT: "ቅዳሜ",
  SUN: "እሁድ"
};

export const SESSION_LABELS: Record<string, string> = {
  MORNING: "ንጋት",
  AFTERNOON: "ከሰዓት"
};

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "በመጠባበቅ ላይ",
  APPROVED: "ጸድቋል",
  REJECTED: "ውድቅ ሆኗል",
  CANCELLED: "ተሰርዟል"
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: "ማረጋገጫ በመጠባበቅ ላይ",
  VERIFIED: "ተረጋግጧል",
  REJECTED: "ውድቅ ሆኗል"
};

export function formatDays(days: string[]) {
  return days.map((d) => DAY_LABELS[d] ?? d).join(" / ");
}

export function formatCurrencyETB(amount: number) {
  return new Intl.NumberFormat("en-ET", { minimumFractionDigits: 2 }).format(amount) + " ብር";
}
