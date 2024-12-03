const express = require('express');
const axios = require('axios');
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();

const router = express.Router();

const API_TOKEN = process.env.PROXY_API_TOKEN;
const PRODUCTS_URL = 'https://apid.iproyal.com/v1/reseller/products';
const PRICING_URL = 'https://apid.iproyal.com/v1/reseller/orders/calculate-pricing';

router.post('/', authenticateToken, async (req, res) => {

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
    const {  quantity } = accountData;



    // Step 1: Fetch the product data
    const productsResponse = await axios.get(PRODUCTS_URL, {
      headers: {
        'X-Access-Token': API_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    // Step 2: Extract product_id, product_plan_id, and product_location_id
    const productData = productsResponse.data.data[0]; 
    const productId = productData.id;
    const productPlanId = productData.plans[0].id; 
    const productLocationId = productData.locations[0].id; 

    // Step 3: Use the extracted data to calculate pricing
    const pricingResponse = await axios.get(PRICING_URL, {
      headers: {
        'X-Access-Token': API_TOKEN,
        'Content-Type': 'application/json',
      },
      params: {
        product_id: productId,
        product_plan_id: productPlanId,
        product_location_id: productLocationId,
        quantity: quantity,
      },
    });

    let priceWithVat = pricingResponse.data.price_with_vat;
    priceWithVat *= 2;

    const responseData = {
      error: false,
      success: true,
      message: "Payment request created successfully",
      data: {
        price: priceWithVat,
        data: pricingResponse.data,
      },
      statusCode: 200,
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: error.response.data || 'Error from external API',
      });
    } else if (error.request) {
      res.status(500).json({ error: 'No response received from external API' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

module.exports = router;
