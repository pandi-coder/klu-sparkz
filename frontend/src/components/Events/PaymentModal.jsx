import { useState, useEffect } from 'react';
import { paymentApi } from '../../lib/api';
import { useApp } from '../../context/AppContext';

export default function PaymentModal({ event, onClose, onSuccess }) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order on backend
      const { data } = await paymentApi.createOrder({
        event_id: event.id,
        amount:   event.fee,
      });

      // Open Razorpay checkout
      const options = {
        key:         data.key_id,
        amount:      data.amount,
        currency:    data.currency,
        name:        'KLU Events',
        description: event.title,
        order_id:    data.order_id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyRes = await paymentApi.verify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              event_id:            event.id,
            });

            if (verifyRes.data.success) {
              showToast('Payment successful! Registration confirmed 🎉', 'success');
              onSuccess();
            }
          } catch (err) {
            showToast('Payment verification failed', 'danger');
          }
        },
        prefill: {
          name:  '',
          email: '',
        },
        theme: {
          color: '#dc2a3a',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            showToast('Payment cancelled', 'warning');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoading(false);

    } catch (err) {
      showToast(err.response?.data?.message || 'Payment failed', 'danger');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#121624', border: '1px solid rgba(220,40,60,0.25)',
        borderRadius: 20, padding: 36, maxWidth: 420, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎟️</div>
          <h2 style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: '1.4rem', color: '#ffffff', marginBottom: 8,
          }}>
            Complete Registration
          </h2>
          <p style={{ color: '#8892a4', fontSize: '0.88rem' }}>
            {event.title}
          </p>
        </div>

        {/* Event details */}
        <div style={{
          background: '#1e2640', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
        }}>
          {[
            ['Event',  event.title],
            ['Venue',  event.venue || 'TBD'],
            ['Date',   new Date(event.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })],
            ['Amount', `₹${event.fee}`],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
              paddingBottom: 10,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: '#8892a4', fontSize: '0.85rem' }}>{label}</span>
              <span style={{
                color: label === 'Amount' ? '#ffd700' : '#ffffff',
                fontWeight: label === 'Amount' ? 700 : 500,
                fontSize: '0.9rem',
              }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Pay button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', border: 'none',
            borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg,#dc2a3a,#a01828)',
            color: '#ffffff', fontSize: '1rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading ? 0.7 : 1, marginBottom: 12,
          }}
        >
          {loading ? (
            <span style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', display: 'inline-block',
              animation: 'spin .8s linear infinite',
            }} />
          ) : (
            <>
              <img
                src="https://razorpay.com/favicon.ico"
                alt="Razorpay"
                style={{ width: 20, height: 20, borderRadius: 4 }}
              />
              Pay ₹{event.fee} with Razorpay
            </>
          )}
        </button>

        {/* Cancel button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', border: '1px solid #2d3a5c',
            borderRadius: 12, cursor: 'pointer',
            background: 'transparent', color: '#8892a4',
            fontSize: '0.9rem', fontWeight: 500,
          }}
        >
          Cancel
        </button>

        {/* Security note */}
        <div style={{
          textAlign: 'center', marginTop: 16,
          fontSize: '0.75rem', color: '#4a5578',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          🔒 Secured by Razorpay — 100% safe & encrypted
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}