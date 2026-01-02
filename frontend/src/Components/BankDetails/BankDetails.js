import { useState, useEffect } from 'react';
import { TrashIcon, CheckCircleIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const BankDetails = ({ onBack }) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    security_code: '',
    valid_thru: '',
    account_type: 'Savings'
  });

  const banks = [
    'Capitec Bank',
    'FNB',
    'Standard Bank',
    'Absa',
    'Nedbank',
    'TymeBank',
    'Discovery Bank',
    'Investec'
  ];

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/freelancer/bank-details`, {
        // Token is handled via cookies automatically with credentials: 'include'
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      } else {
        throw new Error('Failed to fetch bank details');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load bank details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Confirmation before replacing active account
    if (bankAccounts.length > 0 && !window.confirm("Adding a new bank account will replace your current active payout account. Continue?")) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/freelancer/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        await fetchBankDetails();
        setShowForm(false);
        setFormData({
          bank_name: '',
          account_holder_name: '',
          account_number: '',
          security_code: '',
          valid_thru: '',
          account_type: 'Savings'
        });
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add bank account');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/freelancer/bank-details/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        fetchBankDetails();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete bank account');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm("Set this as your active payout account?")) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/freelancer/bank-details/${id}/activate`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (response.ok) {
        fetchBankDetails();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to activate account');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }
  };

  if (loading && bankAccounts.length === 0) return <div className="p-4 text-center">Loading bank details...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="mr-3 lg:hidden p-1 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-gray-800">Bank Details</h2>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Bank Account
          </button>
        )}
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {showForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Add New Bank Account</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                <select
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                >
                  <option value="">Select Bank</option>
                  {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Type</label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                >
                  <option value="Savings">Savings</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Business">Business</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                <input
                  type="text"
                  name="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  name="account_number"
                  value={formData.account_number}
                  onChange={handleInputChange}
                  required
                  pattern="\d+"
                  title="Please enter numbers only"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Security Code</label>
                <input
                  type="text"
                  name="security_code"
                  value={formData.security_code}
                  onChange={handleInputChange}
                  required
                  maxLength="3"
                  pattern="\d{3}"
                  title="Please enter a 3-digit security code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valid Thru (MM/YY)</label>
                <input
                  type="text"
                  name="valid_thru"
                  value={formData.valid_thru}
                  onChange={handleInputChange}
                  required
                  placeholder="MM/YY"
                  pattern="\d{2}/\d{2}"
                  title="Please enter date in MM/YY format"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {bankAccounts.length === 0 && !showForm ? (
          <p className="text-gray-500 text-center py-8">No bank accounts added yet.</p>
        ) : (
          bankAccounts.map((account) => (
            <div 
              key={account.id} 
              className={`border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center ${account.is_active ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
            >
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="font-bold text-lg text-gray-800 mr-3">{account.bank_name}</h3>
                  {account.is_active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" /> Active
                    </span>
                  )}
                  {!account.is_active && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Holder:</span> {account.account_holder_name}</p>
                  <p><span className="font-medium">Account:</span> {account.account_number}</p>
                  <p><span className="font-medium">Type:</span> {account.account_type}</p>
                  <p><span className="font-medium">Security Code:</span> {account.security_code}</p>
                  <p><span className="font-medium">Valid Thru:</span> {account.valid_thru}</p>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 md:mt-0">
                {!account.is_active && (
                  <>
                    <button
                      onClick={() => handleActivate(account.id)}
                      className="px-3 py-1 text-sm text-teal-600 hover:bg-teal-50 rounded border border-teal-200"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Account"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                {account.is_active && (
                  <div className="text-xs text-gray-500 italic px-2">
                    Primary Payout Account
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BankDetails;