const express = require('express');
const axios = require("axios");
const authenticateToken = require('../authenticate/authenticateToken');
require('dotenv').config();

const PROXY_API_KEY = process.env.SPACE_PROXY_API_KEY;
const SPACE_PROXY_URL = "https://panel.spaceproxy.net/api/new-order-amount/?api_key";

const router = express.Router();

router.post("/", authenticateToken, async(req, res) => {
    // const { period, country, type, quantity, ipList } = req.body;
    const { period, country, type, quantity, ipList } = req.body;

    if (!period || !country || !type || !quantity || !ipList ){
        return res.status(400).json({
            error: true,
            success: false,
            message: "Missing required fields",
            statusCode: 400
        });
    };

    try {
        const countries = [
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
          
        const types = ["dedicated", "shared"];
        
        // Validation checks
        if (!countries.includes(country.toLowerCase())) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid country code",
                statusCode: 400
            });
        }

        if (!types.includes(type.toLowerCase())) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid type",
                statusCode: 400
            });
        };

        const quantityInt = parseInt(quantity);
        const periodInt = parseInt(period);
        if (isNaN(quantityInt) || isNaN(periodInt) || quantityInt <= 0 || periodInt <= 0) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "Invalid quantity or period",
                statusCode: 400
            });
        };

        if (!Array.isArray(ipList)) {
            return res.status(400).json({
                error: true,
                success: false,
                message: "IP list must be an empty array",
                statusCode: 400
            });
        }

        const data ={
            "type": type.toLowerCase(),
            "ip_version": 4,
            "country": country.toLowerCase(),
            "quantity": periodInt,
            "period": periodInt,
            "ip_list": ipList
        }

        Object.entries(data).forEach(([key, value]) => console.log(`${key} : ${JSON.stringify(value)}`));

        const response = await axios.post(`${SPACE_PROXY_URL}=${PROXY_API_KEY}`, data, {
            headers:{
                'Content-Type': 'application/json'
            }
        });

        Object.entries(response.data).forEach(([key, value]) => console.log(`${key} : ${JSON.stringify(value)}`));

        // Double the amount
        let amount = response.data.amount;
        amount = amount * 2;

        // Prepare the response data with the doubled amount
        const responseData = {
            error: false,
            success: true,
            message: "Payment request created successfully",
            data: {
                amount: amount,
                data: response.data.data
            },
            statusCode: 200
        };

        Object.entries(responseData).forEach(([key, value]) => console.log(`${key} : ${JSON.stringify(value)}`));

        return res.status(200).json(responseData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: true,
            success: false,
            message: `An error occurred during processing. Error: ${error}`,
            statusCode: 500
        });
    }
});

module.exports = router;
