const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");
const auth = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");

// =============================================================
// 📁 MULTER FILE UPLOAD CONFIG
// =============================================================
const uploadFolder = "uploads/claims";

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// =============================================================
// 🔢 Generate unique claim reference
// =============================================================
const generateReference = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${timestamp}`;
};

// =============================================================
// 🛠️ DEBUG ROUTE (Temporary - can remove later)
// =============================================================
router.get("/debug-routes", (req, res) => {
  const routes = router.stack.map(layer => {
    return {
      method: Object.keys(layer.route?.methods || {})[0] || 'unknown',
      path: layer.route?.path || 'unknown'
    };
  });
  res.json(routes);
});

// =============================================================
// ✅ CREATE CLAIM (WITH FILE UPLOAD SUPPORT)
// =============================================================
router.post("/", auth, upload.array("evidenceFiles", 10), async (req, res) => {
  try {
    const {
      fullName, phone, email, policyNumber,
      vesselName, voyageRoute, cargoDescription,
      billOfLading, incidentDate, incidentPlace,
      typeOfLoss, causeOfLoss, estimatedLoss, description,
    } = req.body;

    if (!fullName || !phone || !email || !policyNumber || !vesselName || !typeOfLoss || !estimatedLoss) {
      return res.status(400).json({ message: "Missing required claim fields" });
    }

    const evidenceFiles = req.files?.map(f => ({
      filename: f.filename,
      path: f.path,
      mimetype: f.mimetype,
      size: f.size,
    })) || [];

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
      evidenceFiles,
      reference: generateReference(),
      status: "pending",
    });

    await claim.save();
    res.status(201).json({ message: "✅ Claim created successfully", claim });
  } catch (err) {
    console.log("CREATE CLAIM ERROR:", err);
    res.status(500).json({ message: "❌ Error creating claim", error: err.message });
  }
});

// =============================================================
// ✅ CLAIM SUMMARY (Admin / Analyst / Finance)
// =============================================================
router.get("/summary", auth, async (req, res) => {
  try {
    if (!["admin", "claim_analyst", "finance"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Not allowed" });
    }

    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: "pending" });
    const approvedClaims = await Claim.countDocuments({ status: "approved" });
    const rejectedClaims = await Claim.countDocuments({ status: "rejected" });
    const assignedClaims = await Claim.countDocuments({ status: "assigned" });

    const chartData = await Claim.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
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
// 📌 SURVEYOR ROUTES
// =============================================================
router.get("/surveyor/assigned", auth, async (req, res) => {
  try {
    if (req.user.role !== "surveyor") return res.status(403).json({ message: "Forbidden" });
    const claims = await Claim.find({ surveyorId: req.user._id });
    res.json({ claims });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching assigned claims", error: err.message });
  }
});

// =============================================================
// 🎯 SPECIFIC ACTION ROUTES (MUST COME BEFORE GENERIC ROUTES)
// =============================================================

// ANALYST ACTION - Specific route first
router.patch("/:id/analyst-action", auth, async (req, res) => {
  try {
    if (!["claim_analyst", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });

    const { status } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // ✅ Added "closed" as allowed status
    const allowedStatuses = ["approved", "rejected", "under_review", "closed"];
    if (!allowedStatuses.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    claim.status = status;
    await claim.save();

    res.json({ message: `✅ Analyst action updated to ${status}`, claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error performing analyst action", error: err.message });
  }
});

// ASSIGN CLAIM TO SURVEYOR
router.patch("/:id/assign", auth, async (req, res) => {
  try {
    if (!["admin", "claim_analyst"].includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });

    const { surveyorId } = req.body;
    if (!surveyorId) return res.status(400).json({ message: "Surveyor ID is required" });

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

// UPDATE CLAIM STATUS
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status is required" });

    // All valid statuses
    const validStatuses = [
      "pending", "assigned", "investigating", "completed",
      "under_review", "assessed", "approved", "finance_review",
      "paid", "closed", "rejected"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Surveyor restrictions
    if (req.user.role === "surveyor") {
      if (claim.surveyorId?.toString() !== req.user._id.toString())
        return res.status(403).json({ message: "Forbidden: Not your claim" });

      const allowedSurveyorStatuses = ["investigating", "completed"];
      if (!allowedSurveyorStatuses.includes(status))
        return res.status(403).json({ message: `Invalid status for surveyor: ${status}` });
    }

    // Set closed date if status is closed
    if (status === "closed") claim.closedDate = new Date();

    claim.status = status;
    await claim.save();

    res.json({ message: `✅ Claim status updated to ${status}`, claim });
  } catch (err) {
    console.error("Error updating claim status:", err);
    res.status(500).json({ message: "❌ Error updating claim status", error: err.message });
  }
});

// ASSESS CLAIM
router.put("/:id/assess", auth, async (req, res) => {
  try {
    if (!["loss_adjuster", "claim_analyst", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });

    const { assessmentNotes, finalLoss } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (!["completed", "assigned"].includes(claim.status)) {
      return res.status(400).json({ message: "❌ Claim not ready for assessment" });
    }

    claim.assessmentNotes = assessmentNotes || "";
    claim.finalLossAmount = finalLoss || 0;
    claim.assessmentDate = new Date();
    claim.lossAdjusterId = req.user._id;
    claim.status = "assessed";

    await claim.save();

    res.json({ message: "✅ Claim assessed successfully", claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error assessing claim", error: err.message });
  }
});

// UPDATE PAYMENT STATUS
router.put("/:id/payment-status", auth, async (req, res) => {
  try {
    if (!["finance", "admin"].includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });

    const {
      paymentStatus,
      paymentMethod,
      financeNotes,
      paymentReference,
      paymentDate,
    } = req.body;

    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.paymentStatus = paymentStatus || claim.paymentStatus;
    claim.paymentMethod = paymentMethod || claim.paymentMethod;
    claim.financeNotes = financeNotes || claim.financeNotes;
    claim.paymentReference = paymentReference || claim.paymentReference;
    claim.paymentDate = paymentDate || claim.paymentDate;
    claim.paymentAmount = claim.finalLossAmount || claim.paymentAmount;

    if (paymentStatus === "paid") claim.status = "paid";

    await claim.save();

    res.json({ message: "✅ Payment status updated successfully", claim });
  } catch (err) {
    console.error("Error updating payment status:", err.message);
    res.status(500).json({ message: "❌ Error updating payment status", error: err.message });
  }
});

// SURVEYOR INVESTIGATION
router.put("/:id/investigation", auth, async (req, res) => {
  try {
    if (req.user.role !== "surveyor") return res.status(403).json({ message: "Forbidden" });

    const { notes } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.surveyorId?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your claim" });

    claim.investigationNotes = notes || "";
    claim.status = "investigating";
    await claim.save();

    res.json({ message: "✅ Investigation report updated", claim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error submitting investigation", error: err.message });
  }
});

// =============================================================
// 📌 GENERIC CRUD ROUTES (COME LAST)
// =============================================================

// UPDATE CLAIM (Client & Admin)
router.patch("/:id", auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (req.user.role !== "admin" && claim.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    const allowedFields = [
      "fullName", "phone", "email", "policyNumber", "vesselName",
      "voyageRoute", "cargoDescription", "billOfLading", "incidentDate",
      "incidentPlace", "typeOfLoss", "causeOfLoss", "estimatedLoss",
      "description", "status"
    ];

    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (req.user.role !== "admin") delete updates.status;

    const updatedClaim = await Claim.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json({ message: "✅ Claim updated", claim: updatedClaim });
  } catch (err) {
    res.status(500).json({ message: "❌ Error updating claim", error: err.message });
  }
});

// DELETE CLAIM
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const deleted = await Claim.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Claim not found" });

    res.json({ message: "🗑️ Claim deleted" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error deleting claim", error: err.message });
  }
});

// =============================================================
// 📌 GET CLAIMS (WITH FILTERING, SEARCH & PAGINATION)
// =============================================================
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
    if (req.user.role === "loss_adjuster") query.status = { $in: ["assigned", "completed", "assessed"] };
    if (req.user.role === "finance") query.status = { $in: ["assessed", "approved", "paid"] };

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

// =============================================================
// 📌 VIEW SINGLE CLAIM
// =============================================================
router.get("/:id", auth, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    if (["admin", "claim_analyst", "loss_adjuster", "finance"].includes(req.user.role))
      return res.json(claim);

    if (req.user.role === "client" && claim.userId.toString() === req.user._id.toString())
      return res.json(claim);

    if (req.user.role === "surveyor" && claim.surveyorId?.toString() === req.user._id.toString())
      return res.json(claim);

    res.status(403).json({ message: "Forbidden: Not your claim" });
  } catch (err) {
    res.status(500).json({ message: "❌ Error fetching claim", error: err.message });
  }
});

module.exports = router;