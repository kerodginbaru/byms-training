export type ApplicantType = "STUDENT" | "EMPLOYEE";
export type PackageType = "REGULAR" | "SPECIAL" | "HOME_TO_HOME" | "KRAR";

export type StudentYear =
  | "REMEDIAL"
  | "YEAR_1"
  | "YEAR_2"
  | "YEAR_3"
  | "YEAR_4"
  | "YEAR_5"
  | "YEAR_6";

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
  packageType: PackageType | "";
  applicantType: ApplicantType | "";
  studentYear: StudentYear | "";
  department: string;
  scheduleId: string;
  preferredTime: string;
  receiptFileId: string;
  receiptFilename: string;
  agreedToRegulations: boolean;
};

export const YEARS_REQUIRING_DEPARTMENT = new Set<StudentYear>([
  "YEAR_2",
  "YEAR_3",
  "YEAR_4",
  "YEAR_5",
  "YEAR_6"
]);

export const INITIAL_WIZARD_STATE: WizardState = {
  fullName: "",
  phone: "",
  packageType: "",
  applicantType: "",
  studentYear: "",
  department: "",
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
  KRAR: { student: 600, employee: 700 }
};

export const PACKAGE_LABELS: Record<PackageType, string> = {
  REGULAR: "መደበኛ ስልጠና",
  SPECIAL: "ልዩ ጥቅል",
  HOME_TO_HOME: "ከቤት ወደ ቤት",
  KRAR: "የክራር ልዩ ጥቅል"
};

export const PACKAGE_DESCRIPTIONS: Record<PackageType, string> = {
  REGULAR: "በተወሰነው መርሃ ግብር (A-D) መሰረት፣ በማሰልጠኛው ቦታ",
  SPECIAL: "ጊዜው በተማሪው ምርጫ የሚወሰን ልዩ ስልጠና",
  HOME_TO_HOME: "አስተማሪው ወደ ቤትዎ በመምጣት የሚሰጥ ስልጠና",
  KRAR: "ለክራር ትምህርት የተዘጋጀ ልዩ ጥቅል"
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