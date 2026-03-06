const express = require("express");
const router = express.Router();

const {
  createMembership,
  getUserMemberships,
  getMembershipById,
  deleteMembership,
} = require("../controllers/membershipController");

/* CREATE MEMBERSHIP */
router.post("/", createMembership);

/* GET USER MEMBERSHIPS */
router.get("/user/:userId", getUserMemberships);

/* GET MEMBERSHIP BY ID */
router.get("/:id", getMembershipById);

// ✅ ADD THIS DELETE ROUTE
router.delete("/:id", deleteMembership);

module.exports = router;