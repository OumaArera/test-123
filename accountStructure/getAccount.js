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

  const userId = req.user.id; 
  if (!userId) {
    return res.status(401).json({
      error: true,
      success: false,
      message: "Unauthorized: Missing user ID in token",
      statusCode: 401
    });
  };

  // Validate userId
  if (!validateUserId(userId)) {
    return res.status(400).json({
      error: true,
      success: false,
      message: 'Invalid userId',
      statusCode: 400
    });
  }

  try {
    // Fetch account structure for the given userId
    const account = await db.AccountStructure.findOne({
      where: { userId },
      attributes: ['userId', 'balance', 'eliteResidentialHash', 'residentialProxiesIDsArray', 'datacenterProxiesIDsArray', 'invitedBy']
    });

    if (!account) {
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
      data: account,
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
