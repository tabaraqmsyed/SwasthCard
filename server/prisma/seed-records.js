const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function seedRecords() {
  const patients = await prisma.user.findMany({ where: { role: "PATIENT" } });
  const doctor = await prisma.doctor.findFirst({ include: { hospital: true, user: true } });
  const hospital = await prisma.hospital.findFirst();

  if (!doctor || !hospital) {
    console.log("No doctor or hospital found, run prisma/seed.js first.");
    return;
  }

  for (const p of patients) {
    // Update or create patient record with demo profile
    await prisma.patient.upsert({
      where: { userId: p.id },
      update: {
        bloodGroup: "B+",
        gender: "Male",
        address: "14/B Civil Lines, Healthcare Enclave, New Delhi",
        dob: new Date("1998-05-14"),
      },
      create: {
        userId: p.id,
        bloodGroup: "B+",
        gender: "Male",
        address: "14/B Civil Lines, Healthcare Enclave, New Delhi",
        dob: new Date("1998-05-14"),
        qrCodeId: "SC-" + p.id + "-" + Date.now().toString(36).toUpperCase(),
      },
    });

    const recordCount = await prisma.healthRecord.count({ where: { patientId: p.id } });
    if (recordCount === 0) {
      // 1. Prescription
      const rxContent = JSON.stringify({
        diagnosis: "Seasonal Bronchitis & Allergic Cough",
        hospitalName: hospital.name,
        doctorName: doctor.user.name,
        medicines: [
          { name: "Amoxicillin + Clavulanic Acid", dosage: "625 mg", frequency: "1-0-1", duration: "5 days", instructions: "After meals" },
          { name: "Montelukast + Levocetirizine", dosage: "10 mg", frequency: "0-0-1", duration: "7 days", instructions: "At bedtime" },
          { name: "Paracetamol", dosage: "650 mg", frequency: "SOS", duration: "As needed", instructions: "For fever above 100 F" },
        ],
        advice: "Steam inhalation twice daily. Drink warm fluids. Avoid cold beverages.",
      });

      const hash1 = crypto.createHash("sha256").update(p.id + ":RX:" + Date.now()).digest("hex");
      await prisma.healthRecord.create({
        data: {
          patientId: p.id,
          doctorId: doctor.userId,
          type: "PRESCRIPTION",
          content: rxContent,
          recordHash: hash1,
          previousHash: "GENESIS_RECORD_00000",
        },
      });

      // 2. Lab Report
      const labContent = JSON.stringify({
        testName: "Complete Blood Count (CBC) & Lipid Profile",
        labName: "Central Diagnostic Laboratory - " + hospital.name,
        status: "Normal",
        results: [
          { parameter: "Hemoglobin", value: "14.8", unit: "g/dL", normalRange: "13.5 - 17.5" },
          { parameter: "WBC Count", value: "7,400", unit: "/mcL", normalRange: "4,500 - 11,000" },
          { parameter: "Platelets", value: "240,000", unit: "/mcL", normalRange: "150,000 - 450,000" },
          { parameter: "Total Cholesterol", value: "178", unit: "mg/dL", normalRange: "< 200" },
          { parameter: "Fasting Blood Sugar", value: "92", unit: "mg/dL", normalRange: "70 - 100" },
        ],
        interpretation: "All routine blood parameters within standard clinical reference ranges.",
      });

      const hash2 = crypto.createHash("sha256").update(p.id + ":LAB:" + Date.now()).digest("hex");
      await prisma.healthRecord.create({
        data: {
          patientId: p.id,
          doctorId: doctor.userId,
          type: "LAB_REPORT",
          content: labContent,
          recordHash: hash2,
          previousHash: hash1,
        },
      });

      // 3. Diagnosis & Medical History
      const diagContent = JSON.stringify({
        condition: "Mild Acute Rhinitis & Upper Respiratory Infection",
        symptoms: "Nasal congestion, mild sore throat, low-grade fever",
        treatmentPlan: "Hydration, rest, antihistamines prescribed. Follow up in 7 days if symptoms persist.",
        severity: "Mild",
      });

      const hash3 = crypto.createHash("sha256").update(p.id + ":DIAG:" + Date.now()).digest("hex");
      await prisma.healthRecord.create({
        data: {
          patientId: p.id,
          doctorId: doctor.userId,
          type: "DIAGNOSIS",
          content: diagContent,
          recordHash: hash3,
          previousHash: hash2,
        },
      });

      // 4. Appointment
      await prisma.appointment.create({
        data: {
          patientId: p.id,
          doctorId: doctor.userId,
          hospitalId: hospital.id,
          date: new Date(Date.now() + 86400000 * 2), // 2 days from now
          timeSlot: "10:30 AM - 11:00 AM",
          status: "CONFIRMED",
        },
      });

      // 5. Audit Log
      await prisma.auditLog.create({
        data: {
          accessedByUserId: p.id,
          patientId: p.id,
          action: "Initial Health Card profile issued and validated with QR SC-" + p.id,
        },
      });
    }
  }

  console.log("Seeded patient records successfully!");
}

seedRecords()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

