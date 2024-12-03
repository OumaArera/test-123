const express = require('express');
const db = require('../models');
const CryptoJS = require("crypto-js");
const axios = require("axios");
const authenticateToken = require('../authenticate/authenticateToken');
const crypto = require('crypto');
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_KEY;
const MERCHANT_ID = process.env.MERCHANT_ID;
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY;
const CRYPTO_URL = "https://api.cryptomus.com/v1/payment";

const router = express.Router();


router.post("/", authenticateToken,  async (req, res) => {
    const { iv, ciphertext } = req.body;
    // const { amount, currency, userId } = req.body;

    if (!iv || !ciphertext){
        return res.status(400).json({
            error: true,
            success: false,
            message: "Missing required fields",
            statusCode: 400
        });
    };

    try {
        // Decrypt the data
        const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
            iv: CryptoJS.enc.Hex.parse(iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
        decryptedData = decryptedData.replace(/\0+$/, '');

        const accountData = JSON.parse(decryptedData);
        const { amount, currency, userId } = accountData;

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

        Object.entries(data).forEach(([key, value]) => console.log(`${key} : ${JSON.stringify(value)}`))

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

