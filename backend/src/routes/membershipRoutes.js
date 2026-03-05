const express = require("express");
const router = express.Router();

const {
  createMembership,
  getUserMemberships,
  getMembershipById,
} = require("../controllers/membershipController");

/* CREATE MEMBERSHIP */
router.post("/", createMembership);

/* GET USER MEMBERSHIPS */
router.get("/user/:userId", getUserMemberships);

/* GET MEMBERSHIP BY ID */
router.get("/:id", getMembershipById);

module.exports = router;