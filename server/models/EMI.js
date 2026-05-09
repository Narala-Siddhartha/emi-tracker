const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster user-specific queries
    },
    loanName: {
      type: String,
      required: [true, "Loan name is required"],
      trim: true,
      maxlength: [100, "Loan name cannot exceed 100 characters"],
    },
    lenderName: {
      type: String,
      required: [true, "Lender name is required"],
      trim: true,
      maxlength: [100, "Lender name cannot exceed 100 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Home", "Car", "Personal", "Education", "Business", "Other"],
        message: "{VALUE} is not a valid category",
      },
    },
    principalAmount: {
      type: Number,
      required: [true, "Principal amount is required"],
      min: [1, "Principal amount must be positive"],
    },
    emiAmount: {
      type: Number,
      required: [true, "EMI amount is required"],
      min: [1, "EMI amount must be positive"],
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },
    tenureMonths: {
      type: Number,
      required: [true, "Tenure is required"],
      min: [1, "Tenure must be at least 1 month"],
      max: [600, "Tenure cannot exceed 600 months"],
    },
    remainingMonths: {
      type: Number,
      min: [0, "Remaining months cannot be negative"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    nextDueDate: {
      type: Date,
      required: [true, "Next due date is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["Active", "Completed", "Paused"],
        message: "{VALUE} is not a valid status",
      },
      default: "Active",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: Total amount payable ────────────────────────────────────────────
emiSchema.virtual("totalPayable").get(function () {
  return this.emiAmount * this.tenureMonths;
});

// ─── Virtual: Total interest payable ──────────────────────────────────────────
emiSchema.virtual("totalInterest").get(function () {
  return this.totalPayable - this.principalAmount;
});

// ─── Virtual: Amount paid so far ──────────────────────────────────────────────
emiSchema.virtual("amountPaid").get(function () {
  const monthsPaid = this.tenureMonths - (this.remainingMonths || 0);
  return monthsPaid * this.emiAmount;
});

// ─── Virtual: Outstanding principal (approx) ──────────────────────────────────
emiSchema.virtual("outstandingAmount").get(function () {
  return (this.remainingMonths || 0) * this.emiAmount;
});

// ─── Virtual: Progress percentage ─────────────────────────────────────────────
emiSchema.virtual("progressPercent").get(function () {
  if (!this.tenureMonths) return 0;
  const monthsPaid = this.tenureMonths - (this.remainingMonths || 0);
  return Math.round((monthsPaid / this.tenureMonths) * 100);
});

// ─── Pre-save: Auto-calculate remaining months ────────────────────────────────
emiSchema.pre("save", function (next) {
  if (this.isNew && this.remainingMonths === undefined) {
    this.remainingMonths = this.tenureMonths;
  }
  next();
});

module.exports = mongoose.model("EMI", emiSchema);
