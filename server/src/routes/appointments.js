const express = require("express");
const prisma = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// GET all appointments for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.userId;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        hospital: true,
        doctor: {
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
      orderBy: { date: "desc" },
    });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
});

// POST book new appointment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { hospitalId, doctorId, date, timeSlot } = req.body;

    if (!hospitalId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Hospital, doctor, date, and time slot are required.",
      });
    }

    // Verify patient profile exists, create if not present
    let patient = await prisma.patient.findUnique({
      where: { userId: patientId },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          userId: patientId,
          qrCodeId: `SC-${patientId}-${Date.now().toString(36).toUpperCase()}`,
        },
      });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment date format.",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: parseInt(doctorId, 10),
        hospitalId: parseInt(hospitalId, 10),
        date: parsedDate,
        timeSlot: String(timeSlot),
        status: "CONFIRMED",
      },
      include: {
        hospital: true,
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        accessedByUserId: patientId,
        patientId,
        action: `Booked OPD Appointment #${appointment.id} with ${appointment.doctor.user.name} at ${appointment.hospital.name}`,
      },
    });

    res.status(201).json({
      success: true,
      message: "OPD Appointment booked and confirmed successfully!",
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book appointment",
    });
  }
});

// PATCH cancel appointment
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  try {
    const appointmentId = parseInt(req.params.id, 10);
    const patientId = req.user.userId;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or you do not have permission to cancel it.",
      });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        accessedByUserId: patientId,
        patientId,
        action: `Cancelled OPD Appointment #${appointmentId}`,
      },
    });

    res.json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment: updated,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
    });
  }
});

module.exports = router;

