import { describe, it, expect } from "vitest";
import { normalizeEthiopianPhone } from "@/lib/validation/registration";
import { registrationSchema } from "@/lib/validation/registration";

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

describe("registrationSchema conditional logic", () => {
  const base = {
    fullName: "Abebe Kebede",
    phone: "0911223344",
    scheduleId: "sched_1",
    receiptFileId: "file_1"
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
});
