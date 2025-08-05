const axios = require('axios');

class ShopifyClient {
  constructor() {
    this.shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
    this.baseURL = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  /**
   * Get request headers
   */
  getHeaders() {
    return {
      'X-Shopify-Access-Token': this.accessToken,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/${orderId}.json`,
        { headers: this.getHeaders() }
      );
      
      return {
        success: true,
        order: response.data.order
      };
    } catch (error) {
      console.error('Failed to get Shopify order:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to get order'
      };
    }
  }

  /**
   * Create transaction for order (mark as paid)
   */
  async createTransaction(orderId, transactionData) {
    try {
      const transaction = {
        transaction: {
          kind: 'capture',
          status: 'success',
          amount: transactionData.amount,
          currency: transactionData.currency || 'MNT',
          gateway: 'QPay',
          source_name: 'web',
          receipt: {
            paid_amount: transactionData.amount,
            currency: transactionData.currency || 'MNT'
          },
          test: process.env.NODE_ENV !== 'production'
        }
      };

      const response = await axios.post(
        `${this.baseURL}/orders/${orderId}/transactions.json`,
        transaction,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        transaction: response.data.transaction
      };
    } catch (error) {
      console.error('Failed to create Shopify transaction:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to create transaction'
      };
    }
  }

  /**
   * Update order financial status
   */
  async updateOrderFinancialStatus(orderId, financialStatus = 'paid') {
    try {
      const orderUpdate = {
        order: {
          id: orderId,
          financial_status: financialStatus
        }
      };

      const response = await axios.put(
        `${this.baseURL}/orders/${orderId}.json`,
        orderUpdate,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        order: response.data.order
      };
    } catch (error) {
      console.error('Failed to update order status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to update order'
      };
    }
  }

  /**
   * Add note to order
   */
  async addOrderNote(orderId, note) {
    try {
      const orderUpdate = {
        order: {
          id: orderId,
          note: note
        }
      };

      const response = await axios.put(
        `${this.baseURL}/orders/${orderId}.json`,
        orderUpdate,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        order: response.data.order
      };
    } catch (error) {
      console.error('Failed to add order note:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to add note'
      };
    }
  }

  /**
   * Fulfill order
   */
  async fulfillOrder(orderId, lineItems = []) {
    try {
      const fulfillment = {
        fulfillment: {
          location_id: null,
          tracking_number: null,
          tracking_company: 'QPay',
          notify_customer: true,
          line_items: lineItems.length > 0 ? lineItems : undefined
        }
      };

      const response = await axios.post(
        `${this.baseURL}/orders/${orderId}/fulfillments.json`,
        fulfillment,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        fulfillment: response.data.fulfillment
      };
    } catch (error) {
      console.error('Failed to fulfill order:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to fulfill order'
      };
    }
  }

  /**
   * Get order transactions
   */
  async getOrderTransactions(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/${orderId}/transactions.json`,
        { headers: this.getHeaders() }
      );
      
      return {
        success: true,
        transactions: response.data.transactions
      };
    } catch (error) {
      console.error('Failed to get order transactions:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors || 'Failed to get transactions'
      };
    }
  }

  /**
   * Validate webhook (if using Shopify webhooks)
   */
  validateWebhook(data, hmacHeader) {
    const crypto = require('crypto');
    const calculated_hmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      .update(data, 'utf8')
      .digest('base64');

    return calculated_hmac === hmacHeader;
  }
}

module.exports = ShopifyClient;