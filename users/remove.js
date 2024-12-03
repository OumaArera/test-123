const express = require('express');
const authenticateToken = require('../authenticate/authenticateToken'); 
const { User } = require('../models'); // Adjust the path to where your User model is defined

const router = express.Router();

// Remove all users endpoint
router.delete('/', authenticateToken, async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.findAll();

    // Iterate through the users and delete each one
    for (const user of users) {
      await user.destroy();
    }

    // Return success response
    return res.status(200).json({
      message: 'All users have been removed successfully',
      success: true,
      error: false,
      statusCode: 200,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
      success: false,
      error: true,
      statusCode: 500,
    });
  }
});

module.exports = router;