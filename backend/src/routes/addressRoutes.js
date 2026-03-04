const express = require("express");

const {
  createAddress,
  getUserAddresses,
  deleteAddress,
} = require("../controllers/addressController");

const router = express.Router();

// create address
router.post("/add", createAddress);

// get address by user
router.get("/user/:user_id", getUserAddresses);

// delete address
router.delete("/:id", deleteAddress);

module.exports = router;