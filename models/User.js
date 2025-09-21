const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: [
      "admin", 
      "client", 
      "surveyor", 
      "claim_analyst", 
      "finance", 
      "loss_adjuster", 
      "service_manager"
    ], // ✅ expanded roles
    default: "client"
  },
  status: {
    type: String,
    enum: ["active", "pending", "suspended", "rejected"], 
    default: "pending" // ✅ new users must be approved
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Pre-save hook to hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // only hash if changed/new
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Method to compare passwords during login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
