const express = require('express');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken'); 
require('dotenv').config();


const router = express.Router();

// Middleware to validate incoming data
const validateUserId = (userId) => {
  return Number.isInteger(userId);
};

router.get('/', authenticateToken, async (req, res) => {
  

  try {
    // Fetch account structure for the given userId
    const accounts = await db.AccountStructure.findAll();

    if (!accounts) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Account structure not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      error: false,
      data: accounts,
      statusCode: 200
    });
  } catch (error) {
    console.error('Error fetching account structure:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
