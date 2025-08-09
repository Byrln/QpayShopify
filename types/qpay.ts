export interface QPayTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface QPayInvoiceRequest {
  invoice_code: string;
  sender_invoice_no: string;
  invoice_receiver_code: string;
  invoice_description: string;
  amount: number;
  callback_url?: string;
}

export interface QPayDeepLink {
  name: string;
  description: string;
  logo: string;
  link: string;
}

export interface QPayInvoiceResponse {
  invoice_id: string;
  qr_text: string;
  qr_image: string;
  qPay_shortUrl: string;
  qPay_deeplink: QPayDeepLink[];
}

export interface QPayWebhookPayload {
  object_type: string;
  object_id: string;
  invoice_id: string;
  payment_id?: string;
  payment_status: 'PAID' | 'PENDING' | 'CANCELLED';
  amount: number;
  currency: string;
  sender_name?: string;
  process_result_code?: string;
}

export interface QPayConfig {
  username: string;
  password: string;
  invoice_code: string;
  baseUrl: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}