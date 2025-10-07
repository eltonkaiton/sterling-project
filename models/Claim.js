const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema({
  // 🔹 User who filed the claim
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // 🔹 Claimant / Customer Information
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  policyNumber: { type: String, required: true },

  // 🔹 Claim Reference
  reference: {
    type: String,
    required: true,
    unique: true,
  },

  // 🔹 Marine / Cargo Details
  vesselName: { type: String, required: true },
  voyageRoute: { type: String },
  cargoDescription: { type: String },
  billOfLading: { type: String },

  // 🔹 Incident Details
  incidentDate: { type: String, required: true },
  incidentPlace: { type: String, required: true },
  typeOfLoss: { type: String, required: true }, // e.g. Fire, Theft, Damage
  causeOfLoss: { type: String },
  estimatedLoss: { type: Number, required: true },
  description: { type: String },

  // 🔹 System Tracking
  status: {
    type: String,
    enum: [
      "pending",        // submitted by client
      "assigned",       // assigned to surveyor
      "investigating",  // under inspection
      "completed",      // survey done
      "approved",       // approved by admin/finance
      "rejected"        // rejected by admin
    ],
    default: "pending",
  },

  // 🔹 Assigned surveyor & investigation
  surveyorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  investigationNotes: { type: String },
  evidenceFiles: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],

  // 🔹 System fields
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Claim", ClaimSchema);
