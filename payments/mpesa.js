const express = require('express');
const db = require('../models');
const CryptoJS = require('crypto-js');
const IntaSend = require('intasend-node');
const authenticateToken = require('../authenticate/authenticateToken');
const { where } = require('sequelize');
require('dotenv').config();

const SECRET_KEY = process.env.ENCRYPTION_KEY;
const PUBLISHABLE_KEY = process.env.MPESA_PUBLISHABLE_KEY;
const MPESA_SECRET_KEY = process.env.MPESA_SECRET_KEY;
const FIRST_NAME = process.env.FIRST_NAME;
const LAST_NAME = process.env.LAST_NAME;
const EMAIL = process.env.EMAIL;
const WEBSITE = process.env.WEBSITE;
const API_REF = process.env.API_REF;

const router = express.Router();

const checkPaymentStatus = async (collection, invoiceId) => {
    const maxRetries = 20; // Maximum number of retries
    const retryInterval = 10000; // Interval between retries in milliseconds (10 seconds)

    for (let i = 0; i < maxRetries; i++) {
        const paymentStatus = await collection.status(invoiceId);

        if (paymentStatus.invoice.state !== 'PENDING' && paymentStatus.invoice.state !== 'PROCESSING') {
            return paymentStatus;
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, retryInterval));
    }

    throw new Error('Payment status check timed out');
};

const refereeToken = async (userId, amount) =>{
    const account = await db.AccountStructure.findOne({ where: { userId }});
    const user = await db.User.findOne({ where: { id:userId}});

    if (account){
        account.balance += amount;
        await account.save();
    }else{
        const referee = user.referredBy || null;
        const details = {
            userId,
            balance: amount,
            bitCoinBalance: 0,
            eliteResidentialHash: "test",
            residentialProxiesIDsArray: [],
            datacenterProxiesIDsArray: [],
            invitedBy: referee
        };
        await db.AccountStructure.create(details);
    }
};

router.post("/", authenticateToken, async (req, res) => {
    const { iv, ciphertext } = req.body;

    if (!iv || !ciphertext) {
        return res.status(400).json({
            error: true,
            success: false,
            message: 'Invalid input data, missing required fields',
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
        const { phoneNumber, userId, amount } = accountData;

        const user = await db.User.findOne({ where: { id: userId}});
        let refree;
        if (user){
            refree = user.referredBy || null;
        }else{
            res.status(404).json({
                error: true,
                success: false,
                message: "User not found",
                statusCode: 404
            });
        };

        // Initialize IntaSend SDK
        let intasend = new IntaSend(
            PUBLISHABLE_KEY,
            MPESA_SECRET_KEY,
            true // Set to true for test environment
        );

        // Trigger STK Push
        let collection = intasend.collection();
        const stkResponse = await collection.mpesaStkPush({
            first_name: FIRST_NAME,
            last_name: LAST_NAME,
            email: EMAIL,
            host: WEBSITE,
            amount: parseFloat(amount), 
            phone_number: phoneNumber,
            api_ref: API_REF
        });

        // Poll for payment status until it is not 'PENDING' or 'PROCESSING'
        const paymentStatus = await checkPaymentStatus(collection, stkResponse.invoice.invoice_id);

        if (paymentStatus.invoice.state === 'COMPLETE') {
            const { charges, net_amount, mpesa_reference, invoice_id } = paymentStatus.invoice;

            // Add charges + net_amount to the balance in the AccountStructure table
            const account = await db.AccountStructure.findOne({ where: { userId } });
            console.log("Account: ", account);
            const token = 0.05*parseFloat(net_amount);

            if (account) {
                account.balance += (parseFloat(charges) + parseFloat(net_amount));
                await account.save();

            } else {

                const details = {
                    userId,
                    balance: amount,
                    bitCoinBalance: 0,
                    eliteResidentialHash: "test",
                    residentialProxiesIDsArray: [],
                    datacenterProxiesIDsArray: [],
                    invitedBy: refree
                };
                await db.AccountStructure.create(details);
            };
            refereeToken(userId, token);

            const mpesaReference = mpesa_reference || 'N/A';  

            // Insert a new record into the TransactionDetails table
            await db.TransactionDetails.create({
                userId,
                invoiceId: invoice_id,
                mpesaReferenceNumber: mpesaReference,
                creationDate: new Date(),
            });

            return res.status(200).json({
                success: true,
                error: false,
                message: 'Transaction completed successfully',
                statusCode: 200
            });
        } else {
            return res.status(400).json({
                error: true,
                success: false,
                message: `Transaction failed: ${paymentStatus.invoice.state.toLowerCase()}`,
                statusCode: 400
            });
        }
    } catch (error) {
        console.error("Error in STK Push:", error);
        return res.status(500).json({
            error: true,
            success: false,
            message: 'Internal server error during STK Push',
            statusCode: 500
        });
    }
});

module.exports = router;
