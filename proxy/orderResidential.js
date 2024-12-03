const express = require('express');
const axios = require('axios');
const CryptoJS = require("crypto-js");
const authenticateToken = require('../authenticate/authenticateToken');
const db = require('../models'); // Assuming you have set up Sequelize models
require('dotenv').config();

const router = express.Router();

const API_TOKEN = process.env.PROXY_API_TOKEN;
const PRODUCTS_URL = 'https://apid.iproyal.com/v1/reseller/products';
const PRICING_URL = 'https://apid.iproyal.com/v1/reseller/orders/calculate-pricing';
const ORDER_URL = 'https://apid.iproyal.com/v1/reseller/orders';
const SECRET_KEY = process.env.ENCRYPTION_KEY;

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
        const { quantity, userId } = accountData;



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

        // Step 3: Calculate pricing
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

        // Step 4: Check user's balance
        const account = await db.AccountStructure.findOne({ where: { userId: userId } });
        if (!account) {
            return res.status(404).json({ error: true, success: false, message: "User not found", statusCode: 404 });
        }

        if (account.balance < priceWithVat) {
            return res.status(400).json({ error: true, success: false, message: "Insufficient balance", statusCode: 400 });
        }

        // Step 5: Reduce the user's balance
        account.balance -= priceWithVat;
        await account.save();

        // Step 6: Create the order with the provided data
        const orderRequestData = {
            product_id: productId,
            product_plan_id: productPlanId,
            product_location_id: productLocationId,
            quantity: quantity,
            auto_extend: true, 
            product_question_answers: {} 
        };

        const orderResponse = await axios.post(ORDER_URL, orderRequestData, {
            headers: {
                'X-Access-Token': API_TOKEN,
                'Content-Type': 'application/json',
            }
        });

        const orderId = `order_${Date.now()}`;
        const dateTime = new Date();

        const orderDetails={
            userId,
            orderId,
            dateTime,
            orderData: orderResponse.data
        }
        
        await db.Orders.create(orderDetails);

        const dataStr = JSON.stringify(orderDetails);
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

        const responseData = {
            error: false,
            success: true,
            message: "Order created and persisted successfully",
            payload,
            statusCode: 200
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
