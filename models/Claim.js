const mongoose = require("mongoose");

const ClaimSchema = new mongoose.Schema(
  {
    // 🔹 User who filed the claim
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Claimant Information
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

    // 🔹 Cargo / Voyage Info
    vesselName: { type: String, required: true },
    voyageRoute: { type: String },
    cargoDescription: { type: String },
    billOfLading: { type: String },

    // 🔹 Incident Details
    incidentDate: { type: String, required: true },
    incidentPlace: { type: String, required: true },
    typeOfLoss: { type: String, required: true },
    causeOfLoss: { type: String },
    estimatedLoss: { type: Number, required: true },
    description: { type: String },

    // 🔹 Status Tracking
    status: {
      type: String,
      enum: [
        "pending",         // 1. Client submitted
        "assigned",        // 2. Assigned to surveyor
        "investigating",   // 3. Surveyor investigating
        "completed",       // 4. Surveyor completed inspection
        "under_review",    // 5. Loss adjuster reviewing
        "assessed",        // 6. Loss adjuster finished assessment
        "approved",        // 7. Admin approved
        "finance_review",  // 8. Finance reviewing
        "paid",            // 9. Finance paid
        "closed",          // 10. Final closed stage
        "rejected",        // ➖ Rejected
      ],
      default: "pending",
    },

    // 🔹 Surveyor
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

    // 🔹 Loss Adjuster
    lossAdjusterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assessmentNotes: { type: String },
    finalLossAmount: { type: Number },

    recommendation: {
      type: String,
      enum: ["approve", "approved", "reject", "rejected", "review", null],
      default: null,
    },

    assessmentDate: { type: Date },

    // 🔹 Admin Approval
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    adminDecision: {
      type: String,
      enum: ["approved", "rejected", "forwarded_to_finance", null],
      default: null,
    },
    adminNotes: { type: String },

    // 🔹 Finance Section
    financeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    financeNotes: { type: String },

    paymentStatus: {
      type: String,
      enum: ["pending", "processed", "failed", "paid", "received", null],
      default: "pending",
    },

    paymentReference: { type: String },
    paymentAmount: { type: Number },
    paymentDate: { type: Date },

    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cheque", "mobile_money", "other", null],
      default: null,
    },

    // 🔹 Finalization
    finalReport: { type: String },
    closedDate: { type: Date },
  },
  {
    timestamps: true, // Handles createdAt & updatedAt automatically
  }
);

// 🔹 Trim recommendation value
ClaimSchema.pre("validate", function (next) {
  if (this.recommendation) {
    this.recommendation = this.recommendation.toLowerCase().trim();
  }
  next();
});

module.exports = mongoose.model("Claim", ClaimSchema);
