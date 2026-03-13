const express = require("express");
const router = express.Router();

const {
  createMembership,
  getUserMemberships,
  getMembershipById,
  deleteMembership,
  getAllMemberships,
  updateMembership,
} = require("../controllers/membershipController");

/* GET ALL MEMBERSHIPS */
router.get("/", getAllMemberships);

/* CREATE MEMBERSHIP */
router.post("/", createMembership);

/* GET USER MEMBERSHIPS */
router.get("/user/:userId", getUserMemberships);

/* GET MEMBERSHIP BY ID */
router.get("/:id", getMembershipById);

/* UPDATE STATUS OR OTHER DETAILS */
router.put("/:id", updateMembership);

// ✅ ADD THIS DELETE ROUTE
router.delete("/:id", deleteMembership);

module.exports = router;