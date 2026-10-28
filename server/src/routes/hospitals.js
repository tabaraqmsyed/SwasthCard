const express = require("express");
const prisma = require("../db");

const router = express.Router();

// GET all hospitals with their doctors
router.get("/", async (req, res) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: {
        doctors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      hospitals,
    });
  } catch (error) {
    console.error("Error fetching hospitals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve hospitals",
    });
  }
});

// GET hospital by ID with doctors
router.get("/:id", async (req, res) => {
  try {
    const hospitalId = parseInt(req.params.id, 10);
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        doctors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
              },
            },
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    res.json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Error fetching hospital details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve hospital details",
    });
  }
});

module.exports = router;

