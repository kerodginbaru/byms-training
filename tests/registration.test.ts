import { describe, it, expect } from "vitest";
import { normalizeEthiopianPhone } from "@/lib/validation/registration";
import { registrationSchema } from "@/lib/validation/registration";
import {
  getPackagePrice,
  getPackagePrices,
  KRAR_PACKAGE_PRICES,
  PACKAGE_DESCRIPTIONS,
  PACKAGE_INTERNATIONAL_PRICES
} from "@/components/registration/types";
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
  it("shows both currency price options without a location selection", () => {
    expect(PACKAGE_INTERNATIONAL_PRICES.ONLINE_CLASS).toBe(50);
    expect(PACKAGE_DESCRIPTIONS.ONLINE_CLASS).not.toContain("አካባቢ");
    expect(getPackagePrices("ONLINE_CLASS", "ክራር", "STUDENT")).toEqual([
      { amount: 2000, currency: "ETB" },
      { amount: 50, currency: "USD" }
    ]);
  });
});

describe("Krar package prices", () => {
  it("uses the requested student and employee rates", () => {
    expect(KRAR_PACKAGE_PRICES.REGULAR).toEqual({ student: 600, employee: 700 });
    expect(KRAR_PACKAGE_PRICES.SPECIAL).toEqual({ student: 1000, employee: 1300 });
    expect(KRAR_PACKAGE_PRICES.HOME_TO_HOME).toEqual({ student: 1300, employee: 1500 });
    expect(KRAR_PACKAGE_PRICES.ONLINE_CLASS).toEqual({ student: 2000, employee: 2000 });
  });

  it("returns the regular online amount for the primary option", () => {
    expect(getPackagePrice("ONLINE_CLASS", "ክራር", "STUDENT"))
      .toEqual({ amount: 2000, currency: "ETB" });
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

  it("includes special-package student registrations in the shift summary totals", () => {
    const registrations = [
      { id: "1", fullName: "Alice", scheduleId: "shift-a", preferredTime: null, packageType: "REGULAR", schedule: { id: "shift-a", name: "Shift A", session: "MORNING", startTime: "08:00", endTime: "10:00" } },
      { id: "2", fullName: "Biniam", scheduleId: null, preferredTime: "Saturday evening", packageType: "SPECIAL", schedule: null },
      { id: "3", fullName: "Chala", scheduleId: null, preferredTime: "Saturday evening", packageType: "SPECIAL", schedule: null }
    ] as any[];

    const grouped = groupRegistrationsByShift(registrations);

    expect(grouped.some((group) => group.name === "Preferred time: Saturday evening")).toBe(true);
    expect(grouped.find((group) => group.name === "Preferred time: Saturday evening")?.members).toHaveLength(2);
  });
});

describe("registrationSchema conditional logic", () => {
  const base = {
    fullName: "Abebe Kebede",
    phone: "0911223344",
    christianName: "Gabriel",
    teseto: "በገና",
    confessorParish: "GUBRE_TRINITY" as const,
    confessorName: "Abba Yared",
    packageType: "REGULAR" as const,
    department: "በገና",
    scheduleId: "sched_1",
    preferredTime: null,
    receiptFileId: "file_1",
    agreedToRegulations: true as const
  };

  it("requires an instrument for students", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "YEAR_3",
      department: null
    });
    expect(result.success).toBe(false);
  });

  it("accepts an instrument for Remedial students", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "REMEDIAL",
      department: "ክራር"
    });
    expect(result.success).toBe(true);
  });

  it("accepts an instrument for Year 1", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "YEAR_1",
      department: "መሰንቆ"
    });
    expect(result.success).toBe(true);
  });

  it("rejects employee with studentYear set", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: "YEAR_1",
      department: "በገና"
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid employee registration", () => {
    const missingTeseto = registrationSchema.safeParse({
      ...base,
      teseto: " ",
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: "በገና"
    });
    expect(missingTeseto.success).toBe(false);

    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null
    });
    expect(result.success).toBe(true);
  });

  it("requires a confession father name for a selected parish", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: "በገና",
      confessorName: ""
    });
    expect(result.success).toBe(false);
  });

  it("accepts no nearby parish without a confession father name", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: "በገና",
      confessorParish: "NONE",
      confessorName: null
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
      department: "በገና"
    });
    expect(result.success).toBe(true);
  });

  it("requires scheduleId for REGULAR package", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "EMPLOYEE",
      studentYear: null,
      department: "በገና",
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
      department: "በገና",
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
      department: "በገና",
      packageType: "SPECIAL",
      scheduleId: null,
      preferredTime: "Saturday afternoon"
    });
    expect(result.success).toBe(true);
  });

  it("accepts a Krar online class without a location selection", () => {
    const result = registrationSchema.safeParse({
      ...base,
      applicantType: "STUDENT",
      studentYear: "YEAR_1",
      department: "ክራር",
      packageType: "ONLINE_CLASS",
      scheduleId: null,
      preferredTime: "Saturday afternoon"
    });
    expect(result.success).toBe(true);
  });
});