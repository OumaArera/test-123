const express = require('express');
const db = require('../models');
const CryptoJS = require('crypto-js');
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_KEY;

const router = express.Router();

const validateUserId = (userId) => {
  return Number.isInteger(userId);
};

router.put('/:userId', authenticateToken, async (req, res) => {
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

  const { iv, ciphertext } = req.body;

  if (!iv || !ciphertext) {
    return res.status(400).json({
      error: true,
      success: false,
      message: 'Invalid input data',
      statusCode: 400
    });
  }

  try {
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
        iv: CryptoJS.enc.Hex.parse(iv),
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
      });

    let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    decryptedData = decryptedData.replace(/\0+$/, '');

    // Parse decrypted data
    const accountData = JSON.parse(decryptedData);

    const newProxyId = accountData;

    if (!newProxyId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Missing newProxyId in decrypted data',
        statusCode: 400
      });
    }

    const account = await db.AccountStructure.findOne({
      where: { userId }
    });

    if (!account) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'Account not found',
        statusCode: 404
      });
    }

    let residentialProxiesIDsArray = JSON.parse(account.residentialProxiesIDsArray) || [];
    residentialProxiesIDsArray.push(newProxyId);


    account.residentialProxiesIDsArray = JSON.stringify(residentialProxiesIDsArray);
    await account.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: 'Proxy ID added successfully',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error adding proxy ID:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
