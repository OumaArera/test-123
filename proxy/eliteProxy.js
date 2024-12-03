const express = require('express');
const router = express.Router();
const authenticateToken = require('../authenticate/authenticateToken');

router.post('/', authenticateToken, (req, res) => {
  const { iv, ciphertext } = req.body;

  if (!iv || !ciphertext) {
      return res.status(400).json({
          error: true,
          success: false,
          message: "Missing required fields",
          statusCode: 400
      });
  };

  try {
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });
    let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    decryptedData = decryptedData.replace(/\0+$/, '');

    const accountData = JSON.parse(decryptedData);
    const { quantity } = accountData;

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
