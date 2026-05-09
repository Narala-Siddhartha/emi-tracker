const express = require("express");
const { body } = require("express-validator");
const { register, login, getMe, updateProfile, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Min 6 characters").matches(/\d/).withMessage("Must contain a number"),
  body("phone").optional({ nullable: true, checkFalsy: true }).matches(/^\+?[0-9]{10,14}$/).withMessage("Enter a valid phone number"),
];

const loginValidation = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("phone").optional({ nullable: true, checkFalsy: true }).matches(/^\+?[0-9]{10,14}$/).withMessage("Enter a valid phone number"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").notEmpty().withMessage("New password is required").isLength({ min: 6 }).withMessage("Min 6 characters").matches(/\d/).withMessage("Must contain a number"),
];

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.get("/me", protect, getMe);
router.put("/me", protect, updateProfileValidation, updateProfile);
router.put("/change-password", protect, changePasswordValidation, changePassword);

// Test email route
router.post("/test-email", protect, async (req, res) => {
  try {
    const { sendWelcomeEmail } = require("../services/emailService");
    await sendWelcomeEmail({ toEmail: req.user.email, toName: req.user.name });
    res.json({ success: true, message: `Test email sent to ${req.user.email} ✅` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
