import React, { useState } from 'react';

const PayPal = ({ amount, onPaymentSuccess, onPaymentCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = () => {
    if (paymentMethod === 'cash') {
      onPaymentSuccess('Cash Payment');
    } else {
      if (cardNumber && expiryDate && cvv) {
        onPaymentSuccess('Credit/Debit Card Payment');
      } else {
        alert('Please fill in all card details.');
      }
    }
  };

  const buttonBaseClasses = 'w-full py-3 px-4 rounded-lg border text-sm font-semibold transition-all duration-300';
  const activeClasses = 'bg-blue-600 text-white border-blue-600';
  const inactiveClasses = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100';

  return (
    <div className="p-4 bg-gray-50 rounded-b-lg w-full">
      <p className="text-2xl font-bold text-center text-gray-900 my-4">Pay R{amount}</p>
      <div className="flex justify-center space-x-2 sm:space-x-4 mb-6">
        <button
          className={`${buttonBaseClasses} ${paymentMethod === 'cash' ? activeClasses : inactiveClasses}`}
          onClick={() => setPaymentMethod('cash')}
        >
          Cash
        </button>
        <button
          className={`${buttonBaseClasses} ${paymentMethod === 'card' ? activeClasses : inactiveClasses}`}
          onClick={() => setPaymentMethod('card')}
        >
          Credit/Debit Card
        </button>
      </div>
      {paymentMethod === 'card' && (
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Expiry Date (MM/YY)"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="CVV"
              value={cvv}
              onChange={(e) => setCvv(e.target.value)}
              className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
      <div className="space-y-3">
        <button 
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
          onClick={handlePayment}
        >
          Pay Now
        </button>
        <button
          className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition duration-300"
          onClick={onPaymentCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PayPal;