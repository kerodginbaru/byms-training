export type ApplicantType = "STUDENT" | "EMPLOYEE";
export type PackageType = "REGULAR" | "SPECIAL" | "HOME_TO_HOME" | "KRAR" | "ONLINE_CLASS";
export type StudentYear = "REMEDIAL" | "YEAR_1" | "YEAR_2" | "YEAR_3" | "YEAR_4" | "YEAR_5" | "YEAR_6";

export const PAYMENT_ACCOUNT = {
  accountName: "Ashenafi Metaferia",
  accountNumber: "1000138335438"
};

export type RegistrationGroupMember = {
  id: string;
  registrationNumber: string;
  fullName: string;
  phone: string;
  applicantType: ApplicantType;
  studentYear?: StudentYear | null;
  department?: string | null;
  packageType: PackageType;
  createdAt: Date;
  scheduleId?: string | null;
  preferredTime?: string | null;
  schedule?: {
    id?: string;
    name?: string | null;
    days?: string[];
    session?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  } | null;
};

export type ShiftGroup = {
  id: string;
  name: string;
  days?: string[];
  instrument?: string | null;
  session?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  members: RegistrationGroupMember[];
};

export function groupRegistrationsByShift(registrations: RegistrationGroupMember[]): ShiftGroup[] {
  const groups = new Map<string, ShiftGroup>();

  for (const registration of registrations) {
    const schedule = registration.schedule;
    const shiftId = schedule?.id ?? registration.scheduleId ?? registration.preferredTime ?? `preferred-${registration.id}`;
    const shiftName = schedule?.name ?? (registration.preferredTime ? `Preferred time: ${registration.preferredTime}` : "Unassigned");
    const instrument = registration.department ?? null;
    const groupId = JSON.stringify([shiftId, instrument]);

    const existing = groups.get(groupId) ?? {
      id: groupId,
      name: shiftName,
      days: schedule?.days ?? [],
      instrument,
      session: schedule?.session ?? null,
      startTime: schedule?.startTime ?? null,
      endTime: schedule?.endTime ?? null,
      members: []
    };

    existing.members.push(registration);
    groups.set(groupId, existing);
  }

  return Array.from(groups.values()).sort((a, b) =>
    (a.instrument ?? "").localeCompare(b.instrument ?? "") || a.name.localeCompare(b.name)
  );
}
