const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Claim = require("../models/Claim");
const auth = require("../middleware/auth");

// GET all surveyors
router.get("/", auth, async (req, res) => {
  try {
    const surveyors = await User.find({ role: "surveyor", status: "active" }).select(
      "_id name email phone"
    );
    res.json({ surveyors });
  } catch (err) {
    res.status(500).json({ message: "Error fetching surveyors", error: err.message });
  }
});

// POST assign surveyor to a claim
router.post("/assign/:claimId", auth, async (req, res) => {
  try {
    const { surveyorId } = req.body;
    const claim = await Claim.findById(req.params.claimId);
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    claim.surveyorId = surveyorId; // Add surveyorId field in Claim schema if not exists
    claim.status = "assigned";      // Optional: mark as assigned
    await claim.save();

    res.json({ message: "Surveyor assigned successfully", claim });
  } catch (err) {
    res.status(500).json({ message: "Error assigning surveyor", error: err.message });
  }
});

module.exports = router;
