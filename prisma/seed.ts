import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      institutionNameAm: "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ",
      institutionNameEn: "Bete-Yared Spiritual Instruments Training Center",
      phone: "0993184466",
      address: "ጉብሬ፣ ኢትዮጵያ",
      location: "ጉብሬ ረፈራል ሆስፒታል ጀርባ",
      contactPersonName: "መምህር ዲያቆን አሸናፊ",
      contactPersonPhone: "0993184466",
      heroTitle: "ቤተ-ያሬድ መንፈሳዊ መሳርያዎች ማሰልጠኛ",
      heroDescription: "ኦንላይን በመመዝገብ የስልጠና መርሃ ግብራችንን ይቀላቀሉ።",
      morningStartTime: "12:00",
      morningEndTime: "1:30",
      afternoonStartTime: "12:00",
      afternoonEndTime: "1:30",
      registrationOpen: true,
      maxUploadSizeMb: 5,
      duplicatePhoneScheduleBlock: true
    },
    update: {}
  });

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.adminUser.upsert({
    where: { email: "admin@byms-training.example.org" },
    create: {
      fullName: "Super Admin",
      email: "admin@byms-training.example.org",
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true
    },
    update: {}
  });

  const staffPasswordHash = await bcrypt.hash("StaffPass123!", 12);
  await prisma.adminUser.upsert({
    where: { email: "staff@byms-training.example.org" },
    create: {
      fullName: "Sample Registration Staff",
      email: "staff@byms-training.example.org",
      passwordHash: staffPasswordHash,
      role: "REGISTRATION_ADMIN",
      isActive: true
    },
    update: {}
  });

  const scheduleDefs = [
       { name: "Schedule A", days: ["MON", "WED", "FRI"], session: "MORNING" as const, startTime: "12:00", endTime: "1:30" },
    { name: "Schedule B", days: ["MON", "WED", "FRI"], session: "AFTERNOON" as const, startTime: "12:00", endTime: "1:30" },
    { name: "Schedule C", days: ["TUE", "THU", "SAT"], session: "MORNING" as const, startTime: "12:00", endTime: "1:30" },
    { name: "Schedule D", days: ["TUE", "THU", "SAT"], session: "AFTERNOON" as const, startTime: "12:00", endTime: "1:30" }
  ];
  const schedules = [];
  for (const def of scheduleDefs) {
    const existing = await prisma.schedule.findFirst({ where: { name: def.name } });
    const s = existing ?? (await prisma.schedule.create({ data: { ...def, capacity: 30, isActive: true } }));
    schedules.push(s);
  }

  const sampleRegs = [
    { fullName: "Test Student One", phone: "251911111111", applicantType: "STUDENT" as const, studentYear: "YEAR_1" as const, department: null, packageType: "REGULAR" as const },
    { fullName: "Test Student Two", phone: "251922222222", applicantType: "STUDENT" as const, studentYear: "YEAR_3" as const, department: "ክራር", packageType: "REGULAR" as const },
    { fullName: "Test Employee One", phone: "251933333333", applicantType: "EMPLOYEE" as const, studentYear: null, department: null, packageType: "HOME_TO_HOME" as const }
  ];

  for (let i = 0; i < sampleRegs.length; i++) {
    const reg = sampleRegs[i];
    const schedule = schedules[i % schedules.length];
    const year = new Date().getFullYear();

    const counter = await prisma.registrationCounter.upsert({
      where: { year },
      create: { year, current: 1 },
      update: { current: { increment: 1 } }
    });
    const registrationNumber = `BYMS-${year}-${String(counter.current).padStart(6, "0")}`;

    const existing = await prisma.registration.findUnique({ where: { registrationNumber } });
    if (existing) continue;

    await prisma.registration.create({
      data: {
        registrationNumber,
        fullName: reg.fullName,
        phone: reg.phone,
        applicantType: reg.applicantType,
        studentYear: reg.studentYear,
        department: reg.department,
        packageType: reg.packageType,
        scheduleId: reg.packageType === "REGULAR" ? schedule.id : null,
        preferredTime: reg.packageType === "REGULAR" ? null : "ቅዳሜ ከሰዓት በኋላ",
        agreedToRegulations: true
      }
    });
  }

  console.log("Seed complete.");
  console.log("Super admin login: admin@byms-training.example.org / ChangeMe123! (change immediately)");
  console.log("Sample registration-staff login: staff@byms-training.example.org / StaffPass123! (change immediately)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });