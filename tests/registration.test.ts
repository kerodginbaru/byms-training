import { describe, it, expect } from "vitest";
import { normalizeEthiopianPhone } from "@/lib/validation/registration";
import { registrationSchema } from "@/lib/validation/registration";
import { PACKAGE_DESCRIPTIONS, PACKAGE_INTERNATIONAL_PRICES } from "@/components/registration/types";
import { groupRegistrationsByShift, PAYMENT_ACCOUNT } from "@/lib/utils/registration-grouping";

describe("normalizeEthiopianPhone", () => {
  it("normalizes 09XXXXXXXX", () => {
    expect(normalizeEthiopianPhone("0911223344")).toBe("251911223344");
  });
  it("normalizes +2519XXXXXXXX", () => {
    expect(normalizeEthiopianPhone("+251911223344")).toBe("251911223344");
  });
  it("rejects invalid numbers", () => {
    expect(normalizeEthiopianPhone("123456")).toBeNull();
  });
});

describe("online-class international price", () => {
  it("shows the updated outside-Ethiopia amount in the registration package copy", () => {
    expect(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS).toBe(50);
    expect(PACKAGE_DESCRIPTIONS.ONLINE_CLASS).toContain("ለ50 ዶላር");
  });
});

describe("shift grouping and payment info", () => {
  it("groups registrations by their selected shift and keeps the deposit account info central", () => {
    const registrations = [
      { id: "1", fullName: "Alice", scheduleId: "shift-a", preferredTime: null, schedule: { id: "shift-a", name: "Shift A", session: "MORNING", startTime: "08:00", endTime: "10:00" } },
      { id: "2", fullName: "Bob", scheduleId: "shift-a", preferredTime: null, schedule: { id: "shift-a", name: "Shift A", session: "MORNING", startTime: "08:00", endTime: "10:00" } },
      { id: "3", fullName: "Carol", scheduleId: "shift-b", preferredTime: null, schedule: { id: "shift-b", name: "Shift B", session: "AFTERNOON", startTime: "13:00", endTime: "15:00" } }
    ] as any[];

    const grouped = groupRegistrationsByShift(registrations);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].id).toBe("shift-a");
    expect(grouped[0].members).toHaveLength(2);
    expect(grouped[1].id).toBe("shift-b");
    expect(PAYMENT_ACCOUNT.accountNumber).toBe("1000138335438");
    expect(PAYMENT_ACCOUNT.accountName).toBe("Ashenafi Metaferia");
  });
});

describe("registrationSchema conditional logic", () => {
  const base = {
    fullName: "Abebe Kebede",
    phone: "0911223344",
    packageType: "REGULAR" as const,
    scheduleId: "sched_1",
    preferredTime: null,
    receiptFileId: "file_1",
    agreedToRegulations: true as const
  };

  it("requires department for Year >= 2 students", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "YEAR_3",
      department: null
    });
    expect(result.success).toBe(false);
  });

  it("does not require department for Remedial", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "REMEDIAL",
      department: null
    });
    expect(result.success).toBe(true);
  });

  it("does not require department for Year 1", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "YEAR_1",
      department: null
    });
    expect(result.success).toBe(true);
  });

  it("rejects employee with studentYear set", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: "YEAR_1",
      department: null
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid employee registration", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: null
    });
    expect(result.success).toBe(true);
  });

  it("accepts an ONLINE_CLASS package with a preferred time", () => {
    const result = registrationSchema.safeParse({
      ...base,
      packageType: "ONLINE_CLASS",
      scheduleId: null,
      preferredTime: "ONLINE - Evening",
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: null
    });
    expect(result.success).toBe(true);
  });

  it("requires scheduleId for REGULAR package", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: null,
      packageType: "REGULAR",
      scheduleId: null
    });
    expect(result.success).toBe(false);
  });

  it("requires preferredTime for non-REGULAR packages", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: null,
      packageType: "SPECIAL",
      scheduleId: null,
      preferredTime: null
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid SPECIAL package registration with preferredTime", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: null,
      packageType: "SPECIAL",
      scheduleId: null,
      preferredTime: "Saturday afternoon"
    });
    expect(result.success).toBe(true);
  });
});