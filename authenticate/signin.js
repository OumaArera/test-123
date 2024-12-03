const express = require('express');
const db = require('../models');  
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const router = express.Router();

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

router.post('/', async (req, res) => {
  const { iv, ciphertext } = req.body;
  if (!iv || !ciphertext) {
    return res.status(400).json({
      error: true,
      success: false,
      message: 'Invalid data. Missing required fields',
      statusCode: 400
    });
  }

  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key not found');
    }

    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(key), {
      iv: CryptoJS.enc.Hex.parse(iv),
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
    });

    let decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    decryptedData = decryptedData.replace(/\0+$/, '');

    const userData = JSON.parse(decryptedData);
    const { username, password } = userData;
    console.log("username: ", username);
    console.log("Password: ", password);

    if (!username || !validateEmail(username)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid email format',
        statusCode: 400
      });
    }

    if (!password) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Username or password is incorrect',
        statusCode: 400
      });
    }

    const user = await db.User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'Username or password is incorrect',
        statusCode: 401
      });
    }

    // Step 1: Retrieve the SALTING_KEY from environment variables
    const saltKey = process.env.SALTING_KEY;
    if (!saltKey) {
      throw new Error('Salting key not found');
    }

    // Step 2: Concatenate the raw password with the SALTING_KEY
    const saltedPassword = password + saltKey;

    // Step 3: Compare the salted password with the hashed password
    const isPasswordValid = await bcrypt.compare(saltedPassword, user.password);

    console.log("Password is valid: ", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: true,
        success: false,
        message: 'Username or password is incorrect',
        statusCode: 401
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(200).json({
      accessToken: token,
      success: true,
      error: false,
      statusCode: 200
    });
  } catch (error) {
    console.error('Error signing in user:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
