const express = require('express');
const router = express.Router();
const authenticateToken = require('../authenticate/authenticateToken');

router.post('/', authenticateToken, (req, res) => {
  const { quantity } = req.body;

  if (!quantity) {
      return res.status(400).json({
          error: true,
          success: false,
          message: "Missing required fields",
          statusCode: 400
      });
  };

  try {
    const quantityInt = parseInt(quantity);

    if (!Number.isInteger(quantityInt)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Quantity must be an integer',
        statusCode: 400
      });
    }

    // Calculate the price
    const price = quantityInt * 10;

    // Return the response in the specified format
    return res.status(200).json({
      error: false,
      success: true,
      data: {
          price,
          quantity: quantityInt
      },
      statusCode: 200
    });
    
  } catch (error) {
    return res.status(500).json({
      error: true,
      success: false,
      message: `Error: ${error}`,
      statusCode: 500
    });
  };



  
});

module.exports = router;
