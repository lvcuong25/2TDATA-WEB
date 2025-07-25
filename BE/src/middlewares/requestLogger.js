export const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userEmail = req.user?.email || 'Anonymous';
  const userId = req.user?._id || 'No ID';
  const authHeader = req.headers.authorization ? 'Present' : 'Missing';
  
  console.log(`[REQUEST LOG] ${timestamp} | ${method} ${url} | User: ${userEmail} (${userId}) | Auth Header: ${authHeader}`);
  
  // Log response when it's finished
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[RESPONSE LOG] ${timestamp} | ${method} ${url} | Status: ${res.statusCode}`);
    originalSend.call(res, data);
  };
  
  next();
};
