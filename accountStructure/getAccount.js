const express = require('express');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken'); 
require('dotenv').config();


const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {

  const userId = req.user.id; 
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Missing user ID in token",
      statusCode: 401
    });
  };

  try {
    const account = await db.AccountStructure.findOne({
      where: { userId },
      attributes: ['userId', 'balance', 'eliteResidentialHash', 'residentialProxiesIDsArray', 'datacenterProxiesIDsArray', 'invitedBy']
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account structure not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      data: account,
      statusCode: 200
    });
  } catch (error) {
    console.error('Error fetching account structure:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
