const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const authenticateToken = require('../authenticate/authenticateToken');
const { AccountStructure, SubUsers } = require('../models'); // Adjust the path as needed
const e = require('express');
require('dotenv').config();

const router = express.Router();
const API_TOKEN = process.env.PROXY_API_TOKEN;
const SUBUSER_URL = 'https://resi-api.iproyal.com/v1/residential-subusers';

router.post('/', authenticateToken, async (req, res) => {
    const { quantity } = req.body;

    const userId = req.user.id; 
    if (!userId) {
        return res.status(401).json({
            error: true,
            success: false,
            message: "Unauthorized: Missing user ID in token",
            statusCode: 401
        });
    }

    if (!quantity) {
        return res.status(400).json({
            error: true,
            success: false,
            message: "Missing required fields",
            statusCode: 400
        });
    }

    try {
        // Validate the decrypted data
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid data, traffic must be a positive number greater than zero",
                statusCode: 400
            });
        }

        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid data, userId must be an integer",
                statusCode: 400
            });
        }

        const user = await db.SubUsers.findOne({ where: { userId } });

        if (user){
            res.status(400).json({
                error: true,
                success: false,
                message: "You already have a sub user account",
                statusCode: 400
            });
        };

        // Step 1: Retrieve user from AccountStructure
        const account = await AccountStructure.findOne({ where: { userId } });

        if (!account) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'User not found',
                statusCode: 404,
            });
        }

        const totalCost = quantity * 10;

        if (account.balance < totalCost) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'Insufficient balance',
                statusCode: 400,
            });
        };

        // Generate a unique username and a random password
        const username = `user_${uuidv4()}`.split('-')[0]; // Example: user_1234abcd
        const password = Math.random().toString(36).slice(-8); // Example: 4bT1o2Pk

        const data = {
            username: username,
            password: password,
            traffic: quantity,
        };

        // Step 2: Send the POST request to create the subuser
        const response = await axios.post(SUBUSER_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`,
            },
        });

        const orderId = response.data.id;
        const hash = response.data.hash;
        const userName = response.data.username;
        const password_ = response.data.password;
        const dateTime = new Date();

        if (!orderId || !hash || !userName || !password_) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Request not successful",
                statusCode: 400
            });
        };

        // Deduct the balance
        account.balance -= totalCost;

        // Save the updated balance
        await account.save();

        const orderDetails = {
            orderId,
            userId,
            hash,
            username: userName,
            password: password_,
            dateTime
        };

        await SubUsers.create(orderDetails);

        // Step 3: Return the response from the external API
        return res.status(200).json({
            error: false,
            success: true,
            message: 'Subuser created successfully',
            data: {
                id: response.data.id,
                hash: response.data.hash
            },
            statusCode: 200,
        });
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                error: true,
                success: false,
                message: error.response.data || 'Error from external API',
                statusCode: error.response.status,
            });
        } else if (error.request) {
            return res.status(500).json({
                error: true,
                success: false,
                message: 'No response received from external API',
                statusCode: 500,
            });
        } else {
            return res.status(500).json({
                error: true,
                success: false,
                message: 'Internal Server Error',
                statusCode: 500,
            });
        }
    }
});

module.exports = router;
