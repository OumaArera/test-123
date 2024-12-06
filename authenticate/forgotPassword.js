const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../models');
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
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: true,
      success: false,
      message: 'Invalid data. Missing required fields',
      statusCode: 400
    });
  }

  try {
    
    if (!username || !validateEmail(username)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Invalid email format',
        statusCode: 400
      });
    }

    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: 'Password must be at least 6 characters long and contain uppercase, lowercase, number, and special character',
        statusCode: 400
      });
    }

    // Step 1: Retrieve the user from the database
    const user = await db.User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({
        error: true,
        success: false,
        message: 'User not found',
        statusCode: 404
      });
    }

    // Step 2: Retrieve the SALTING_KEY from environment variables
    const saltKey = process.env.SALTING_KEY;
    if (!saltKey) {
      throw new Error('Salting key not found');
    }

    // Step 3: Concatenate the raw password with the SALTING_KEY
    const saltedPassword = password + saltKey;

    // Step 4: Hash the salted password
    const hashedPassword = await bcrypt.hash(saltedPassword, 10);

    // Step 5: Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    // Step 6: Return a success message
    return res.status(200).json({
      success: true,
      error: false,
      message: 'Password changed successfully',
      statusCode: 200
    });
  } catch (error) {
    console.error('Error processing password change:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: 'Internal server error',
      statusCode: 500
    });
  }
});

module.exports = router;
