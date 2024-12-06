const express = require('express');
const db = require('../models');
const axios = require("axios");
const authenticateToken = require('../authenticate/authenticateToken');
const crypto = require('crypto');
require('dotenv').config();

const MERCHANT_ID = process.env.MERCHANT_ID;
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY;
const CRYPTO_URL = "https://api.cryptomus.com/v1/payment";

const router = express.Router();


router.post("/", authenticateToken,  async (req, res) => {
    // const { iv, ciphertext } = req.body;
    const { amount, currency } = req.body;

    const userId = req.user.id; 
        if (!userId) {
            return res.status(401).json({
                error: true,
                success: false,
                message: "Unauthorized: Missing user ID in token",
                statusCode: 401
            });
        }

    if (!amount || !currency || !userId){
        return res.status(400).json({
            error: true,
            success: false,
            message: "Missing required fields",
            statusCode: 400
        });
    };

    try {
        if (currency !== "USD") {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid currency, currency must be strictly USD",
                statusCode: 400
            });
        }

        const data = {
            amount: amount.toString(),
            currency: currency.toString(),
            order_id: `${userId}-${crypto.randomBytes(12).toString("hex")}`,
            url_success: "https://example.com",
            url_return: "https://example.com",
            url_callback: "https://537a-105-163-156-91.ngrok-free.app/users/callback",
            lifetime: 30000
        };

        const sign = crypto
            .createHash("md5")
            .update(Buffer.from(JSON.stringify(data)).toString("base64") + PAYMENT_API_KEY)
            .digest("hex");

        console.log("Sign: ", sign)

        const response = await axios.post(CRYPTO_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'merchant': MERCHANT_ID,
                'sign': sign
            }
        });
        console.log("Response body", response.data)

        return res.status(200).json({
            error: false,
            success: true,
            message: "Payment request created successfully",
            data: response.data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Error processing payment request: ", error);
        return res.status(500).json({
            error: true,
            success: false,
            message: "Internal server error",
            statusCode: 500
        });
    }
});

module.exports = router;

