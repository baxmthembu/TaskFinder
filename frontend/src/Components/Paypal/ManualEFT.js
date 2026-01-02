import  { useState } from 'react';

const ManualEFT = ({ amount, onPaymentSuccess, onPaymentCancel }) => {
  const [reference, setReference] = useState('');

  const handleConfirmPayment = () => {
    if (reference.trim() === '') {
      alert('Please enter the payment reference number.');
      return;
    }
    // In a real app, you would verify this reference with your bank API or admin panel
    onPaymentSuccess(`Manual EFT - Ref: ${reference}`);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-b-lg w-full">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bank Transfer Details</h3>
        <p className="text-sm text-gray-600 mb-4">Please make an EFT to the following account:</p>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Bank:</span>
            <span className="font-medium text-gray-900">Capitec Business</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Account Number:</span>
            <span className="font-medium text-gray-900">1054722480</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount:</span>
            <span className="font-bold text-green-600">R{amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reference:</span>
            <span className="font-medium text-blue-600">TASK-{Math.floor(Math.random() * 10000)}</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          * Use the reference above so we can track your payment.
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Enter Payment Reference
        </label>
        <input
          type="text"
          placeholder="e.g. TASK-1234"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3">
        <button 
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
          onClick={handleConfirmPayment}
        >
          I Have Made the Payment
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

export default ManualEFT;