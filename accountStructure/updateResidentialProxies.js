const express = require('express');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();


const router = express.Router();

const validateUserId = (userId) => {
  return Number.isInteger(userId);
};

router.put('/', authenticateToken, async (req, res) => {

  const { newProxyId } = req.body;

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
