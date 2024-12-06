const express = require('express');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();


const router = express.Router();

const validateUserId = (userId) => {
  return Number.isInteger(userId);
};


router.put('/', authenticateToken, async (req, res) => {

  const { newDataCentreId } = req.body;

  const userId = req.user.id; 
  if (!userId) {
    return res.status(401).json({
      error: true,
      success: false,
      message: "Unauthorized: Missing user ID in token",
      statusCode: 401
    });
  };

  if (!validateUserId(userId)) {
    return res.status(400).json({
      error: true,
      success: false,
      message: 'Invalid userId',
      statusCode: 400
    });
  }

  

  try {

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
    datacenterProxiesIDsArray.push(newDataCentreId.newDataCentreId);

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
