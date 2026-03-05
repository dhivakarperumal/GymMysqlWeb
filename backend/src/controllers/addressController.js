const db = require("../config/db");

// CREATE ADDRESS
const createAddress = (req, res) => {
  const {
    user_id,
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country,
  } = req.body;

  const sql = `
    INSERT INTO user_addresses
    (user_id, name, email, phone, address, city, state, zip, country)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [user_id, name, email, phone, address, city, state, zip, country],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }

      res.json({
        success: true,
        message: "Address saved successfully",
        id: result.insertId,
      });
    }
  );
};

// GET USER ADDRESSES
const getUserAddresses = (req, res) => {
  const { user_id } = req.params;

  const sql = "SELECT * FROM user_addresses WHERE user_id = ?";

  db.query(sql, [user_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(result);
  });
};

// UPDATE ADDRESS
const updateAddress = (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country,
  } = req.body;

  const sql = `
    UPDATE user_addresses
    SET name=?, email=?, phone=?, address=?, city=?, state=?, zip=?, country=?, updated_at=CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, email, phone, address, city, state, zip, country, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Address not found" });
      }
      res.json({ success: true, message: "Address updated" });
    }
  );
};

// DELETE ADDRESS
const deleteAddress = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM user_addresses WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json({
      success: true,
      message: "Address deleted",
    });
  });
};

module.exports = {
  createAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
};