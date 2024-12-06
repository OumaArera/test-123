const express = require('express');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken'); 
require('dotenv').config();

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  const { balance, eliteResidentialHash, residentialProxiesIDsArray, datacenterProxiesIDsArray } = req.body;

  const userId = req.user.id; 
  if (!userId) {
    return res.status(401).json({
      error: true,
      success: false,
      message: "Unauthorized: Missing user ID in token",
      statusCode: 401
    });
  };

  if (!balance || !eliteResidentialHash || !residentialProxiesIDsArray || !datacenterProxiesIDsArray) {
    return res.status(401).json({
      error: true,
      success: false,
      message: "Missing required fields.",
      statusCode: 400
    });
  };

  try {
    // Validate data types
    if (
      !Number.isInteger(userId) ||
      typeof balance !== 'number' ||
      typeof eliteResidentialHash !== 'string' ||
      !Array.isArray(residentialProxiesIDsArray) ||
      !Array.isArray(datacenterProxiesIDsArray)
    ) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid data types',
        statusCode: 400
      });
    }

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    };

    // Set invitedBy to user.referredBy, or null if referredBy is null
    const invitedBy = user.referredBy || null;

    // Insert into AccountStructure table
    const accountDetails = await db.AccountStructure.create({
      userId,
      balance,
      bitCoinBalance: 0,
      eliteResidentialHash,
      residentialProxiesIDsArray, // Directly using the array
      datacenterProxiesIDsArray, // Directly using the array
      invitedBy
    });

    return res.status(201).json({
      success: true,
      error: false,
      message: "Data created successfully",
      accountDetails,
      statusCode: 201
    });
  } catch (error) {
    console.error('Error processing postAccount:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
