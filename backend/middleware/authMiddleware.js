const jwt = require("jsonwebtoken");
const User = require('../models/User');
const {ObjectId} = require('mongodb');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = new ObjectId(decoded.id);    
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Attach the user to the request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      return res.status(500).json({ message: "Server error" });
    }    
  }
};
module.exports = authMiddleware;