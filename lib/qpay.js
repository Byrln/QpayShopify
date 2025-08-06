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

  /* Authenticate with OAuth 2.0 Basic Authorization */
  async authenticate() {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');

      console.log('QPay Auth Request:', {
        url: `${this.baseURL}/auth/token`,
        timestamp: timestamp,
        client_id: this.username ? 'SET' : 'MISSING',
        client_secret: this.password ? 'SET' : 'MISSING',
        auth_method: 'Basic Authorization'
      });

      const response = await axios.post(`${this.baseURL}/auth/token`, {}, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        console.log('QPay authentication successful:', {
          token_length: response.data.access_token.length,
          expires_in: response.data.expires_in,
          token_type: response.data.token_type || 'Bearer',
          timestamp: timestamp
        });

        return {
          success: true,
          data: {
            access_token: response.data.access_token,
            token_type: response.data.token_type || 'Bearer',
            expires_in: response.data.expires_in,
            refresh_token: response.data.refresh_token,
            timestamp: timestamp
          }
        };
      } else {
        throw new Error('Invalid response format from QPay API');
      }
    } catch (error) {
      console.error('QPay authentication failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${this.baseURL}/auth/token`,
        headers_sent: {
          authorization: 'Basic [REDACTED]',
          content_type: 'application/json'
        }
      });

      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to authenticate with QPay',
        details: {
          status: error.response?.status,
          data: error.response?.data,
          suggestion: 'Verify client_id and client_secret with QPay support. Ensure IP is whitelisted.'
        }
      };
    }
  }

  /* Refresh access token using refresh_token */
  async refreshAccessToken(refreshToken) {
    try {
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');

      console.log('QPay Token Refresh Request:', {
        url: `${this.baseURL}/auth/refresh`,
        has_refresh_token: !!refreshToken
      });

      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refresh_token: refreshToken
      }, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        console.log('QPay token refresh successful:', {
          token_length: response.data.access_token.length,
          expires_in: response.data.expires_in
        });

        return {
          success: true,
          data: {
            access_token: response.data.access_token,
            token_type: response.data.token_type || 'Bearer',
            expires_in: response.data.expires_in,
            refresh_token: response.data.refresh_token
          }
        };
      } else {
        throw new Error('Invalid refresh response format from QPay API');
      }
    } catch (error) {
      console.error('QPay token refresh failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to refresh QPay token'
      };
    }
  }

  /* Get valid access token with automatic refresh */
  async getAccessToken(forceRefresh = false) {
    // Check if token is missing, expired, or force refresh is requested
    if (!this.accessToken || Date.now() >= this.tokenExpiry || forceRefresh) {
      console.log('Token refresh needed:', {
        hasToken: !!this.accessToken,
        isExpired: this.tokenExpiry ? Date.now() >= this.tokenExpiry : 'no_expiry',
        forceRefresh: forceRefresh,
        currentTime: new Date().toISOString()
      });

      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error(`Authentication failed: ${authResult.error}`);
      }
    }
    return this.accessToken;
  }

  /* Make authenticated API request with automatic token refresh */
  async makeAuthenticatedRequest(method, endpoint, data = null, retryCount = 0) {
    const maxRetries = 2;
    
    try {
      const token = await this.getAccessToken(retryCount > 0);
      
      const config = {
        method: method.toUpperCase(),
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      };

      if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
        config.data = data;
      }

      console.log(`Making ${method.toUpperCase()} request to ${endpoint}`);
      const response = await axios(config);
      
      return response;
    } catch (error) {
      // Check if error is due to token expiration (401 Unauthorized)
      if (error.response?.status === 401 && retryCount < maxRetries) {
        console.log(`Token expired (401), retrying request (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Clear current token to force refresh
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Retry the request with fresh token
        return this.makeAuthenticatedRequest(method, endpoint, data, retryCount + 1);
      }
      
      // If not a token issue or max retries reached, throw the error
      throw error;
    }
  }

  /* Create QPay invoice with automatic token refresh */
  async createInvoice(orderData) {
    try {
      const invoiceData = {
        invoice_code: this.invoiceCode,
        sender_invoice_no: orderData.orderId,
        invoice_receiver_code: orderData.customerPhone || 'terminal',
        invoice_description: `Shopify Order #${orderData.orderNumber}`,
        sender_branch_code: 'ONLINE',
        amount: parseFloat(orderData.amount),
        callback_url: `${process.env.BASE_URL}/api/webhook/qpay`,
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

      console.log('Creating QPay invoice:', {
        orderId: orderData.orderId,
        amount: orderData.amount,
        customerName: orderData.customerName
      });

      const response = await this.makeAuthenticatedRequest('POST', '/invoice', invoiceData);

      return {
        success: true,
        invoiceId: response.data.invoice_id,
        qrText: response.data.qr_text,
        qrImage: response.data.qr_image,
        urls: response.data.urls,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to create QPay invoice:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        orderId: orderData.orderId
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create invoice'
      };
    }
  }

  /* Check invoice status with automatic token refresh */
  async checkInvoiceStatus(invoiceId) {
    try {
      const requestData = {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 10
        }
      };

      console.log('Checking QPay invoice status:', { invoiceId });
      const response = await this.makeAuthenticatedRequest('POST', '/payment/check', requestData);

      return {
        success: true,
        status: response.data.payment_status,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to check invoice status:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        invoiceId
      });
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to check status'
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
   * Check payment status with automatic token refresh
   */
  async checkPayment(invoiceId) {
    try {
      const requestData = {
        object_type: 'INVOICE',
        object_id: invoiceId,
        offset: {
          page_number: 1,
          page_limit: 10
        }
      };

      console.log('Checking QPay payment status:', { invoiceId });
      const response = await this.makeAuthenticatedRequest('POST', '/payment/check', requestData);

      return response.data;
    } catch (error) {
      console.error('Error checking payment:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Generate electronic receipt (E-Barimt) for Mongolian tax compliance with automatic token refresh
   */
  async generateEBarimt(paymentId, receiverType = 'CITIZEN') {
    try {
      const requestData = {
        payment_id: paymentId,
        ebarimt_receiver_type: receiverType
      };

      console.log('Generating QPay E-Barimt:', { paymentId, receiverType });
      const response = await this.makeAuthenticatedRequest('POST', '/ebarimt/create', requestData);

      return response.data;
    } catch (error) {
      console.error('Error generating E-Barimt:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        paymentId
      });
      throw error;
    }
  }

  /**
   * Cancel an invoice with automatic token refresh
   */
  async cancelInvoice(invoiceId) {
    try {
      console.log('Canceling QPay invoice:', { invoiceId });
      const response = await this.makeAuthenticatedRequest('DELETE', `/invoice/${invoiceId}`);

      return response.data;
    } catch (error) {
      console.error('Error canceling invoice:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        invoiceId
      });
      throw error;
    }
  }

  /**
   * Get payment details by payment ID with automatic token refresh
   */
  async getPaymentDetails(paymentId) {
    try {
      console.log('Getting QPay payment details:', { paymentId });
      const response = await this.makeAuthenticatedRequest('GET', `/payment/${paymentId}`);

      return response.data;
    } catch (error) {
      console.error('Error getting payment details:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        paymentId
      });
      throw error;
    }
  }
}

module.exports = QPayClient;