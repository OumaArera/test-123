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
    Object.entries(accountData).forEach(([key, value]) => console.log(`${key} : ${value}`))

    const newDataCentreId = accountData;
    console.log("New Data centre ID: ", newDataCentreId);

    if (!newDataCentreId) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Missing new data centre ID in decrypted data',
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

    let datacenterProxiesIDsArray = JSON.parse(account.datacenterProxiesIDsArray);
    console.log(`Data Centre array: `, datacenterProxiesIDsArray)
    datacenterProxiesIDsArray.push(newDataCentreId.newDataCentreId);
    console.log("New array: ", datacenterProxiesIDsArray);

    // Persist the changes
    account.datacenterProxiesIDsArray = JSON.stringify(datacenterProxiesIDsArray);
    await account.save();

    return res.status(200).json({
      success: true,
      error: false,
      message: 'New data centre ID added successfully',
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
