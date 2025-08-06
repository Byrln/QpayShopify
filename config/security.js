// Security Configuration for QPay Shopify Integration

module.exports = {
  // QPay Security Settings
  qpay: {
    // Official QPay webhook IP addresses
    allowedIPs: [
      '103.87.255.62',  // Primary QPay webhook IP
      '103.87.255.63',  // Secondary QPay webhook IP (if exists)
      '13.228.225.19',  // QPay webhook IP (AWS Singapore)
      '18.142.128.26',  // QPay webhook IP (AWS Singapore)
      '54.254.162.138', // QPay webhook IP (AWS Singapore)
      '127.0.0.1',      // Localhost for testing
      '::1',            // IPv6 localhost
      '::ffff:127.0.0.1' // IPv4-mapped IPv6 localhost
    ],
    
    // Webhook security settings
    webhook: {
      maxAttempts: 10,           // Max webhook attempts per minute per IP
      rateLimitWindow: 60000,    // Rate limit window in milliseconds (1 minute)
      signatureRequired: true,   // Require webhook signature verification
      ipValidationEnabled: true  // Enable IP address validation
    },
    
    // API security settings
    api: {
      timeout: 30000,           // API request timeout in milliseconds
      maxRetries: 3,            // Maximum retry attempts for failed requests
      retryDelay: 1000          // Delay between retries in milliseconds
    }
  },
  
  // Shopify Security Settings
  shopify: {
    webhook: {
      verifySignature: true,    // Verify Shopify webhook signatures
      maxPayloadSize: '10mb'    // Maximum webhook payload size
    }
  },
  
  // General Security Settings
  general: {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://satori.mn', 'https://js5mr0-07.myshopify.com']
        : '*',
      credentials: true
    },
    
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100                   // Limit each IP to 100 requests per windowMs
    },
    
    security: {
      enableHelmet: true,       // Enable helmet security headers
      enableHSTS: true,         // Enable HTTP Strict Transport Security
      enableCSP: true           // Enable Content Security Policy
    }
  },
  
  // Environment-specific overrides
  development: {
    qpay: {
      webhook: {
        ipValidationEnabled: false, // Disable IP validation in development
        signatureRequired: false    // Disable signature verification in development
      }
    }
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableWebhookLogging: true,
    enableSecurityLogging: true,
    logFailedAttempts: true
  }
};

// Helper function to get environment-specific config
function getSecurityConfig() {
  const config = module.exports;
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development' && config.development) {
    // Merge development overrides
    return {
      ...config,
      qpay: {
        ...config.qpay,
        ...config.development.qpay
      }
    };
  }
  
  return config;
}

module.exports.getSecurityConfig = getSecurityConfig;