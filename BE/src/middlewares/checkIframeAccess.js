import jwt from 'jsonwebtoken';
import User from '../model/User.js';

export const checkIframeAccess = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[IFRAME ACCESS] No valid authorization header');
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Use same secret key logic as in auth controller
      const secret = process.env.JWT_SECRET || process.env.SECRET_KEY;
      const payload = jwt.verify(token, secret);
      
      // Wait for user data to be fully loaded
      const user = await User.findById(payload._id)
        .populate('site_id')
        .select('-password')
        .lean(); // Use lean() for better performance
      
      if (!user) {
        console.log('[IFRAME ACCESS] User not found for ID:', payload._id);
        return next();
      }
      
      if (!user.active) {
        console.log('[IFRAME ACCESS] User is not active:', user.email);
        return next();
      }
      
      // Set user in request
      req.user = user;
      console.log('[IFRAME ACCESS] User authenticated:', user.email);
      
    } catch (error) {
      console.log('[IFRAME ACCESS] Token verification failed:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        console.log('[IFRAME ACCESS] Token expired at:', error.expiredAt);
      }
    }
    
    next();
    
  } catch (error) {
    console.error('[IFRAME ACCESS] Unexpected error:', error);
    next();
  }
};