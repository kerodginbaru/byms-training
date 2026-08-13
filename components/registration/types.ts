export type ApplicantType = "STUDENT" | "EMPLOYEE";

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
  applicantType: ApplicantType | "";
  studentYear: StudentYear | "";
  department: string;
  scheduleId: string;
  receiptFileId: string;
  receiptFilename: string;
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
  applicantType: "",
  studentYear: "",
  department: "",
  scheduleId: "",
  receiptFileId: "",
  receiptFilename: ""
};
