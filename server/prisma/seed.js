const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding hospitals and doctors...");

  // Create or get Hospitals
  const hospitalData = [
    {
      name: "AIIMS Multi-Specialty Hospital",
      address: "Ansari Nagar, Ring Road, New Delhi",
    },
    {
      name: "Apollo Healthcare Institute",
      address: "Sarita Vihar, Delhi Mathura Road, New Delhi",
    },
    {
      name: "Fortis Memorial Research Hospital",
      address: "Sector 44, Opposite City Centre, Gurugram",
    },
    {
      name: "Max Super Specialty Hospital",
      address: "Press Enclave Road, Saket, New Delhi",
    },
  ];

  const hospitals = [];
  for (const h of hospitalData) {
    let hospital = await prisma.hospital.findFirst({
      where: { name: h.name },
    });
    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: h,
      });
    }
    hospitals.push(hospital);
  }

  // Create Doctors
  const defaultPasswordHash = await bcrypt.hash("Doctor@123", 10);

  const doctorData = [
    {
      name: "Dr. Rajesh Sharma",
      email: "dr.rajesh@swasthcard.gov.in",
      mobile: "9811122233",
      specialization: "Cardiology",
      licenseNo: "MCI-CARD-2015-8891",
      hospitalId: hospitals[0].id,
    },
    {
      name: "Dr. Priya Sen",
      email: "dr.priya@swasthcard.gov.in",
      mobile: "9811122234",
      specialization: "General Medicine",
      licenseNo: "MCI-GEN-2018-4421",
      hospitalId: hospitals[0].id,
    },
    {
      name: "Dr. Vikram Patel",
      email: "dr.vikram@swasthcard.gov.in",
      mobile: "9811122235",
      specialization: "Orthopedics",
      licenseNo: "MCI-ORTH-2016-1192",
      hospitalId: hospitals[1].id,
    },
    {
      name: "Dr. Ananya Mukherjee",
      email: "dr.ananya@swasthcard.gov.in",
      mobile: "9811122236",
      specialization: "Pediatrics",
      licenseNo: "MCI-PED-2019-9023",
      hospitalId: hospitals[2].id,
    },
    {
      name: "Dr. Farhan Akhtar",
      email: "dr.farhan@swasthcard.gov.in",
      mobile: "9811122237",
      specialization: "Dermatology",
      licenseNo: "MCI-DERM-2017-7711",
      hospitalId: hospitals[3].id,
    },
    {
      name: "Dr. Sunita Rao",
      email: "dr.sunita@swasthcard.gov.in",
      mobile: "9811122238",
      specialization: "Neurology",
      licenseNo: "MCI-NEUR-2014-3312",
      hospitalId: hospitals[1].id,
    },
  ];

  for (const doc of doctorData) {
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: doc.email }, { mobile: doc.mobile }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: doc.name,
          email: doc.email,
          mobile: doc.mobile,
          passwordHash: defaultPasswordHash,
          role: "DOCTOR",
        },
      });
    }

    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });

    if (!existingDoctor) {
      await prisma.doctor.create({
        data: {
          userId: user.id,
          hospitalId: doc.hospitalId,
          specialization: doc.specialization,
          licenseNo: doc.licenseNo,
          verifiedStatus: true,
        },
      });
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

