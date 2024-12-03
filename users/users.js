const express = require('express');
const db = require('../models'); 
const authenticateToken = require('../authenticate/authenticateToken'); 
const router = express.Router();

// Apply the authenticateToken middleware to this route
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await db.User.findAll();

    // If no users found, return an empty array
    if (!users.length) {
      return res.status(200).json({
        success: true,
        error: false,
        message: 'No users found',
        users: [],
        statusCode: 200
      });
    }

    // Return users as JSON
    return res.status(200).json({
      success: true,
      error: false,
      users,
      statusCode: 200
    });

  } catch (error) {
    console.error('Error fetching users:', error.message);
    return res.status(500).json({
      success: false,
      error: true,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
