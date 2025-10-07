const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const auth = require("../middleware/auth");

// Utility: Generate unique claim reference
const generateReference = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${timestamp}`;
};

// =============================================================
// ✅ CREATE CLAIM (Client)
// =============================================================
router.post("/", auth, async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      policyNumber,
      vesselName,
      voyageRoute,
      cargoDescription,
      billOfLading,
      incidentDate,
      incidentPlace,
      typeOfLoss,
      causeOfLoss,
      estimatedLoss,
      description,
    } = req.body;

    // Basic validation
    if (!fullName || !phone || !email || !policyNumber || !vesselName || !typeOfLoss || !estimatedLoss) {
      return res.status(400).json({ message: "Missing required claim fields" });
    }

    const claim = new Claim({
      userId: req.user._id,
      fullName,
      phone,
      email,
      policyNumber,
      vesselName,
      voyageRoute,
      cargoDescription,
      billOfLading,
      incidentDate,
      incidentPlace,
      typeOfLoss,
      causeOfLoss,
      estimatedLoss,
      description,
      reference: generateReference(),
      status: "pending",
    });

    await claim.save();
    res.status(201).json({ message: "✅ Claim created successfully", claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error creating claim", error: err.message });
  }
});

// =============================================================
// ✅ GET CLAIM SUMMARY (Admin / Analyst Dashboard)
// =============================================================
router.get("/summary", auth, async (req, res) => {
  try {
    if (!["admin", "claim_analyst"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Not allowed" });
    }

    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: "pending" });
    const approvedClaims = await Claim.countDocuments({ status: "approved" });
    const rejectedClaims = await Claim.countDocuments({ status: "rejected" });
    const assignedClaims = await Claim.countDocuments({ status: "assigned" });

    const chartData = await Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      summary: { totalClaims, pendingClaims, assignedClaims, approvedClaims, rejectedClaims },
      chartData,
    });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching summary", error: err.message });
  }
});

// =============================================================
// ✅ SURVEYOR ROUTES
// =============================================================

// Get claims assigned to surveyor
router.get("/surveyor/assigned", auth, async (req, res) => {
  try {
    if (req.user.role !== "surveyor") {
      return res.status(403).json({ message: "Forbidden: Only surveyors can access this" });
    }

    const claims = await Claim.find({ surveyorId: req.user._id });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching assigned claims", error: err.message });
  }
});

// Save investigation report / notes
router.put("/:id/investigation", auth, async (req, res) => {
  try {
    if (req.user.role !== "surveyor") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { notes } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.surveyorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden: Not your claim" });
    }

    claim.investigationNotes = notes || "";
    claim.status = "investigating";
    await claim.save();

    res.json({ message: "✅ Investigation report updated", claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error submitting investigation", error: err.message });
  }
});

// =============================================================
// ✅ CLAIM MANAGEMENT (All Roles)
// =============================================================

// Get all claims (filtered/paginated)
router.get("/", auth, async (req, res) => {
  try {
    let { status, search = "", page = 1, limit = 10, sort = "desc" } = req.query;
    page = Number(page);
    limit = Number(limit);
    const sortOrder = sort === "asc" ? 1 : -1;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { policyNumber: { $regex: search, $options: "i" } },
        { vesselName: { $regex: search, $options: "i" } },
      ];
    }

    if (req.user.role === "client") query.userId = req.user._id;
    if (req.user.role === "surveyor") query.surveyorId = req.user._id;

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ claims, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching claims", error: err.message });
  }
});

// Get single claim
router.get("/:id", auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (["admin", "claim_analyst"].includes(req.user.role)) return res.json(claim);
    if (req.user.role === "client" && claim.userId.toString() === req.user._id.toString())
      return res.json(claim);
    if (req.user.role === "surveyor" && claim.surveyorId?.toString() === req.user._id.toString())
      return res.json(claim);

    res.status(403).json({ message: "Forbidden: Not your claim" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching claim", error: err.message });
  }
});

// Update claim (Admin / Owner)
router.patch("/:id", auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (req.user.role !== "admin" && claim.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowedFields = [
      "fullName",
      "phone",
      "email",
      "policyNumber",
      "vesselName",
      "voyageRoute",
      "cargoDescription",
      "billOfLading",
      "incidentDate",
      "incidentPlace",
      "typeOfLoss",
      "causeOfLoss",
      "estimatedLoss",
      "description",
      "status",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.user.role !== "admin") delete updates.status;

    const updatedClaim = await Claim.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: "✅ Claim updated", claim: updatedClaim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error updating claim", error: err.message });
  }
});

// Assign claim to surveyor
router.patch("/:id/assign", auth, async (req, res) => {
  try {
    const { surveyorId } = req.body;
    if (!surveyorId) return res.status(400).json({ message: "Surveyor ID is required" });

    if (!["admin", "claim_analyst"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Not allowed" });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.surveyorId = surveyorId;
    claim.status = "assigned";
    await claim.save();

    res.json({ message: "✅ Claim assigned to surveyor", claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error assigning claim", error: err.message });
  }
});

// Delete claim
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Only admin can delete claims" });
    }

    const deleted = await Claim.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Claim not found" });

    res.json({ message: "🗑️ Claim deleted" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error deleting claim", error: err.message });
  }
});

// =============================================================
// ✅ UPDATE CLAIM STATUS (Surveyor / Admin)
// =============================================================
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const claim = await Claim.findById(id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Role restrictions
    if (req.user.role === "surveyor") {
      // Surveyor can only mark their own claims
      if (claim.surveyorId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Forbidden: Not your assigned claim" });
      }
      // Only allow specific transitions for surveyors
      const allowedStatuses = ["investigating", "completed"];
      if (!allowedStatuses.includes(status)) {
        return res.status(403).json({ message: "Forbidden: Invalid status change" });
      }
    }

    // Update status
    claim.status = status;
    await claim.save();

    res.json({ message: `✅ Claim status updated to ${status}`, claim });
  } catch (err) {
    console.error("❌ Error updating claim status:", err);
    res.status(500).json({ message: "Server error while updating status" });
  }
});


module.exports = router;
