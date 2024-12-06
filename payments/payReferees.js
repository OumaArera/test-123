const express = require('express');
const authenticateToken = require('../authenticate/authenticateToken');
const db = require('../models');

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
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
        const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
            iv: CryptoJS.enc.Hex.parse(iv),
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });

        let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
        decryptedData = decryptedData.replace(/\0+$/, '');

        const accountData = JSON.parse(decryptedData);
        const { userIds } = accountData;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid data, an array of userIds is required",
                statusCode: 400
            });
        };

        for (const id of userIds) {
            const account = await db.AccountStructure.findOne({ where: { userId: id } });

            if (account) {
                account.balance = 0;
                account.bitCoinBalance = 0;

                await account.save();
            };
        };

        return res.status(200).json({
            error: false,
            success: true,
            message: 'Payments successful, balances have been reset to zero',
            statusCode: 200,
        });
    } catch (error) {
        console.error('Error:', error.message);
        return res.status(500).json({
            error: true,
            success: false,
            message: 'Internal Server Error',
            statusCode: 500,
        });
    }
});

module.exports = router;
