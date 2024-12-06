const express = require('express');
const db = require('../models');
const CryptoJS = require('crypto-js');
const authenticateToken = require('../authenticate/authenticateToken'); 
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_KEY;

const router = express.Router();

// Middleware to validate incoming data
const validateUserId = (userId) => {
  return Number.isInteger(userId);
};

router.get('/:userId', authenticateToken, async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

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
    // Fetch account transactions
    const account = await db.Cryptomus.findAll({
      where: { userId },
      attributes: ['userId', 'amount', 'uuid', 'orderId', 'paymentAmount', 'paymentAmountUsd', "merchantAmount", "network", "currency", "payerCurrency", "transactionId", "sign"]
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
