const express = require('express');
const axios = require('axios');
const db = require('../models');
require('dotenv').config();

const router = express.Router();
const API_TOKEN = process.env.PROXY_API_TOKEN;
const SUBUSER_URL = 'https://resi-api.iproyal.com/v1/residential-subusers';

router.post('/add-traffic', async (req, res) => {

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
        const { userId, quantity } = accountData;

        const user = await db.SubUsers.findOne({ where: { userId: userId } });

        if (!user){
            res.status(404).json({
                error: true,
                success: false,
                message: "You don't have a sub user account",
                statusCode: 404
            });
        };
        const hash = user.hash;

        // Query the user's account in the AccountStructure
        const account = await db.AccountStructure.findOne({ where: { userId } });

        if (!account) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'User not found.',
                statusCode: 404,
            });
        };

        const totalCost = quantity * 10;

        if (account.balance < totalCost) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'Insufficient balance.',
                statusCode: 400,
            });
        };

        // Deduct the balance
        account.balance -= totalCost;

        // Save the updated balance
        await account.save();

        // Make the request to add traffic
        const data = { amount: quantity };

        const response = await axios.post(`${SUBUSER_URL}/${hash}/give-traffic`, data, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        // Return the response from the external API
        return res.status(200).json({
            error: false,
            success: true,
            message: 'Traffic added successfully.',
            data: response.data,
            statusCode: 200,
        });
    } catch (error) {
        console.error('Error:', error.message);

        // Handle potential errors
        if (error.response) {
            res.status(error.response.status).json({
                error: true,
                success: false,
                message: error.response.data || 'Error from external API',
                statusCode: error.response.status,
            });
        } else if (error.request) {
            res.status(500).json({
                error: true,
                success: false,
                message: 'No response received from external API',
                statusCode: 500,
            });
        } else {
            res.status(500).json({
                error: true,
                success: false,
                message: 'Internal Server Error',
                statusCode: 500,
            });
        }
    }
});

module.exports = router;
