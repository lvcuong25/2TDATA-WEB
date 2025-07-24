import jwt from 'jsonwebtoken';

export const checkIframeAccess = (req, res, next) => {
    try {
        // Lấy token từ header hoặc query parameter
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
        
        if (token) {
            try {
                // Xác thực token nếu có
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
                req.user = decoded;
            } catch (error) {
                // Nếu token không hợp lệ, tiếp tục mà không set user
                console.log('Invalid token for iframe access:', error.message);
            }
        }
        
        // Tiếp tục xử lý request (có thể có hoặc không có user)
        next();
    } catch (error) {
        console.error('Error in checkIframeAccess middleware:', error);
        next();
    }
};
