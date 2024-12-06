const express = require('express');
const db = require('../models');
const axios = require("axios");
const { v4: uuidv4 } = require('uuid'); 
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();

const PROXY_API_KEY = process.env.SPACE_PROXY_API_KEY;
const SPACE_PROXY_URL = "https://panel.spaceproxy.net/api/new-order-amount/?api_key";
const NEW_ORDER_URL = "https://panel.spaceproxy.net/api/new-order/?api_key";

const router = express.Router();

router.post("/", authenticateToken, async (req, res) => {
    const { period, country, type, quantity, ipList } = req.body;

    const userId = req.user.id; 
    if (!userId) {
        return res.status(401).json({
            error: true,
            success: false,
            message: "Unauthorized: Missing user ID in token",
            statusCode: 401
        });
    }

    if (!period || !country || !type || !quantity || !ipList) {
        return res.status(400).json({
            error: true,
            success: false,
            message: "Missing required fields",
            statusCode: 400
        });
    }

    try {
        const validCountries = [
            "ru", "ca", "us", "de", "gb", "nl", "es", "it", "id", "fr", "ch", "pt", 
            "ua", "kz", "cn", "pl", "in", "jp", "ab", "au", "at", "az", "al", "dz", 
            "ar", "am", "bd", "by", "be", "bg", "bo", "ba", "br", "hu", "ve", "vn", 
            "hk", "gr", "ge", "dk", "eg", "zm", "il", "jo", "iq", "ir", "ie", "is", 
            "kh", "cm", "qa", "ke", "cy", "co", "kr", "cr", "ci", "cu", "kg", "lv", 
            "lb", "ly", "lt", "lu", "my", "mv", "mt", "ma", "mx", "md", "mc", "mn", 
            "np", "ng", "nz", "no", "ae", "pk", "py", "pe", "ro", "sa", "sc", "rs", 
            "sg", "sk", "si", "tj", "tw", "th", "tz", "tn", "tm", "tr", "uz", "uy", 
            "ph", "fi", "hr", "me", "cz", "cl", "se", "lk", "ee", "et", "za", "sd", 
            "jm"
        ];
        const validTypes = ["dedicated", "shared"];

        if (!validCountries.includes(country.toLowerCase())) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid country code",
                statusCode: 400
            });
        }

        if (!validTypes.includes(type.toLowerCase())) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid type",
                statusCode: 400
            });
        }

        const quantityInt = parseInt(quantity);
        const periodInt = parseInt(period);
        if (isNaN(quantityInt) || isNaN(periodInt) || quantityInt <= 0 || periodInt <= 0) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid quantity or period",
                statusCode: 400
            });
        }

        if (!Array.isArray(ipList) || ipList.length !== 0) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "IP list must be an empty array",
                statusCode: 400
            });
        }

        const requestData = {
            type: type.toLowerCase(),
            ip_version: 4,
            country: country.toLowerCase(),
            quantity: periodInt,
            period: periodInt,
            ip_list: ipList
        };


        const priceResponse = await axios.post(`${SPACE_PROXY_URL}=${PROXY_API_KEY}`, requestData, {
            headers: { 'Content-Type': 'application/json' }
        });

        let amount = priceResponse.data.amount * 2; 


        const account = await db.AccountStructure.findOne({ where: { userId } });

        if (!account || account.balance < amount) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Insufficient balance",
                statusCode: 400
            });
        }

        account.balance -= amount;
        await account.save();

        const orderResponse = await axios.post(`${NEW_ORDER_URL}=${PROXY_API_KEY}`, requestData, {
            headers: { 'Content-Type': 'application/json' }
        });

        
        const orderId = uuidv4();
        const dateTime = new Date().toISOString();

        
        const orderDetails = {
            userId,
            orderId,
            dateTime,
            orderData: orderResponse.data 
        };
        

        await db.Orders.create(orderDetails);


        return res.status(200).json({
            error: false,
            success: true,
            message: "Order processed successfully",
            data: orderDetails,
            statusCode: 200
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: true,
            success: false,
            message: `An error occurred during processing. Error: ${error.message}`,
            statusCode: 500
        });
    }
});

module.exports = router;
