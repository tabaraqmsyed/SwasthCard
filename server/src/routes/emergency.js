
const express = require("express");
const prisma = require("../db");

const router = express.Router();

router.get("/:token", async (req, res) => {
  try {
    const token = req.params.token;

    if (
      typeof token !== "string" ||
      !/^[A-Za-z0-9_-]{32}$/.test(token)
    ) {
      return res.status(404).json({
        success: false,
        message: "Emergency profile not found.",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { qrCodeId: token },
      select: {
        bloodGroup: true,
        dob: true,
        gender: true,
        photoUrl: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Emergency profile not found.",
      });
    }

    let age = null;

    if (patient.dob) {
      const today = new Date();
      age = today.getFullYear() - patient.dob.getFullYear();

      const beforeBirthday =
        today.getMonth() < patient.dob.getMonth() ||
        (
          today.getMonth() === patient.dob.getMonth() &&
          today.getDate() < patient.dob.getDate()
        );

      if (beforeBirthday) {
        age -= 1;
      }
    }

    res.set("Cache-Control", "no-store");

    return res.json({
      success: true,
      emergencyProfile: {
        name: patient.user.name,
        photoUrl: patient.photoUrl || null,
        age,
        gender: patient.gender || null,
        bloodGroup: patient.bloodGroup || null,

        // These medical categories will be connected
        // when their data fields are implemented.
        allergies: null,
        currentMedications: null,
        medicalConditions: null,
        emergencyContacts: null,

        emergencyNotice:
          "If this person needs urgent medical care, contact local emergency services.",
      },
    });
  } catch (error) {
    console.error("Emergency profile lookup failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load emergency profile.",
    });
  }
});

module.exports = router;
