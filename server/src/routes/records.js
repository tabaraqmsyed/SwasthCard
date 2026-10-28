
const express = require("express");
const crypto = require("crypto");
const prisma = require("../db");
const {
  authenticateToken,
  requireRole,
} = require("../middleware/auth");

const router = express.Router();

const ALLOWED_TYPES = [
  "DIAGNOSIS",
  "PRESCRIPTION",
  "LAB_REPORT",
  "MEDICAL_HISTORY",
];

const GENESIS_HASH = "0".repeat(64);

// Check whether a doctor is verified and has active access to a patient.
async function canDoctorAccessPatient(doctorId, patientId) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: doctorId },
    select: { userId: true, verifiedStatus: true },
  });

  if (!doctor || !doctor.verifiedStatus) {
    return false;
  }

  const grant = await prisma.accessGrant.findFirst({
    where: {
      doctorId,
      patientId,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });

  return Boolean(grant);
}

// GET records belonging to the logged-in patient,
// or records for a patient the logged-in doctor can access.
router.get(
  "/",
  authenticateToken,
  requireRole("PATIENT", "DOCTOR"),
  async (req, res) => {
    try {
      let patientId;

      if (req.user.role === "PATIENT") {
        patientId = req.user.userId;
      } else {
        patientId = Number.parseInt(req.query.patientId, 10);

        if (!Number.isInteger(patientId) || patientId <= 0) {
          return res.status(400).json({
            success: false,
            message: "A valid patientId query parameter is required.",
          });
        }

        const allowed = await canDoctorAccessPatient(
          req.user.userId,
          patientId
        );

        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to access this patient's records.",
          });
        }
      }

      const where = { patientId };

      if (req.query.type) {
        const type = String(req.query.type).toUpperCase();

        if (!ALLOWED_TYPES.includes(type)) {
          return res.status(400).json({
            success: false,
            message: "Invalid medical record type.",
          });
        }

        where.type = type;
      }

      const records = await prisma.healthRecord.findMany({
        where,
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true, email: true },
              },
              hospital: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      await prisma.auditLog.create({
        data: {
          accessedByUserId: req.user.userId,
          patientId,
          action: "Viewed medical records",
        },
      });

      return res.json({ success: true, records });
    } catch (error) {
      console.error("Error fetching health records:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve health records.",
      });
    }
  }
);

// POST a doctor-issued medical record.
router.post(
  "/",
  authenticateToken,
  requireRole("DOCTOR"),
  async (req, res) => {
    try {
      const patientId = Number.parseInt(req.body.patientId, 10);
      const { type, content, fileUrl } = req.body;

      if (!Number.isInteger(patientId) || patientId <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid patientId is required.",
        });
      }

      if (
        typeof type !== "string" ||
        !ALLOWED_TYPES.includes(type.toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid medical record type.",
        });
      }

      if (
        content === undefined ||
        content === null ||
        (typeof content === "string" && !content.trim()) ||
        (typeof content === "object" &&
          !Array.isArray(content) &&
          Object.keys(content).length === 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Record content is required.",
        });
      }

      const normalizedType = type.toUpperCase();
      const contentString =
        typeof content === "string"
          ? content.trim()
          : JSON.stringify(content);

      if (contentString.length > 50000) {
        return res.status(400).json({
          success: false,
          message: "Record content is too large.",
        });
      }

      if (
        fileUrl !== undefined &&
        fileUrl !== null &&
        (typeof fileUrl !== "string" ||
          !fileUrl.startsWith("https://"))
      ) {
        return res.status(400).json({
          success: false,
          message: "fileUrl must be an HTTPS URL.",
        });
      }

      const patient = await prisma.patient.findUnique({
        where: { userId: patientId },
        select: { userId: true },
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found.",
        });
      }

      const doctorId = req.user.userId;
      const allowed = await canDoctorAccessPatient(doctorId, patientId);

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message:
            "Your doctor account must be verified and have active patient access.",
        });
      }

      const timestamp = new Date().toISOString();

      // Create the record and audit log together.
      const record = await prisma.$transaction(async (tx) => {
        const lastRecord = await tx.healthRecord.findFirst({
          where: { patientId },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { recordHash: true },
        });

        const previousHash = lastRecord?.recordHash || GENESIS_HASH;

        const recordHash = crypto
          .createHash("sha256")
          .update(
            JSON.stringify({
              patientId,
              doctorId,
              type: normalizedType,
              content: contentString,
              previousHash,
              timestamp,
            })
          )
          .digest("hex");

        const createdRecord = await tx.healthRecord.create({
          data: {
            patientId,
            doctorId,
            type: normalizedType,
            content: contentString,
            fileUrl: fileUrl || null,
            recordHash,
            previousHash,
          },
          include: {
            doctor: {
              include: {
                user: {
                  select: { name: true },
                },
                hospital: {
                  select: { name: true },
                },
              },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            accessedByUserId: doctorId,
            patientId,
            recordId: createdRecord.id,
            action: `Created ${normalizedType} record #${createdRecord.id}`,
          },
        });

        return createdRecord;
      });

      return res.status(201).json({
        success: true,
        message: "Medical record created successfully.",
        record,
      });
    } catch (error) {
      console.error("Error creating health record:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create health record.",
      });
    }
  }
);

// GET a single record by ID, with patient/doctor access checks.
router.get(
  "/:id",
  authenticateToken,
  requireRole("PATIENT", "DOCTOR"),
  async (req, res) => {
    try {
      const recordId = Number.parseInt(req.params.id, 10);

      if (!Number.isInteger(recordId) || recordId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid record ID.",
        });
      }

      const record = await prisma.healthRecord.findUnique({
        where: { id: recordId },
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true, email: true },
              },
              hospital: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Record not found.",
        });
      }

      if (req.user.role === "PATIENT") {
        if (record.patientId !== req.user.userId) {
          return res.status(403).json({
            success: false,
            message: "You cannot access another patient's record.",
          });
        }
      } else {
        const allowed = await canDoctorAccessPatient(
          req.user.userId,
          record.patientId
        );

        if (!allowed) {
          return res.status(403).json({
            success: false,
            message: "You are not authorized to access this record.",
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          accessedByUserId: req.user.userId,
          patientId: record.patientId,
          recordId: record.id,
          action: `Viewed medical record #${record.id}`,
        },
      });

      return res.json({ success: true, record });
    } catch (error) {
      console.error("Error retrieving record:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve medical record.",
      });
    }
  }
);

module.exports = router;
