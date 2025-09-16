import jwt from 'jsonwebtoken';
import User from '../model/User.js';

export const requireAuthWithCookie = async (req, res, next) => {
  let token = null;
  
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  // If no token in header, check cookie
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required - no token found' 
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || process.env.SECRET_KEY);
    
    // Attach the user to the request
    req.user = await User.findById(payload._id).select('-password');

    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication invalid - user not found' 
      });
    }

    if (req.user.active === false) {
      return res.status(403).json({
        success: false,
        message: "User is not active",
        error: "USER_INACTIVE"
      });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

export default requireAuthWithCookie;
