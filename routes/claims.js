const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");

// Utility: Generate a unique claim reference
const generateReference = () => {
  const timestamp = Date.now().toString().slice(-6); // last 6 digits of timestamp
  return `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${timestamp}`;
};

// ✅ Create a new claim
router.post("/", async (req, res) => {
  try {
    const { userId, userName, userPhone, claimType, insured, amount, description, status } = req.body;

    if (!userId || !userName || !userPhone || !claimType || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const claim = new Claim({
      userId,
      userName,
      userPhone,
      claimType,
      insured,
      amount,
      description,
      status: status || "pending",
      reference: generateReference(),
    });

    await claim.save();
    res.status(201).json({ message: "Claim created", claim });
  } catch (err) {
    res.status(500).json({ message: "Error creating claim", error: err.message });
  }
});

// ✅ Get claims (search + filter + pagination + all + sort)
router.get("/", async (req, res) => {
  try {
    let { status, search = "", page = 1, limit = 10, all, sort = "desc" } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const sortOrder = sort === "asc" ? 1 : -1;

    // Build query
    const query = {
      ...(status && { status }),
      ...(search && {
        $or: [
          { reference: { $regex: search, $options: "i" } },
          { userName: { $regex: search, $options: "i" } },
          { claimType: { $regex: search, $options: "i" } },
          { insured: { $regex: search, $options: "i" } },
        ],
      }),
    };

    if (all === "true") {
      const claims = await Claim.find(query).sort({ createdAt: sortOrder });
      return res.json({
        claims,
        total: claims.length,
        page: 1,
        pages: 1,
      });
    }

    const total = await Claim.countDocuments(query);
    const claims = await Claim.find(query)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      claims,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching claims", error: err.message });
  }
});

// ✅ Update claim status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const claim = await Claim.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Status updated", claim });
  } catch (err) {
    res.status(500).json({ message: "Error updating status", error: err.message });
  }
});

// ✅ Delete claim
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Claim.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting claim", error: err.message });
  }
});

// ✅ Get single claim
router.get("/:id", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ message: "Error fetching claim", error: err.message });
  }
});

// ✅ Update entire claim
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Claim.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim updated", claim: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating claim", error: err.message });
  }
});

module.exports = router;
