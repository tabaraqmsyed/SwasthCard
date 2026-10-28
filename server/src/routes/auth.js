
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

// REGISTER — public registration always creates a PATIENT.
router.post("/register", async (req, res) => {
  try {
    const { name, mobile, email, nationalId, password } = req.body || {};

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanMobile =
      typeof mobile === "string" && mobile.trim()
        ? mobile.trim()
        : null;
    const cleanEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : null;
    const cleanNationalId =
      typeof nationalId === "string" && nationalId.trim()
        ? nationalId.trim().toUpperCase()
        : null;

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters.",
      });
    }

    if (!cleanMobile && !cleanEmail && !cleanNationalId) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, email, or national ID is required.",
      });
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const conditions = [];
    if (cleanMobile) conditions.push({ mobile: cleanMobile });
    if (cleanEmail) conditions.push({ email: cleanEmail });
    if (cleanNationalId) conditions.push({ nationalId: cleanNationalId });

    const existingUser = await prisma.user.findFirst({
      where: { OR: conditions },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with these details may already exist. Please log in.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: cleanName,
          mobile: cleanMobile,
          email: cleanEmail,
          nationalId: cleanNationalId,
          passwordHash,
          role: "PATIENT",
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: createdUser.id,
          qrCodeId: crypto.randomBytes(24).toString("base64url"),
        },
      });

      return {
        ...createdUser,
        patient,
      };
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
        qrCodeId: user.patient.qrCodeId,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "An account with these details may already exist. Please log in.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed due to a server error.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (
      typeof identifier !== "string" ||
      !identifier.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required.",
      });
    }

    const cleanIdentifier = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { mobile: cleanIdentifier },
          { email: cleanIdentifier.toLowerCase() },
          { nationalId: cleanIdentifier.toUpperCase() },
        ],
      },
      include: {
        patient: true,
        doctor: true,
      },
    });

    // Use the same error for an unknown user and a wrong password.
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials.",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials.",
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
        qrCodeId: user.patient?.qrCodeId || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error.",
    });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        mobile: user.mobile,
        patient: user.patient,
        doctor: user.doctor,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user profile.",
    });
  }
});

module.exports = router;
