// routes/claims.js
const express = require("express");
const router = express.Router();
const Claim = require("../models/Claim");

// ✅ Create a new claim
router.post("/", async (req, res) => {
  try {
    const claim = new Claim(req.body);
    await claim.save();
    res.status(201).json({ message: "Claim created", claim });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating claim", error: err.message });
  }
});

// ✅ Get claims (supports search, filter, pagination, OR all)
router.get("/", async (req, res) => {
  const { status, search = "", page = 1, limit = 10, all } = req.query;

  const query = {
    ...(status && { status }),
    ...(search && {
      $or: [
        { reference: new RegExp(search, "i") },
        { claimantName: new RegExp(search, "i") },
        { claimType: new RegExp(search, "i") },
        { insured: new RegExp(search, "i") },
      ],
    }),
  };

  try {
    if (all === "true") {
      // ✅ Return ALL claims (no pagination)
      const claims = await Claim.find(query).sort({ createdAt: -1 });
      return res.json({ claims, total: claims.length });
    }

    // ✅ Paginated results
    const claims = await Claim.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Claim.countDocuments(query);

    res.json({
      claims,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching claims", error: err.message });
  }
});

// ✅ Update claim status
router.patch("/:id/status", async (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Status updated", claim });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating status", error: err.message });
  }
});

// ✅ Delete claim
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Claim.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting claim", error: err.message });
  }
});

// ✅ Get single claim
router.get("/:id", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    res.json(claim);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching claim", error: err.message });
  }
});

// ✅ Update entire claim
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Claim.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Claim not found" });
    res.json({ message: "Claim updated", claim: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating claim", error: err.message });
  }
});

module.exports = router;
