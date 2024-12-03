const express = require('express');
const db = require('../models');
const crypto = require('crypto');
require('dotenv').config();

const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY;

const router = express.Router();


router.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

const refereeToken = async (userId, amount) =>{
    const account = await db.AccountStructure.findOne({ where: { userId }});
    const user = await db.User.findOne({ where: { id:userId}});

    if (account){
        account.bitCoinBalance += amount;
        await account.save();
    }else{
        const referee = user.referredBy || null;
        const details = {
            userId,
            balance: 0,
            bitCoinBalance: amount,
            eliteResidentialHash: "test",
            residentialProxiesIDsArray: [],
            datacenterProxiesIDsArray: [],
            invitedBy: referee
        };
        await db.AccountStructure.create(details);
    }
};


router.post("/", async (req, res) => {
    try {
        const { sign } = req.body;

        if (!sign) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid payload: missing signature",
                statusCode: 400
            });
        }

        // Clone the request body and remove the sign for signature verification
        const data = { ...req.body };
        console.log("Data: ", data);
        delete data.sign;


        const dataToHash = {
            amount: data.amount.toString(),
            currency: "USD",
            order_id: data.order_id,
            url_success: "https://example.com",
            url_return: "https://example.com",
            url_callback: "https://1e06-105-163-1-2.ngrok-free.app/users/callback",
            lifetime: 30000
        };

        // Generate the hash for verification
        const hash = crypto
            .createHash("md5")
            .update(Buffer.from(JSON.stringify(dataToHash)).toString("base64") + PAYMENT_API_KEY)
            .digest("hex");
        console.log("Payment hash: ", hash);


        // Verify the signature
        if (hash !== sign) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid signature",
                statusCode: 400
            });
        }

        // Extract the necessary data from the request body
        const {
            uuid,
            order_id,
            amount,
            payment_amount,
            payment_amount_usd,
            merchant_amount,
            network,
            currency,
            payer_currency,
            txid,
            status
        } = req.body;

        // Extract userId from the order_id
        const userId = order_id.split('-')[0];

        const user = await db.AccountStructure.findOne({
            where: { userId }
          });

        if (user){
            user.bitCoinBalance += parseFloat(amount);
            await user.save();

            const token = 0.05*parseFloat(amount);
            refereeToken(userId, token);
        
        };
        const orderId = order_id

        const transaction = await db.Cryptomus.findOne({
            where: { orderId }
        });

        if (transaction){
            return res.status(400).json({
                error: true,
                success: false,
                message: "Duplicate transaction",
                statusCode: 400
            });
        };

        // Persist data only if the payment is confirmed as 'paid'
        if (status === "paid") {
            await db.Cryptomus.create({
                userId: userId,
                amount: amount,
                uuid: uuid,
                orderId: order_id,
                paymentAmount: payment_amount,
                paymentAmountUsd: payment_amount_usd,
                merchantAmount: merchant_amount,
                network: network,
                currency: currency,
                payerCurrency: payer_currency,
                transactionId: txid,
                sign: sign
            });
            // user.

            return res.status(200).json({
                error: false,
                success: true,
                message: "Payment data processed and saved successfully",
                statusCode: 200
            });
        } else {
            return res.status(400).json({
                error: true,
                success: false,
                message: `Payment status is not 'paid': ${status}`,
                statusCode: 400
            });
        }

    } catch (error) {
        console.error("Error processing callback: ", error);
        return res.status(500).json({
            error: true,
            success: false,
            message: "Internal server error",
            statusCode: 500
        });
    }
});

module.exports = router;
