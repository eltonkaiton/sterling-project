const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ======================================================
// 🧩 REGISTER USER
// ======================================================
router.post("/register", async (req, res) => {
  try {
    let { name, email, phone, password, role } = req.body;

    // Trim and sanitize
    name = name?.trim();
    email = email?.trim().toLowerCase();
    phone = phone?.trim();
    role = role || "client"; // default role

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Password validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      phone: phone || "", // ✅ Include phone
      password,
      role,
      status: role === "admin" ? "active" : "pending",
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone, // ✅ Include phone in response
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ======================================================
// 🔐 LOGIN USER - WITH DEBUGGING
// ======================================================
router.post("/login", async (req, res) => {
  const { email, password, source } = req.body; // source: 'web' or 'mobile'

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    console.log(`🔐 Login attempt for: ${email} from ${source}`);

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // 🔍 ADDED DEBUGGING: Check what the database returns
    console.log("🔍 DATABASE USER FIND RESULT:", {
      found: !!user,
      userId: user?._id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      phoneExists: !!user?.phone,
      phoneValue: user?.phone || "NO PHONE IN DATABASE",
      allFields: user ? Object.keys(user._doc) : 'no user'
    });

    if (!user) {
      console.log("❌ User not found");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("❌ Incorrect password");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Account status check
    if (user.status !== "active") {
      console.log(`⚠️ Account not active (${user.status})`);
      return res
        .status(403)
        .json({ message: `Account is currently ${user.status}.` });
    }

    // ======================================================
    // 🌐 WEB LOGIN RESTRICTION
    // ======================================================
    if (source === "web" && user.role !== "admin") {
      console.log(`🚫 Web login denied for role: ${user.role}`);
      return res
        .status(403)
        .json({ message: "Only admins can log in via web" });
    }

    // ======================================================
    // 📱 MOBILE LOGIN ALLOWED ROLES
    // ======================================================
    const allowedMobileRoles = [
      "client",
      "surveyor",
      "claim_analyst",
      "loss_adjuster",
      "finance",
      "service_manager" // ✅ Added service_manager
    ];

    if (source === "mobile" && !allowedMobileRoles.includes(user.role)) {
      console.log(`🚫 Mobile login denied for role: ${user.role}`);
      return res.status(403).json({
        message:
          "Access denied: Only clients, surveyors, claim analysts, loss adjusters, finance, or service managers can log in via mobile.",
      });
    }

    // ======================================================
    // ✅ GENERATE JWT
    // ======================================================
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`✅ Login successful for ${user.role}: ${user.name}`);

    // 🔍 ADDED DEBUGGING: Final response check
    const responseData = {
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone, // ✅ Include phone in login response
        role: user.role,
        status: user.status,
      },
    };

    console.log("📤 FINAL LOGIN RESPONSE:", JSON.stringify(responseData, null, 2));

    res.json(responseData);
  } catch (err) {
    console.error("🔥 Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ======================================================
// 👤 GET USER PROFILE - WITH DEBUGGING
// ======================================================
router.get("/profile", async (req, res) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    console.log("🔍 PROFILE REQUEST - Decoded token:", decoded);
    
    // Find user by ID
    const user = await User.findById(decoded.id).select("-password");

    // 🔍 ADDED DEBUGGING: Profile database query
    console.log("🔍 PROFILE DATABASE RESULT:", {
      found: !!user,
      userId: user?._id,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      phoneExists: !!user?.phone,
      phoneValue: user?.phone || "NO PHONE IN PROFILE QUERY"
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user profile
    const profileResponse = {
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone, // ✅ Phone included
      role: user.role,
      status: user.status,
    };

    console.log("📤 PROFILE API RESPONSE:", JSON.stringify(profileResponse, null, 2));

    res.json(profileResponse);
  } catch (err) {
    console.error("❌ Profile fetch error:", err);
    
    // Handle different JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;