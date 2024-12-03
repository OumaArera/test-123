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

const validatePassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()?/.>,<\\|[\]{}=+\-_`])[A-Za-z\d!@#$%^&*()?/.>,<\\|[\]{}=+\-_`]{6,}$/;
  return re.test(String(password));
};

router.post('/', async (req, res) => {
  const { username, password, referredBy } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data. Missing required fields',
      statusCode: 400
    });
  };

  try {

    if (!username || !validateEmail(username)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        statusCode: 400
      });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long and contain uppercase, lowercase, number, and special character',
        statusCode: 400
      });
    }

    if (referredBy) {
      if (!validateEmail(referredBy)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referredBy email format',
          statusCode: 400
        });
      }

      const referee = await db.User.findOne({ where: { username: referredBy } });
      if (!referee) {
        return res.status(400).json({
          success: false,
          message: 'Referee not found',
          statusCode: 400
        });
      }
    }

    // Step 1: Retrieve the SALTING_KEY from environment variables
    const saltKey = process.env.SALTING_KEY;
    if (!saltKey) {
      throw new Error('Salting key not found');
    }

    console.log("Raw password; ", password);
    // Step 2: Concatenate the raw password with the SALTING_KEY
    const saltedPassword = password + saltKey;


    // Step 3: Hash the salted password
    const hashedPassword = await bcrypt.hash(saltedPassword, 10);
    console.log("Hashed password: ", hashedPassword);

    // Step 4: Store the hashed password in the database
    const user = await db.User.create({ username, password: hashedPassword, referredBy });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET_KEY, {
      expiresIn: '1d',
    });

    return res.status(201).json({
      accessToken: token,
      success: true,
      statusCode: 201
    });
  } catch (error) {
    console.error('Error processing signup:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
        statusCode: 409
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
