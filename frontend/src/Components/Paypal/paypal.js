import React, { useState } from 'react';
import './paypal.module.css';

const PayPal = ({ amount, onPaymentSuccess, onPaymentCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      onPaymentSuccess('Cash Payment');
    } else {
      // Simple validation
      if (cardNumber && expiryDate && cvv) {
        onPaymentSuccess('Credit/Debit Card Payment');
      } else {
        alert('Please fill in all card details.');
      }
    }
  };

  return (
    <div className="paypal-container">
      <h3>Pay {amount}</h3>
      <div className="payment-methods">
        <button
          className={paymentMethod === 'cash' ? 'active' : ''}
          onClick={() => setPaymentMethod('cash')}
        >
          Cash
        </button>
        <button
          className={paymentMethod === 'card' ? 'active' : ''}
          onClick={() => setPaymentMethod('card')}
        >
          Credit/Debit Card
        </button>
      </div>
      {paymentMethod === 'card' && (
        <div className="card-details">
          <input
            type="text"
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
          <input
            type="text"
            placeholder="Expiry Date (MM/YY)"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <input
            type="text"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
          />
        </div>
      )}
      <button className="pay-now-btn" onClick={handlePayment}>
        Pay Now
      </button>
      <button className="cancel-btn" onClick={onPaymentCancel}>
        Cancel
      </button>
    </div>
  );
};

export default PayPal;