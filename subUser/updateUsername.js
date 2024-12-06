const express = require('express');
const axios = require('axios');
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();

const router = express.Router();
const API_TOKEN = process.env.PROXY_API_TOKEN;
const SUBUSER_URL = 'https://resi-api.iproyal.com/v1/residential-subusers';

router.put('/:hash', authenticateToken, async (req, res) => {

    const userId = req.user.id; 
    if (!userId) {
        return res.status(401).json({
            error: true,
            success: false,
            message: "Unauthorized: Missing user ID in token",
            statusCode: 401
        });
    };

    
    try {

        const user = await db.SubUsers.findOne({ where: { userId: userId } });

        if (!user){
            res.status(404).json({
                error: true,
                success: false,
                message: "You don't have a sub user account",
                statusCode: 404
            });
        };

        const username = user.username;
        const hash = user.hash;

        if (!username || username.trim() === '') {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Username cannot be empty",
                statusCode: 400
            });
        };

        const updateResponse = await axios.put(`${SUBUSER_URL}/${hash}`, {
            username: username.trim(),
        }, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
            }
        });

        return res.status(200).json({
            error: false,
            success: true,
            message: 'Username updated successfully',
            data: updateResponse.data,
            statusCode: 200,
        });

    } catch (error) {
        console.error('Error:', error.message);
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
