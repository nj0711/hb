import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    console.log("Auth header:", authHeader);

    if (!token || token === "null" || token === "undefined") {
      console.log("Auth middleware - No valid token provided");
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth middleware - Decoded token:", decoded);

    // ✅ Support both id and userId
    const userId = decoded.userId || decoded.id;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      console.log("Auth middleware - User not found");
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    req.token = token;
    console.log("Auth middleware - User authenticated successfully");

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    console.log("Authorize middleware - User role:", req.user?.role);
    console.log("Authorize middleware - Allowed roles:", roles);

    if (!roles.includes(req.user.role)) {
      console.log("Authorize middleware - Access denied");
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
