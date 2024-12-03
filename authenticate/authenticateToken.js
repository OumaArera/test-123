const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: true,
      message: 'Access denied. No token provided.',
      statusCode: 401
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: true,
      message: 'Access denied, please login.',
      statusCode: 403
    });
  }
};

module.exports = authenticateToken;
