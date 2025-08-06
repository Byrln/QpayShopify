#!/usr/bin/env node

/**
 * Quick Test Server Startup Script
 * This script starts the QPay integration server for testing with Postman
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

// Import routes and middleware
const qpayRoutes = require('./routes/qpay');
const webhookRoutes = require('./routes/webhook');
const qpaySecurity = require('./middleware/qpay-security');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'https://your-shopify-store.myshopify.com'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware for testing
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'QPay Shopify Integration Server',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            health: 'GET /',
            createInvoice: 'POST /api/invoice/create',
            qpayWebhook: 'POST /api/webhook/qpay',
            shopifyWebhook: 'POST /api/webhook/shopify'
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: PORT,
            qpayConfigured: !!(process.env.QPAY_USERNAME && process.env.QPAY_PASSWORD),
            shopifyConfigured: !!(process.env.SHOPIFY_WEBHOOK_SECRET)
        }
    });
});

// API routes
app.use('/api', qpayRoutes);
app.use('/api/webhook', qpaySecurity, webhookRoutes);

// Test endpoint for Postman
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString(),
        headers: req.headers,
        query: req.query
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 QPay Shopify Integration Server Started!');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('\n📋 Available Endpoints:');
    console.log(`   GET  http://localhost:${PORT}/                     - Health check`);
    console.log(`   GET  http://localhost:${PORT}/api/test             - Test endpoint`);
    console.log(`   POST http://localhost:${PORT}/api/invoice/create   - Create QPay invoice`);
    console.log(`   POST http://localhost:${PORT}/api/webhook/qpay     - QPay webhook`);
    console.log(`   POST http://localhost:${PORT}/api/webhook/shopify  - Shopify webhook`);
    console.log('\n🔧 Configuration Status:');
    console.log(`   QPay Credentials: ${process.env.QPAY_USERNAME && process.env.QPAY_PASSWORD ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Shopify Webhook: ${process.env.SHOPIFY_WEBHOOK_SECRET ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   QPay Webhook Secret: ${process.env.QPAY_WEBHOOK_SECRET ? '✅ Configured' : '❌ Missing'}`);
    console.log('\n📚 Testing with Postman:');
    console.log('   1. Import: QPay-Testing.postman_collection.json');
    console.log('   2. Import: QPay-Testing.postman_environment.json');
    console.log('   3. Update environment variables with your credentials');
    console.log('   4. Run the collection tests');
    console.log('\n📖 For detailed testing guide, see: POSTMAN-TESTING-GUIDE.md');
    console.log('\n🔄 Server ready for testing!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;