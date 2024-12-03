const express = require('express');
const db = require('../models');
const CryptoJS = require('crypto-js');
const authenticateToken = require('../authenticate/authenticateToken'); 
require('dotenv').config();

const router = express.Router();

// Middleware to validate incoming data
const validateRequestBody = (data) => {
  if (!data || !data.iv || !data.ciphertext) {
    return { valid: false, message: 'Invalid data. Missing required fields' };
  }

  return { valid: true };
};

router.post('/', authenticateToken, async (req, res) => {
  const { iv, ciphertext } = req.body;

  // Validate request body
  const validation = validateRequestBody(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      error: true,
      success: false,
      message: validation.message,
      statusCode: 400
    });
  }

  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key not found');
    }

    // Decrypt the data
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    decryptedData = decryptedData.replace(/\0+$/, '');

    // Parse decrypted data
    const accountData = JSON.parse(decryptedData);
    const { userId, balance, eliteResidentialHash, residentialProxiesIDsArray, datacenterProxiesIDsArray } = accountData;

    // Validate data types
    if (!Number.isInteger(userId) || typeof balance !== 'number' || typeof eliteResidentialHash !== 'string' ||
        !Array.isArray(residentialProxiesIDsArray) || !Array.isArray(datacenterProxiesIDsArray)) {
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
    await db.AccountStructure.create({
      userId,
      balance,
      bitCoinBalance:0,
      eliteResidentialHash,
      residentialProxiesIDsArray: JSON.parse(residentialProxiesIDsArray),
      datacenterProxiesIDsArray: JSON.parse(datacenterProxiesIDsArray),
      invitedBy
    });

    return res.status(201).json({
      success: true,
      error: false,
      message: "Data created successfully",
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