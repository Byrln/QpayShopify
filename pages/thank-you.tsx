import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import styles from '../components/PaymentPage.module.css';

interface ThankYouProps {
  orderId: string;
  amount: number;
  currency: string;
}

const ThankYouPage: React.FC<ThankYouProps> = ({ orderId, amount, currency }) => {
  const [countdown, setCountdown] = useState(5);
  const redirectUrl = 'https://satori.mn/checkouts/cn/hWN1an6PbsIWr47udWfiqXGY';

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirect when countdown reaches 0
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectUrl]);

  const handleRedirectNow = () => {
    window.location.href = redirectUrl;
  };

  return (
    <>
      <Head>
        <title>Төлбөр амжилттай - QPay</title>
        <meta name="description" content="Таны төлбөр амжилттай хийгдлээ" />
      </Head>
      
      <div className={styles.container}>
        <div className={styles.paymentCard}>
          {/* Success Icon */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px'
            }}>
              ✓
            </div>
            <h1 style={{ color: '#28a745', marginBottom: '10px' }}>Төлбөр амжилттай!</h1>
            <p style={{ color: '#666', fontSize: '16px' }}>Таны захиалга амжилттай баталгаажлаа</p>
          </div>

          {/* Order Details */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '30px' 
          }}>
            <h3 style={{ marginBottom: '15px', color: '#333' }}>Захиалгын мэдээлэл</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Захиалгын дугаар:</span>
              <strong>{orderId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>Төлбөрийн дүн:</span>
              <strong>{amount.toLocaleString()} {currency}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Төлөв:</span>
              <strong style={{ color: '#28a745' }}>Төлөгдсөн</strong>
            </div>
          </div>

          {/* Countdown and Redirect */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              {countdown} секундын дараа автоматаар шилжих болно...
            </p>
            <button
              onClick={handleRedirectNow}
              style={{
                padding: '12px 30px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Одоо шилжих
            </button>
          </div>

          {/* Contact Information */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <h4 style={{ marginBottom: '10px' }}>Асуудал байвал холбогдоно уу</h4>
            <p style={{ margin: '5px 0' }}>📞 Утас: +976 1234-5678</p>
            <p style={{ margin: '5px 0' }}>📧 И-мэйл: support@satori.mn</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>Ажлын цаг: Даваа-Баасан 09:00-18:00</p>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { orderId, amount, currency = 'MNT' } = query;
  
  // Validate required parameters
  if (!orderId || !amount) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      orderId: orderId as string,
      amount: parseInt(amount as string),
      currency: currency as string,
    },
  };
};

export default ThankYouPage;