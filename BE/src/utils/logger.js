// Simple logger implementation to avoid dependency issues
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta = {}) => {
  const timestamp = getCurrentTimestamp();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}`;
};

// Simple console-based logger
const logger = {
  info: (message, meta = {}) => {
    console.log(formatMessage('info', message, meta));
  },
  error: (message, meta = {}) => {
    console.error(formatMessage('error', message, meta));
  },
  warn: (message, meta = {}) => {
    console.warn(formatMessage('warn', message, meta));
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', message, meta));
    }
  },
  log: (level, message, meta = {}) => {
    console.log(formatMessage(level, message, meta));
  }
};

// Security logging helper functions
const securityLogger = {
  // Authentication events
  authSuccess: (userId, siteId, ip, userAgent) => {
    logger.log('security', 'Authentication successful', {
      event: 'AUTH_SUCCESS',
      userId,
      siteId,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  authFailure: (email, siteId, ip, userAgent, reason) => {
    logger.log('security', 'Authentication failed', {
      event: 'AUTH_FAILURE',
      email,
      siteId,
      ip,
      userAgent,
      reason,
      timestamp: new Date().toISOString()
    });
  },
  
  // Authorization events
  accessDenied: (userId, resource, action, siteId, ip) => {
    logger.log('security', 'Access denied', {
      event: 'ACCESS_DENIED',
      userId,
      resource,
      action,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Site access events
  siteAccess: (siteId, domain, userId, ip, userAgent) => {
    logger.log('security', 'Site access', {
      event: 'SITE_ACCESS',
      siteId,
      domain,
      userId,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  // Suspicious activity
  suspiciousActivity: (event, details, ip, userAgent) => {
    logger.log('security', 'Suspicious activity detected', {
      event: 'SUSPICIOUS_ACTIVITY',
      activityType: event,
      details,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },
  
  // Data access events
  dataAccess: (userId, resource, action, recordId, siteId, ip) => {
    logger.log('security', 'Data access', {
      event: 'DATA_ACCESS',
      userId,
      resource,
      action,
      recordId,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// Audit logging helper functions
const auditLogger = {
  // Site management events
  siteCreated: (adminId, siteId, siteData, ip) => {
    logger.log('audit', 'Site created', {
      event: 'SITE_CREATED',
      adminId,
      siteId,
      siteData: {
        name: siteData.name,
        domain: siteData.domain,
        status: siteData.status
      },
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  siteUpdated: (adminId, siteId, changes, ip) => {
    logger.log('audit', 'Site updated', {
      event: 'SITE_UPDATED',
      adminId,
      siteId,
      changes,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  siteDeleted: (adminId, siteId, ip) => {
    logger.log('audit', 'Site deleted', {
      event: 'SITE_DELETED',
      adminId,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // User management events
  userCreated: (adminId, userId, userData, siteId, ip) => {
    logger.log('audit', 'User created', {
      event: 'USER_CREATED',
      adminId,
      userId,
      userData: {
        email: userData.email,
        role: userData.role,
        status: userData.status
      },
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  userUpdated: (adminId, userId, changes, siteId, ip) => {
    logger.log('audit', 'User updated', {
      event: 'USER_UPDATED',
      adminId,
      userId,
      changes,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  userDeleted: (adminId, userId, siteId, ip) => {
    logger.log('audit', 'User deleted', {
      event: 'USER_DELETED',
      adminId,
      userId,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Asset management events
  assetUploaded: (userId, siteId, assetType, fileName, fileSize, ip) => {
    logger.log('audit', 'Asset uploaded', {
      event: 'ASSET_UPLOADED',
      userId,
      siteId,
      assetType,
      fileName,
      fileSize,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  assetDeleted: (userId, siteId, assetType, fileName, ip) => {
    logger.log('audit', 'Asset deleted', {
      event: 'ASSET_DELETED',
      userId,
      siteId,
      assetType,
      fileName,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Configuration changes
  configUpdated: (adminId, siteId, configType, changes, ip) => {
    logger.log('audit', 'Configuration updated', {
      event: 'CONFIG_UPDATED',
      adminId,
      siteId,
      configType,
      changes,
      ip,
      timestamp: new Date().toISOString()
    });
  },
  
  // Generic admin action
  adminAction: (adminId, action, resource, details, siteId, ip) => {
    logger.log('audit', 'Admin action performed', {
      event: 'ADMIN_ACTION',
      adminId,
      action,
      resource,
      details,
      siteId,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

export { logger, securityLogger, auditLogger };
export default logger;
