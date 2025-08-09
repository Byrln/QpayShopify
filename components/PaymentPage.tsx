import React, { useState, useEffect, useCallback } from 'react';
import styles from './PaymentPage.module.css';
import { APIResponse, QPayInvoiceResponse } from '../types/qpay';

interface BankDeepLink {
  name: string;
  description: string;
  logo: string;
  link: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  price: string;
  variant_id: number;
  handle: string;
  image: string;
  quantity: number;
  shop_domain: string;
}

interface PaymentPageProps {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  orderNumber?: string;
  itemCount?: string;
  product?: ShopifyProduct;
  return_url?: string;
  shop_domain?: string;
  onPaymentSuccess?: () => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({
  orderId,
  amount,
  currency = 'MNT',
  description,
  orderNumber = '#1001',
  itemCount = '3 items',
  product,
  return_url,
  shop_domain,
  onPaymentSuccess
}) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [bankLinks, setBankLinks] = useState<BankDeepLink[]>([]);
  const [status, setStatus] = useState<'loading' | 'waiting' | 'success' | 'error'>('loading');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState('Төлбөрийн баталгаажуулалтыг хүлээж байна...');

  // Format amount display
  const formatAmount = useCallback(() => {
    if (!amount || amount === null || amount === undefined) {
      return currency === 'MNT' ? '₮0' : '$0.00';
    }
    return currency === 'MNT' ? `₮${amount.toLocaleString()}` : `$${amount.toFixed(2)}`;
  }, [amount, currency]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setStatus('error');
      setStatusMessage('❌ Төлбөрийн хугацаа дууссан. Дахин оролдоно уу.');
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Format timer display
  const formatTime = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Create invoice
  const createInvoice = useCallback(async () => {
    try {
      setStatus('loading');
      const response = await fetch('/api/qpay/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          description: description || `Order #${orderId}`,
          callback_url: `${typeof window !== 'undefined' ? window.location.origin : 'https://satorimn.vercel.app'}/api/qpay/webhook`
        })
      });

      const result: APIResponse<QPayInvoiceResponse> = await response.json();

      if (result.success && result.data) {
        setInvoiceId(result.data.invoice_id);
        
        // Always generate QR code from qr_text since QPay's qr_image field contains raw text data
        if (result.data.qr_text) {
          // Generate QR code using our server-side QR generator
          fetch(`/api/qr/generate?data=${encodeURIComponent(result.data.qr_text)}`)
            .then(response => response.json())
            .then((qrResult: any) => {
              if (qrResult.success && qrResult.dataUrl) {
                setQrCode(qrResult.dataUrl);
              }
            })
            .catch(error => {
              console.error('QR generation error:', error);
            });
        }
        
        // Set bank links - CSS will handle mobile/tablet visibility
        // Check both qPay_deeplink and urls fields (different QPay API versions)
        const deeplinks = result.data.qPay_deeplink || (result.data as any).urls || [];
        if (deeplinks && deeplinks.length > 0) {
          setBankLinks(deeplinks);
        } else {
          // Comprehensive Mongolian bank data matching the provided interface
          const mockBankLinks = [
            {
              name: "qPay хэтэвч",
              description: "qPay апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/qpay.png",
              link: "qpay://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Хаан банк",
              description: "Хаан банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/khanbank.png",
              link: "khanbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Төрийн банк 3.0",
              description: "Төрийн банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/statebank.png",
              link: "statebank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Хас банк",
              description: "Хас банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/xacbank.png",
              link: "xacbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "TDB online",
              description: "TDB банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/tdb.png",
              link: "tdbbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Голомт банк",
              description: "Голомт банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/golomt.png",
              link: "golomtbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "МОСТ мони",
              description: "МОСТ мони апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/most.png",
              link: "mostmoney://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Ундасний хөрөнгө оруулалтын банк",
              description: "УХО банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/uib.png",
              link: "uibbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Чингис Хаан банк",
              description: "Чингис Хаан банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/chinggis.png",
              link: "chinggisbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Капитрон банк",
              description: "Капитрон банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/capitron.png",
              link: "capitronbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Богд банк",
              description: "Богд банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/bogd.png",
              link: "bogdbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Тээвэр хөгжлийн банк",
              description: "ТХБ апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/tdb.png",
              link: "tkhbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "M банк",
              description: "M банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/mbank.png",
              link: "mbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Ард Апп",
              description: "Ард банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/ard.png",
              link: "ardbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Toki App",
              description: "Toki апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/toki.png",
              link: "toki://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Ариг банк",
              description: "Ариг банкны апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/arig.png",
              link: "arigbank://qpay?invoice_id=" + result.data.invoice_id
            },
            {
              name: "Мон Пэй",
              description: "Мон Пэй апп-аар төлөх",
              logo: "https://cdn.qpay.mn/logos/monpay.png",
              link: "monpay://qpay?invoice_id=" + result.data.invoice_id
            }
          ];
          setBankLinks(mockBankLinks);
        }
        
        setStatus('waiting');
        setStatusMessage('Төлбөрийн баталгаажуулалтыг хүлээж байна...');
        
        // Start checking payment status
        checkPaymentStatus();
      } else {
        throw new Error(result.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      setStatus('error');
      setStatusMessage(`❌ Төлбөр үүсгэхэд алдаа гарлаа: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [orderId, amount, currency, orderNumber]);

  // Check payment status
  const checkPaymentStatus = useCallback(async () => {
    if (!invoiceId) return;

    try {
      const response = await fetch(`/api/qpay/invoice/${invoiceId}`);
      const result: APIResponse<{ status: string }> = await response.json();

      if (result.success && result.data && result.data.status === 'PAID') {
        setStatus('success');
        setStatusMessage('✅ Төлбөр амжилттай! Баталгаажуулах хуудас руу шилжүүлж байна...');
        
        // Handle success redirection
        setTimeout(() => {
          if (onPaymentSuccess) {
            onPaymentSuccess();
          } else if (product && shop_domain && return_url) {
            // Redirect back to Shopify
            window.location.href = return_url;
          } else {
            // Redirect to thank you page
            const thankYouUrl = `/thank-you?orderId=${orderId}&amount=${amount}&currency=${currency}`;
            window.location.href = thankYouUrl;
          }
        }, 2000);
        return;
      }
    } catch (error) {
      console.error('Status check error:', error);
    }

    // Check again in 3 seconds if payment not completed
    if (timeLeft > 0 && status === 'waiting') {
      setTimeout(checkPaymentStatus, 3000);
    }
  }, [invoiceId, orderId, amount, timeLeft, status]);

  // Initialize payment process
  useEffect(() => {
    createInvoice();
  }, [createInvoice]);

  // Bank button click handler
  const handleBankClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Fallback image handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTIgMjBIMzZWMzJIMTJWMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTYgMTZIMzJWMjBIMTZWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  };

  return (
    <div className={styles.paymentApp}>
      
      <div className={styles.paymentContainer}>
        <div className={styles.qpayLogo}>QPay</div>
        
        <div className={styles.content}>
          <div className={styles.paymentInfo}>
            {product ? (
              <div className={styles.orderItem}>
                <div className={styles.productImage}>
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    onError={handleImageError}
                  />
                </div>
                <div className={styles.orderDetails}>
                  <div className={styles.orderTitle}>{product.title}</div>
                  <div className={styles.orderSubtitle}>Тоо ширхэг: {product.quantity}</div>
                </div>
                <div className={styles.amount}>{formatAmount()}</div>
              </div>
            ) : (
              <div className={styles.orderItem}>
                <div className={styles.orderIcon}>₮</div>
                <div className={styles.orderDetails}>
                  <div className={styles.orderTitle}>Төлөх дүн</div>
                  <div className={styles.orderSubtitle}>{description || `Order #${orderId}`}</div>
                </div>
                <div className={styles.amount}>{formatAmount()}</div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.qrContainer}>
          <div className={styles.qrCode}>
            {status === 'loading' ? (
              <>
                <div className={styles.loading}></div>
                QR код үүсгэж байна...
              </>
            ) : qrCode ? (
              <img 
                src={qrCode} 
                alt="QPay QR Code" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : (
              <div>QR код алдаа</div>
            )}
          </div>
          <div className={styles.qrNote}>QPay-ээр төлбөр хийхэд 100₮ -ийн шимтгэлтэйг анхаараарай.</div>
          <button className={styles.paymentButton} onClick={checkPaymentStatus}>
            Төлбөр шалгах
          </button>
        </div>

        {bankLinks.length > 0 && (
          <div className={styles.bankSection}>
            <div className={styles.bankHeader}>
              <h3>Банкны апп-аар төлөх</h3>
              <p>Доорх банкны аппликейшнээр шууд төлөх боломжтой</p>
            </div>
            <div className={styles.bankGrid}>
              {bankLinks.map((bank, index) => (
                <button
                  key={index}
                  className={styles.bankButton}
                  onClick={() => handleBankClick(bank.link)}
                >
                  <div className={styles.bankIcon}>
                    <img
                       src={bank.logo || `https://qpay.mn/q/logo/${bank.name.toLowerCase().replace(/\s+/g, '')}.png`}
                       alt={bank.name}
                       onError={handleImageError}
                     />
                  </div>
                  <span className={styles.bankName}>{bank.description || bank.name}</span>
                  <div className={styles.bankArrow}>›</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`${styles.status} ${styles[status]}`}>
          {status === 'loading' || status === 'waiting' ? (
            <div className={styles.loading}></div>
          ) : null}
          {statusMessage}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;