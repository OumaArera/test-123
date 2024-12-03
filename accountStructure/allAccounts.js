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

    const dataStr = JSON.stringify(accounts);
    const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const encryptedData = CryptoJS.AES.encrypt(dataStr, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    }).toString();

    const payload = {
      iv: iv,
      ciphertext: encryptedData
    };

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
