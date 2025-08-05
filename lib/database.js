const { PrismaClient } = require('@prisma/client');

class DatabaseClient {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
    });
  }

  /**
   * Connect to database
   */
  async connect() {
    try {
      await this.prisma.$connect();
      console.log('Connected to Neon PostgreSQL database');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }

  /**
   * Create order payment record
   */
  async createOrderPayment(data) {
    try {
      const orderPayment = await this.prisma.orderPayment.create({
        data: {
          shopifyOrderId: data.shopifyOrderId,
          orderNumber: data.orderNumber,
          qpayInvoiceId: data.qpayInvoiceId,
          amount: data.amount,
          currency: data.currency || 'MNT',
          status: 'pending',
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          qrText: data.qrText,
          qrImage: data.qrImage,
          createdAt: new Date()
        }
      });
      
      return { success: true, data: orderPayment };
    } catch (error) {
      console.error('Failed to create order payment record:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(qpayInvoiceId, status, transactionData = {}) {
    try {
      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (status === 'paid') {
        updateData.paidAt = new Date();
        updateData.transactionId = transactionData.transactionId;
        updateData.paidAmount = transactionData.amount;
      }

      const orderPayment = await this.prisma.orderPayment.update({
        where: { qpayInvoiceId },
        data: updateData
      });
      
      return { success: true, data: orderPayment };
    } catch (error) {
      console.error('Failed to update payment status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order payment by QPay invoice ID
   */
  async getOrderPaymentByInvoiceId(qpayInvoiceId) {
    try {
      const orderPayment = await this.prisma.orderPayment.findUnique({
        where: { qpayInvoiceId }
      });
      
      return { success: true, data: orderPayment };
    } catch (error) {
      console.error('Failed to get order payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get order payment by Shopify order ID
   */
  async getOrderPaymentByShopifyId(shopifyOrderId) {
    try {
      const orderPayment = await this.prisma.orderPayment.findFirst({
        where: { shopifyOrderId }
      });
      
      return { success: true, data: orderPayment };
    } catch (error) {
      console.error('Failed to get order payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending payments
   */
  async getPendingPayments() {
    try {
      const pendingPayments = await this.prisma.orderPayment.findMany({
        where: {
          status: 'pending',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return { success: true, data: pendingPayments };
    } catch (error) {
      console.error('Failed to get pending payments:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log webhook event
   */
  async logWebhookEvent(data) {
    try {
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          source: 'qpay',
          eventType: data.eventType,
          payload: JSON.stringify(data.payload),
          processed: data.processed || false,
          createdAt: new Date()
        }
      });
      
      return { success: true, data: webhookLog };
    } catch (error) {
      console.error('Failed to log webhook event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { success: true, message: 'Database connection healthy' };
    } catch (error) {
      console.error('Database health check failed:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DatabaseClient;