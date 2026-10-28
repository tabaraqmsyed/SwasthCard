const express = require("express");
const crypto = require("crypto");
const prisma = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const MAX_PHOTO_LENGTH = 700_000;
const PHOTO_DATA_URL =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

// Generate an unpredictable token for public emergency QR access.
function generateQrToken() {
  return crypto.randomBytes(24).toString("base64url");
}

// GET patient card data
router.get("/card", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let patient = user.patient;

    // Create the patient profile if it does not exist.
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId,
          qrCodeId: generateQrToken(),
        },
      });
    } else {
      // Rotate older, predictable QR identifiers.
      const isStrongQrToken =
        typeof patient.qrCodeId === "string" &&
        /^[A-Za-z0-9_-]{32}$/.test(patient.qrCodeId);

      if (!isStrongQrToken) {
        patient = await prisma.patient.update({
          where: { userId },
          data: {
            qrCodeId: generateQrToken(),
          },
        });
      }
    }

    return res.json({
      success: true,
      card: {
        userId: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        nationalId: user.nationalId,
        role: user.role,
        memberSince: user.createdAt,
        qrCodeId: patient.qrCodeId,
        bloodGroup: patient.bloodGroup || "Not Specified",
        dob: patient.dob,
        gender: patient.gender || "Not Specified",
        address: patient.address || "Not Provided",
        photoUrl: patient.photoUrl || null,
      },
    });
  } catch (error) {
    console.error("Error fetching patient card:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve health card",
    });
  }
});

// PATCH update the signed-in patient's own profile
router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      bloodGroup,
      dob,
      gender,
      address,
      name,
      photoUrl,
    } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    // Validate uploaded image data.
    if (photoUrl !== undefined && photoUrl !== null && photoUrl !== "") {
      if (
        typeof photoUrl !== "string" ||
        photoUrl.length > MAX_PHOTO_LENGTH ||
        !PHOTO_DATA_URL.test(photoUrl)
      ) {
        return res.status(400).json({
          success: false,
          message: "Photo must be a JPG, PNG, or WebP image under 500 KB",
        });
      }
    }

    if (dob && Number.isNaN(new Date(dob).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser =
        name !== undefined
          ? await tx.user.update({
              where: { id: userId },
              data: { name: name.trim() },
              select: { name: true },
            })
          : await tx.user.findUnique({
              where: { id: userId },
              select: { name: true },
            });

      const patient = await tx.patient.upsert({
        where: { userId },

        update: {
          bloodGroup: bloodGroup || undefined,

          dob: dob
            ? new Date(dob)
            : dob === ""
              ? null
              : undefined,

          gender: gender || undefined,

          address:
            address !== undefined
              ? address || null
              : undefined,

          photoUrl:
            photoUrl !== undefined
              ? photoUrl || null
              : undefined,
        },

        create: {
          userId,
          bloodGroup: bloodGroup || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          address: address || null,
          photoUrl: photoUrl || null,
          qrCodeId: generateQrToken(),
        },
      });

      return { user: updatedUser, patient };
    });

    return res.json({
      success: true,
      message: "Profile updated successfully!",
      patient: updated.patient,
      name: updated.user?.name,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
});

// GET patient history timeline (Records + Audit Logs)
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.userId;

    const [records, auditLogs] = await Promise.all([
      prisma.healthRecord.findMany({
        where: { patientId },
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
        orderBy: { createdAt: "desc" },
      }),

      prisma.auditLog.findMany({
        where: { patientId },
        include: {
          accessedBy: {
            select: { name: true, role: true },
          },
        },
        orderBy: { timestamp: "desc" },
      }),
    ]);

    return res.json({
      success: true,
      records,
      auditLogs,
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve history",
    });
  }
});

module.exports = router;