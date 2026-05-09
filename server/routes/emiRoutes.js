const express = require("express");
const { body } = require("express-validator");
const {
  getEMIs,
  getEMIById,
  createEMI,
  updateEMI,
  deleteEMI,
  getSummary,
  getUpcoming,
  markPayment,
} = require("../controllers/emiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All EMI routes require authentication
router.use(protect);

// ─── Validation Rules ──────────────────────────────────────────────────────────

const createEMIValidation = [
  body("loanName")
    .trim()
    .notEmpty().withMessage("Loan name is required")
    .isLength({ max: 100 }).withMessage("Loan name cannot exceed 100 characters"),

  body("lenderName")
    .trim()
    .notEmpty().withMessage("Lender name is required")
    .isLength({ max: 100 }).withMessage("Lender name cannot exceed 100 characters"),

  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(["Home", "Car", "Personal", "Education", "Business", "Other"])
    .withMessage("Invalid category. Choose from: Home, Car, Personal, Education, Business, Other"),

  body("principalAmount")
    .notEmpty().withMessage("Principal amount is required")
    .isFloat({ min: 1 }).withMessage("Principal amount must be a positive number"),

  body("emiAmount")
    .notEmpty().withMessage("EMI amount is required")
    .isFloat({ min: 1 }).withMessage("EMI amount must be a positive number"),

  body("interestRate")
    .notEmpty().withMessage("Interest rate is required")
    .isFloat({ min: 0, max: 100 }).withMessage("Interest rate must be between 0 and 100"),

  body("tenureMonths")
    .notEmpty().withMessage("Tenure is required")
    .isInt({ min: 1, max: 600 }).withMessage("Tenure must be between 1 and 600 months"),

  body("startDate")
    .notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("Start date must be a valid date (YYYY-MM-DD)"),

  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

const updateEMIValidation = [
  body("loanName")
    .optional().trim()
    .isLength({ max: 100 }).withMessage("Loan name cannot exceed 100 characters"),

  body("lenderName")
    .optional().trim()
    .isLength({ max: 100 }).withMessage("Lender name cannot exceed 100 characters"),

  body("category")
    .optional()
    .isIn(["Home", "Car", "Personal", "Education", "Business", "Other"])
    .withMessage("Invalid category"),

  body("principalAmount")
    .optional()
    .isFloat({ min: 1 }).withMessage("Principal amount must be positive"),

  body("emiAmount")
    .optional()
    .isFloat({ min: 1 }).withMessage("EMI amount must be positive"),

  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage("Interest rate must be between 0–100"),

  body("tenureMonths")
    .optional()
    .isInt({ min: 1, max: 600 }).withMessage("Tenure must be between 1–600 months"),

  body("remainingMonths")
    .optional()
    .isInt({ min: 0 }).withMessage("Remaining months cannot be negative"),

  body("status")
    .optional()
    .isIn(["Active", "Completed", "Paused"])
    .withMessage("Status must be Active, Completed, or Paused"),

  body("nextDueDate")
    .optional()
    .isISO8601().withMessage("Next due date must be a valid date"),

  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// IMPORTANT: Specific routes must come BEFORE parameterized routes (:id)

// @route   GET /api/emis/summary
router.get("/summary", getSummary);

// @route   GET /api/emis/upcoming
router.get("/upcoming", getUpcoming);

// @route   GET /api/emis
router.get("/", getEMIs);

// @route   POST /api/emis
router.post("/", createEMIValidation, createEMI);

// @route   GET /api/emis/:id
router.get("/:id", getEMIById);

// @route   PUT /api/emis/:id
router.put("/:id", updateEMIValidation, updateEMI);

// @route   DELETE /api/emis/:id
router.delete("/:id", deleteEMI);

// @route   PATCH /api/emis/:id/pay
router.patch("/:id/pay", markPayment);

module.exports = router;
