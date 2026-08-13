import { describe, it, expect } from "vitest";

/**
 * This test documents and exercises the concurrency-safety contract of
 * createRegistration() against a REAL Postgres database. It is skipped by
 * default because it requires DATABASE_URL to point at a disposable test
 * database (never run against production data).
 *
 * To run: set TEST_DATABASE_URL and remove `.skip`, then:
 *   npx prisma migrate deploy
 *   npx vitest run tests/capacity.test.ts
 */
describe.skip("createRegistration concurrency", () => {
  it("never allows more than `capacity` reserving registrations for one schedule", async () => {
    const { prisma } = await import("@/lib/db");
    const { createRegistration } = await import("@/lib/services/registration");

    const schedule = await prisma.schedule.create({
      data: {
        name: `Concurrency Test ${Date.now()}`,
        days: ["MON"],
        session: "MORNING",
        startTime: "08:00",
        endTime: "09:00",
        capacity: 5,
        isActive: true
      }
    });

    await prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: { registrationOpen: true, duplicatePhoneScheduleBlock: false }
    });

    const uploadedFiles = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        prisma.uploadedFile.create({
          data: { kind: "RECEIPT", storageKey: `test-${Math.random()}`, originalFilename: "r.pdf", mimeType: "application/pdf", size: 1 }
        })
      )
    );

    const submissions = uploadedFiles.map((f, i) =>
      createRegistration({
        fullName: `Concurrent User ${i}`,
        phone: `25191${String(1000000 + i).padStart(7, "0")}`,
        applicantType: "EMPLOYEE",
        studentYear: null,
        department: null,
        scheduleId: schedule.id,
        receiptFileId: f.id
      }).then(
        () => "ok",
        () => "rejected"
      )
    );

    const results = await Promise.all(submissions);
    const successCount = results.filter((r) => r === "ok").length;

    expect(successCount).toBe(5); // exactly `capacity`, never more

    const finalCount = await prisma.registration.count({
      where: { scheduleId: schedule.id, registrationStatus: { in: ["PENDING", "APPROVED"] } }
    });
    expect(finalCount).toBe(5);
  });
});
