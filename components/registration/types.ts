export type ApplicantType = "STUDENT" | "EMPLOYEE";
export type PackageType = "REGULAR" | "SPECIAL" | "HOME_TO_HOME" | "KRAR" | "ONLINE_CLASS";
export type OnlineLocation = "LOCAL" | "INTERNATIONAL";

export type StudentYear =
  | "REMEDIAL"
  | "YEAR_1"
  | "YEAR_2"
  | "YEAR_3"
  | "YEAR_4"
  | "YEAR_5"
  | "YEAR_6";

export type ConfessorParish = "GUBRE_TRINITY" | "SAINT_STEPHANOS" | "EWAN_MIKAEL" | "NONE";

export const CONFESSOR_PARISH_LABELS: Record<ConfessorParish, string> = {
  GUBRE_TRINITY: "ጉብሬ ቅድስት ሥላሴ",
  SAINT_STEPHANOS: "ቅዱስ እስቲፋኖስ",
  EWAN_MIKAEL: "ኤዋን ሚካኤል",
  NONE: "የለም"
};

export type ScheduleOption = {
  id: string;
  name: string;
  days: string[];
  session: "MORNING" | "AFTERNOON";
  startTime: string;
  endTime: string;
  capacity: number;
  registered: number;
  remaining: number;
  isFull: boolean;
};

export type WizardState = {
  fullName: string;
  phone: string;
  christianName: string;
  teseto: string;
  confessorParish: ConfessorParish | "";
  confessorName: string;
  packageType: PackageType | "";
  applicantType: ApplicantType | "";
  studentYear: StudentYear | "";
  department: string;
  onlineLocation: OnlineLocation | "";
  scheduleId: string;
  preferredTime: string;
  receiptFileId: string;
  receiptFilename: string;
  agreedToRegulations: boolean;
};

export const INITIAL_WIZARD_STATE: WizardState = {
  fullName: "",
  phone: "",
  christianName: "",
  teseto: "",
  confessorParish: "",
  confessorName: "",
  packageType: "",
  applicantType: "",
  studentYear: "",
  department: "",
  onlineLocation: "",
  scheduleId: "",
  preferredTime: "",
  receiptFileId: "",
  receiptFilename: "",
  agreedToRegulations: false
};

export const PACKAGE_PRICES: Record<PackageType, { student: number; employee: number }> = {
  REGULAR: { student: 400, employee: 500 },
  SPECIAL: { student: 700, employee: 1000 },
  HOME_TO_HOME: { student: 1000, employee: 1300 },
  KRAR: { student: 600, employee: 700 },
  ONLINE_CLASS: { student: 1500, employee: 1500 }
};

export const KRAR_PACKAGE_PRICES: Record<
  Exclude<PackageType, "KRAR">,
  { student: number; employee: number }
> = {
  REGULAR: { student: 600, employee: 700 },
  SPECIAL: { student: 1000, employee: 1300 },
  HOME_TO_HOME: { student: 1300, employee: 1500 },
  ONLINE_CLASS: { student: 2000, employee: 2000 }
};

export const PACKAGE_INTERNATIONAL_PRICES: Record<"ONLINE_CLASS", number> = {
  ONLINE_CLASS: 50
};

export const REGISTRATION_PACKAGE_OPTIONS: Exclude<PackageType, "KRAR">[] = [
  "REGULAR",
  "SPECIAL",
  "HOME_TO_HOME",
  "ONLINE_CLASS"
];

export function getPackagePrice(
  packageType: PackageType,
  department: string,
  applicantType: ApplicantType,
  onlineLocation: OnlineLocation | ""
) {
  const prices = department === "ክራር" && packageType !== "KRAR"
    ? KRAR_PACKAGE_PRICES[packageType]
    : PACKAGE_PRICES[packageType];

  if (packageType === "ONLINE_CLASS" && department === "ክራር" && onlineLocation === "INTERNATIONAL") {
    return { amount: PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS, currency: "USD" as const };
  }
  if (packageType === "ONLINE_CLASS" && department === "ክራር" && !onlineLocation) {
    return null;
  }

  return {
    amount: applicantType === "EMPLOYEE" ? prices.employee : prices.student,
    currency: "ETB" as const
  };
}

export const PACKAGE_LABELS: Record<PackageType, string> = {
  REGULAR: "መደበኛ ስልጠና",
  SPECIAL: "ልዩ ጥቅል",
  HOME_TO_HOME: "ከቤት ወደ ቤት",
  KRAR: "የክራር ልዩ ጥቅል",
  ONLINE_CLASS: "Online Class"
};

export const PACKAGE_DESCRIPTIONS: Record<PackageType, string> = {
  REGULAR: "በተወሰነው መርሃ ግብር (A-D) መሰረት፣ በማሰልጠኛው ቦታ",
  SPECIAL: "ጊዜው በተማሪው ምርጫ የሚወሰን ልዩ ስልጠና",
  HOME_TO_HOME: "አስተማሪው ወደ ቤትዎ በመምጣት የሚሰጥ ስልጠና",
  KRAR: "ለክራር ትምህርት የተዘጋጀ ልዩ ጥቅል",
  ONLINE_CLASS: "በኦንላይን የሚሰጥ ስልጠና፤ ክፍያው እንደ አካባቢዎ ይለያያል።"
};

export const REGULATIONS_AM = [
  "የሃይማኖት ትምህርት ለመማር ፈቃደኛ የሆነ",
  "ምክረ ካህን ወይም የንሰሐ ትምህርት ተምሮ ንሰሐ ለመግባት ፈቃደኛ የሆነ",
  "ምስጢራተ ቤተክርስቲያንን ለመሳተፍ ፍቃደኛ የሆነ",
  "ባለው ተሰጥዖ ለማገልገል ፍቃደኛ የሆነ",
  "ሳምንታዊ የህይወት ቀን ትምህርት ለመካፈል ፈቃደኛ የሆነ",
  "ወርሃዊ የጽዋ (የዝክር) ቀን ለመካፈል ፈቃደኛ የሆነ"
];

export const TRAININGS_OFFERED = ["በገና", "ክራር", "መሰንቆ", "ከበሮ"];