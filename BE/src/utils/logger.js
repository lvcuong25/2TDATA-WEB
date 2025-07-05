import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  audit: 5,
  security: 6
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  audit: 'cyan',
  security: 'brightRed'
};

winston.addColors(logColors);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      logEntry += ` | ${JSON.stringify(meta)}`;
    }
    return logEntry;
  })
);

// Create the logger
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'multi-tenant-app' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      )
    }),
    
    // General application logs
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Security and audit logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'security',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    
    // Audit logs
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'audit',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  ],
  
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

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
