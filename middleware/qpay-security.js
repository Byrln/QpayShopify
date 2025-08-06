// QPay Security Middleware
// Token-based authentication for QPay webhook requests

const crypto = require('crypto');

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * Log request information for monitoring
 */
function logQPayRequest(req, res, next) {
  const clientIP = getClientIP(req);
  
  console.log(`🔍 QPay webhook request from IP: ${clientIP}`);
  console.log(`📝 Request method: ${req.method}`);
  console.log(`📝 Request path: ${req.path}`);
  
  next();
}

/**
 * Enhanced webhook signature verification
 */
function verifyQPaySignature(req, res, next) {
  // Skip signature verification if no secret is configured
  if (!process.env.QPAY_WEBHOOK_SECRET) {
    console.log('⚠️ No QPAY_WEBHOOK_SECRET configured, skipping signature verification');
    return next();
  }

  const signature = req.headers['x-qpay-signature'] ||
    req.headers['signature'] ||
    req.headers['x-signature'];

  if (!signature) {
    console.error('❌ Missing QPay webhook signature');
    return res.status(401).json({
      success: false,
      error: 'Missing webhook signature'
    });
  }

  try {
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', process.env.QPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha256=', ''), 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isValid) {
      console.error('❌ Invalid QPay webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    console.log('✅ QPay webhook signature verified');
    next();
  } catch (error) {
    console.error('❌ Error verifying QPay webhook signature:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Signature verification failed'
    });
  }
}

/**
 * Rate limiting for QPay webhooks
 */
const webhookAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 10; // Max 10 webhook attempts per minute per IP

function rateLimitQPayWebhooks(req, res, next) {
  const clientIP = getClientIP(req);
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Clean old entries
  for (const [ip, attempts] of webhookAttempts.entries()) {
    webhookAttempts.set(ip, attempts.filter(time => time > windowStart));
    if (webhookAttempts.get(ip).length === 0) {
      webhookAttempts.delete(ip);
    }
  }

  // Check current IP attempts
  const ipAttempts = webhookAttempts.get(clientIP) || [];

  if (ipAttempts.length >= MAX_ATTEMPTS) {
    console.error(`❌ Rate limit exceeded for QPay webhook from IP: ${clientIP}`);
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  // Record this attempt
  ipAttempts.push(now);
  webhookAttempts.set(clientIP, ipAttempts);

  next();
}

/**
 * Combined QPay security middleware (token-based authentication only)
 */
function qpaySecurityMiddleware(req, res, next) {
  // Apply security checks in sequence (no IP validation)
  logQPayRequest(req, res, (err) => {
    if (err) return next(err);
    
    rateLimitQPayWebhooks(req, res, (err) => {
      if (err) return next(err);
      
      verifyQPaySignature(req, res, next);
    });
  });
}

module.exports = {
  logQPayRequest,
  verifyQPaySignature,
  rateLimitQPayWebhooks,
  qpaySecurityMiddleware,
  getClientIP
};