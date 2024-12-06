const express = require('express');
const axios = require('axios');
const db = require('../models');
const authenticateToken = require('../authenticate/authenticateToken');
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
        // Retrieve the sub-user account
        const user = await db.SubUsers.findOne({ where: { userId } });
        if (!user) {
            return res.status(404).json({
                error: true,
                success: false,
                message: "You don't have a sub-user account",
                statusCode: 404
            });
        }
        const hash = user.hash || null;

        // Ensure the hash exists
        if (!hash) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid hash for the sub-user account",
                statusCode: 400
            });
        }

        // Retrieve the user's account
        const account = await db.AccountStructure.findOne({ where: { userId } });
        if (!account) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'User not found.',
                statusCode: 404,
            });
        }

        // Calculate total cost
        const totalCost = quantity * 10;

        // Check if balance is sufficient
        if (account.balance < totalCost) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'Insufficient balance.',
                statusCode: 400,
            });
        }

        // Deduct the balance
        account.balance -= totalCost;
        await account.save();

        // Make the external API request
        const data = { amount: quantity };
        const response = await axios.post(`${SUBUSER_URL}/${hash}/give-traffic`, data, {
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
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

        // Handle potential errors from the external API
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
