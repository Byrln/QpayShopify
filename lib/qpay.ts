import { Buffer } from 'buffer';
import type {
  QPayTokenResponse,
  QPayInvoiceRequest,
  QPayInvoiceResponse,
  QPayConfig,
  APIResponse
} from '../types/qpay';

export class QPayService {
  private config: QPayConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: QPayConfig) {
    // Trim whitespace and newlines from config values
    this.config = {
      username: config.username?.trim(),
      password: config.password?.trim(),
      invoice_code: config.invoice_code?.trim(),
      baseUrl: config.baseUrl?.trim(),
    };
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    // QPay uses Basic Auth for token endpoint
    const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

    const response = await fetch(`${this.config.baseUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: '',
    });

    if (!response.ok) {
      throw new Error(`QPay auth failed: ${response.status} ${response.statusText}`);
    }

    const data: QPayTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);

    return this.accessToken;
  }

  async createInvoice(invoiceData: Omit<QPayInvoiceRequest, 'invoice_code'>): Promise<APIResponse<QPayInvoiceResponse>> {
    try {
      const token = await this.getAccessToken();

      const requestData: QPayInvoiceRequest = {
        ...invoiceData,
        invoice_code: this.config.invoice_code,
      };

      const response = await fetch(`${this.config.baseUrl}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      // Log response details for debugging
      console.log('QPay API response status:', response.status);
      console.log('QPay API response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('QPay API raw response:', responseText);

      if (!response.ok) {
        throw new Error(`QPay invoice creation failed: ${response.status} - ${responseText}`);
      }

      // Try to parse JSON with better error handling
      let data: QPayInvoiceResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error(`Invalid JSON response from QPay API: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('QPay createInvoice error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async checkPayment(invoiceId: string): Promise<APIResponse<any>> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(`${this.config.baseUrl}/payment/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          object_type: 'INVOICE',
          object_id: invoiceId,
          offset: {
            page_number: 1,
            page_limit: 100
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`QPay payment check failed: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('QPay checkPayment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Utility method to validate webhook signature if needed
  validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Implement webhook signature validation if QPay provides it
    // For now, return true as a placeholder
    return true;
  }
}