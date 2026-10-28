const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT token from Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required. Please log in.",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, decodedUser) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Session expired or invalid token. Please log in again.",
        });
      }

      req.user = decodedUser;
      next();
    }
  );
}

/**
 * Middleware to restrict route to specific roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
};

