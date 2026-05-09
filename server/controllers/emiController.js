const { validationResult } = require("express-validator");
const EMI = require("../models/EMI");

// ─── Helper: Calculate next due date ──────────────────────────────────────────
const calculateNextDueDate = (startDate, tenureMonths, remainingMonths) => {
  const monthsPaid = tenureMonths - remainingMonths;
  const nextDue = new Date(startDate);
  nextDue.setMonth(nextDue.getMonth() + monthsPaid + 1);
  return nextDue;
};

/**
 * @desc    Get all EMIs for logged-in user
 * @route   GET /api/emis
 * @access  Private
 */
const getEMIs = async (req, res, next) => {
  try {
    const { status, category, sortBy = "nextDueDate", order = "asc" } = req.query;

    // Build filter
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (category) filter.category = category;

    // Build sort
    const sortOrder = order === "desc" ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    const emis = await EMI.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: emis.length,
      data: emis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single EMI by ID
 * @route   GET /api/emis/:id
 * @access  Private
 */
const getEMIById = async (req, res, next) => {
  try {
    const emi = await EMI.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!emi) {
      return res.status(404).json({
        success: false,
        message: "EMI not found.",
      });
    }

    res.status(200).json({ success: true, data: emi });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new EMI
 * @route   POST /api/emis
 * @access  Private
 */
const createEMI = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const {
      loanName,
      lenderName,
      category,
      principalAmount,
      emiAmount,
      interestRate,
      tenureMonths,
      startDate,
      notes,
    } = req.body;

    // Auto-calculate next due date from start date
    const start = new Date(startDate);
    const nextDueDate = new Date(start);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const emi = await EMI.create({
      userId: req.user._id,
      loanName,
      lenderName,
      category,
      principalAmount,
      emiAmount,
      interestRate,
      tenureMonths,
      remainingMonths: tenureMonths, // starts at full tenure
      startDate: start,
      nextDueDate,
      notes: notes || "",
      status: "Active",
    });

    res.status(201).json({
      success: true,
      message: "EMI added successfully! 🎉",
      data: emi,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update EMI
 * @route   PUT /api/emis/:id
 * @access  Private
 */
const updateEMI = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    // Find EMI and verify ownership
    let emi = await EMI.findOne({ _id: req.params.id, userId: req.user._id });
    if (!emi) {
      return res.status(404).json({ success: false, message: "EMI not found." });
    }

    const allowedUpdates = [
      "loanName", "lenderName", "category", "principalAmount",
      "emiAmount", "interestRate", "tenureMonths", "remainingMonths",
      "startDate", "nextDueDate", "status", "notes",
    ];

    // Apply only allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        emi[field] = req.body[field];
      }
    });

    // Auto-update status to Completed if no remaining months
    if (emi.remainingMonths === 0) {
      emi.status = "Completed";
    }

    // Recalculate nextDueDate if remainingMonths or startDate changed
    if (req.body.remainingMonths !== undefined || req.body.startDate !== undefined) {
      emi.nextDueDate = calculateNextDueDate(
        emi.startDate,
        emi.tenureMonths,
        emi.remainingMonths
      );
    }

    await emi.save();

    res.status(200).json({
      success: true,
      message: "EMI updated successfully.",
      data: emi,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete EMI
 * @route   DELETE /api/emis/:id
 * @access  Private
 */
const deleteEMI = async (req, res, next) => {
  try {
    const emi = await EMI.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!emi) {
      return res.status(404).json({ success: false, message: "EMI not found." });
    }

    res.status(200).json({
      success: true,
      message: `"${emi.loanName}" EMI deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard summary stats
 * @route   GET /api/emis/summary
 * @access  Private
 */
const getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch all EMIs once
    const allEMIs = await EMI.find({ userId });
    const activeEMIs = allEMIs.filter((e) => e.status === "Active");
    const completedEMIs = allEMIs.filter((e) => e.status === "Completed");
    const pausedEMIs = allEMIs.filter((e) => e.status === "Paused");

    // Total monthly outflow (active EMIs only)
    const totalMonthlyEMI = activeEMIs.reduce((sum, e) => sum + e.emiAmount, 0);

    // Total outstanding (remaining months × EMI amount)
    const totalOutstanding = activeEMIs.reduce(
      (sum, e) => sum + e.remainingMonths * e.emiAmount,
      0
    );

    // Total principal across all EMIs
    const totalPrincipal = allEMIs.reduce((sum, e) => sum + e.principalAmount, 0);

    // Total amount paid so far
    const totalPaid = allEMIs.reduce((sum, e) => {
      const monthsPaid = e.tenureMonths - (e.remainingMonths || 0);
      return sum + monthsPaid * e.emiAmount;
    }, 0);

    // Category breakdown (active only)
    const categoryBreakdown = activeEMIs.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.emiAmount;
      return acc;
    }, {});

    // Upcoming dues in next 7 days
    const today = new Date();
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const upcomingDues = activeEMIs.filter((e) => {
      const due = new Date(e.nextDueDate);
      return due >= today && due <= next7Days;
    }).length;

    // EMIs ending this month
    const endingThisMonth = activeEMIs.filter(
      (e) => e.remainingMonths === 1
    ).length;

    res.status(200).json({
      success: true,
      data: {
        counts: {
          total: allEMIs.length,
          active: activeEMIs.length,
          completed: completedEMIs.length,
          paused: pausedEMIs.length,
        },
        financials: {
          totalMonthlyEMI: Math.round(totalMonthlyEMI * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalPrincipal: Math.round(totalPrincipal * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
        },
        categoryBreakdown,
        alerts: {
          upcomingDuesIn7Days: upcomingDues,
          endingThisMonth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get upcoming EMIs due in next N days (default 7)
 * @route   GET /api/emis/upcoming?days=7
 * @access  Private
 */
const getUpcoming = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    futureDate.setHours(23, 59, 59, 999);

    const upcomingEMIs = await EMI.find({
      userId: req.user._id,
      status: "Active",
      nextDueDate: { $gte: today, $lte: futureDate },
    }).sort({ nextDueDate: 1 });

    res.status(200).json({
      success: true,
      count: upcomingEMIs.length,
      daysAhead: days,
      data: upcomingEMIs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark EMI payment done (reduce remaining months by 1)
 * @route   PATCH /api/emis/:id/pay
 * @access  Private
 */
const markPayment = async (req, res, next) => {
  try {
    const emi = await EMI.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!emi) {
      return res.status(404).json({ success: false, message: "EMI not found." });
    }

    if (emi.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This EMI is already completed.",
      });
    }

    if (emi.remainingMonths <= 0) {
      emi.status = "Completed";
      await emi.save();
      return res.status(400).json({
        success: false,
        message: "No remaining payments. EMI marked as completed.",
      });
    }

    // Reduce remaining months
    emi.remainingMonths -= 1;

    // Update next due date
    if (emi.remainingMonths === 0) {
      emi.status = "Completed";
    } else {
      const nextDue = new Date(emi.nextDueDate);
      nextDue.setMonth(nextDue.getMonth() + 1);
      emi.nextDueDate = nextDue;
    }

    await emi.save();

    res.status(200).json({
      success: true,
      message:
        emi.status === "Completed"
          ? "🎉 Final payment done! EMI completed!"
          : `✅ Payment recorded! ${emi.remainingMonths} month(s) remaining.`,
      data: emi,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEMIs,
  getEMIById,
  createEMI,
  updateEMI,
  deleteEMI,
  getSummary,
  getUpcoming,
  markPayment,
};
