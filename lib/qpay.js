const axios = require('axios');
const crypto = require('crypto');

class QPayClient {
  constructor(config = {}) {
    this.baseURL = config.apiUrl || process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2';
    this.username = config.username || process.env.QPAY_USERNAME;
    this.password = config.password || process.env.QPAY_PASSWORD;
    this.invoiceCode = config.invoiceCode || process.env.QPAY_INVOICE_CODE;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with QPay API
   */
  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/auth/token`, {
        username: this.username,
        password: this.password
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      return {
        success: true,
        data: {
          access_token: response.data.access_token,
          expires_in: response.data.expires_in
        }
      };
    } catch (error) {
      console.error('QPay authentication failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to authenticate with QPay'
      };
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getAccessToken() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error(authResult.error);
      }
    }
    return this.accessToken;
  }

  /**
   * Create QPay invoice
   */
  async createInvoice(orderData) {
    try {
      const token = await this.getAccessToken();
      
      const invoiceData = {
        invoice_code: this.invoiceCode,
        sender_invoice_no: orderData.orderId,
        invoice_receiver_code: orderData.customerPhone || 'terminal',
        invoice_description: `Shopify Order #${orderData.orderNumber}`,
        sender_branch_code: 'ONLINE',
        amount: parseFloat(orderData.amount),
        callback_url: `${process.env.BASE_URL}/api/webhook`,
        sender_staff_code: 'online',
        enable_expiry: 'false',
        allow_partial: false,
        allow_exceed: false,
        invoice_receiver_data: {
          name: orderData.customerName || 'Customer',
          email: orderData.customerEmail || 'customer@satori.mn',
          phone: orderData.customerPhone || '99999999'
        },
        lines: orderData.lineItems?.map(item => ({
          tax_product_code: '6401',
          line_description: item.title || 'Product',
          line_quantity: (item.quantity || 1).toString(),
          line_unit_price: Math.round((item.price || 0) * 100).toString(),
          note: item.variant_title || ''
        })) || [{
          tax_product_code: '6401',
          line_description: `Order #${orderData.orderNumber}`,
          line_quantity: '1',
          line_unit_price: Math.round(orderData.amount * 100).toString(),
          note: 'Shopify order'
        }]
      };

      const response = await axios.post(
        `${this.baseURL}/invoice`,
        invoiceData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        invoiceId: response.data.invoice_id,
        qrText: response.data.qr_text,
        qrImage: response.data.qr_image,
        urls: response.data.urls,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create QPay invoice:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create invoice'
      };
    }
  }

  /**
   * Check invoice status
   */
  async checkInvoiceStatus(invoiceId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/payment/check`,
        { 
          object_type: 'INVOICE', 
          object_id: invoiceId,
          offset: {
            page_number: 1,
            page_limit: 10
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        status: response.data.payment_status,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to check invoice status:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to check status'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload) {
    return {
      invoiceId: payload.invoice_id,
      status: payload.payment_status,
      amount: payload.payment_amount,
      currency: payload.payment_currency,
      senderInvoiceNo: payload.sender_invoice_no,
      transactionId: payload.payment_id,
      paidAt: payload.paid_date
    };
  }

  /**
   * Check payment status
   */
  async checkPayment(invoiceId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/payment/check`,
        { 
          object_type: 'INVOICE', 
          object_id: invoiceId,
          offset: {
            page_number: 1,
            page_limit: 10
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error checking payment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Generate electronic receipt (E-Barimt) for Mongolian tax compliance
   */
  async generateEBarimt(paymentId, receiverType = 'CITIZEN') {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.post(
        `${this.baseURL}/ebarimt/create`,
        {
          payment_id: paymentId,
          ebarimt_receiver_type: receiverType
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error generating E-Barimt:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Cancel an invoice
   */
  async cancelInvoice(invoiceId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.delete(
        `${this.baseURL}/invoice/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error canceling invoice:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get payment details by payment ID
   */
  async getPaymentDetails(paymentId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(
        `${this.baseURL}/payment/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting payment details:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = QPayClient;