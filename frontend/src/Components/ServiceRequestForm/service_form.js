import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import logo from '../Images/taskaroo.svg'
import './service_form.css';
import Logout from '../../Worker/Logout/logout';

const ServiceRequestForm = () => {
  const initialFormData = {
    task: '',
    time: '0-30min',
    completed: false,
    datePreference: 'Today',
    customDate: null,
    timePreference: 'Morning (8am - 12pm)',
    specificTime: '',
    isFlexible: false,
    priceRange: '56.50'
  };

  const [formData, setFormData] = useState(initialFormData);
  const navigate = useNavigate();

  // Memoized handler for better performance
  const handleChange = useCallback((e) => {
    if (e instanceof Date) {
      setFormData(prev => ({ ...prev, customDate: e }));
      return;
    }

    if (e?.target) {
      const { name, value, type, checked } = e.target;
      
      const updates = {
        [name]: type === 'checkbox' ? checked : value
      };

      // Conditional updates based on field changes
      if (name === 'datePreference' && value !== 'Choose Dates') {
        updates.customDate = null;
      }
      
      if (name === 'specificTime' && value) {
        updates.isFlexible = false;
        updates.timePreference = '';
      }
      
      if (name === 'timePreference' && value) {
        updates.specificTime = '';
        updates.isFlexible = false;
      }
      
      if (name === 'isFlexible' && checked) {
        updates.specificTime = '';
        updates.timePreference = '';
      }

      setFormData(prev => ({ ...prev, ...updates }));
      return;
    }

    console.warn('Unhandled change event:', e);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const id = localStorage.getItem('id');
      const payload = {
        id,
        task: formData.task,
        time: formData.time,
        completed: formData.completed,
        date_preference: formData.datePreference,
        custom_date: formData.customDate ? format(formData.customDate, 'yyyy-MM-dd') : null,
        time_preference: formData.timePreference || formData.specificTime || 'Flexible',
        specific_time: formData.specificTime || null,
        is_flexible: formData.isFlexible,
        price_range: parseFloat(formData.priceRange),
      };

      const response = await Axios.post('http://localhost:3001/tasks', payload);

      if (response.status === 200) {
        navigate('/home');
      }
    } catch (error) {
      console.error('Submission error:', error);
      // Consider adding user feedback here
    }
  };

  // Constants for reusable options
  const DATE_OPTIONS = ['Now', 'Today', 'Within 3 days', 'Choose Dates'];
  const TIME_OPTIONS = [
    'Morning (8am - 12pm)', 
    'Afternoon (12pm - 5pm)', 
    'Evening (5pm - 9:30pm)'
  ];
  const DURATION_OPTIONS = [
    'Small - Est. 0-30min', 
    'Medium - Est. 1-2hours', 
    'Large - Est. 3+ hours'
  ];

  return (
    <div className=/*" max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"*/ "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex items-center justify-between py-4 pb-2 border-b-2 border-slate-300">
        <div className=" logo "> 
            <img src={logo} alt="Logo" className="max-w-[25rem]" />
        </div>
        <div className="back-button">
          <Logout />
        </div>
      </header>
  
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 p-4 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
          {/* Date Preference Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Date</h3>
          <div className="space-y-3">
            {DATE_OPTIONS.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="datePreference"
                  value={option}
                  checked={formData.datePreference === option}
                  onChange={handleChange}
                  required
                  className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">{option}</span>
              </label>
            ))}
            </div>
            {formData.datePreference === 'Choose Dates' && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-sm font-medium text-slate-600 mb-2">Select specific date:</label>
                <DatePicker
                  selected={formData.customDate}
                  onChange={handleChange}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select a date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  isClearable
                  dropdownMode='select'
                  required
                />
              </div>
            )}
          </div>
      
          {/* Time Preference Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Time of day</h3>
            <div className="space-y-3">
              {TIME_OPTIONS.map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="timePreference"
                    value={option}
                    checked={formData.timePreference === option}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{option}</span>
                </label>
              ))}
            </div>
        
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <label className="block text-sm font-medium text-slate-600">or choose a specific time</label>
              <input
                type="time"
                name="specificTime"
                value={formData.specificTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
        
            <label className="mt-4 pt-4 border-t border-slate-200 flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isFlexible"
                checked={formData.isFlexible}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">I'm Flexible</span>
            </label>
          </div>
      
          {/* Price Range Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Price</h3>
            <div className="price-range">
              <input
                type="range"
                name="priceRange"
                min="10"
                max="150"
                step="5"
                value={formData.priceRange}
                onChange={handleChange}
                required
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xl font-bold text-indigo-600">R{formData.priceRange}<span className="text-sm font-medium text-slate-500">/hr</span></span>
                <small className="text-xs text-slate-500">Avg. rate: R56.50/hr</small>
              </div>
            </div>
          </div>
        </aside>
    
        {/* Main Form Content */}
        <main className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80">
          <form onSubmit={handleSubmit} className="space-y-8 h-full flex flex-col">
            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-slate-900 mb-6">Task Information</h1> 
            <div className="form-section">
              <label htmlFor="task" className="block text-lg font-semibold text-slate-800 mb-2">
                Explain in detail about your task
              </label>
              <textarea 
                id='task' 
                name='task' 
                value={formData.task} 
                onChange={handleChange} 
                placeholder='e.g. "I need help mounting a 65-inch TV on a drywall wall. I have the TV and the mount."' 
                required 
                rows={6}
                className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-700 placeholder-slate-400"
              />
            </div>
          
            <hr className="my-8 border-slate-200" />
          
            <div className="form-section">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Estimated Duration:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {DURATION_OPTIONS.map((option) => (
                  <label key={option} className="relative">
                    <input
                      type="radio"
                      name="time"
                      value={option}
                      checked={formData.time === option}
                      onChange={handleChange}
                      required
                      className="sr-only peer"
                    />
                    <div className="p-4 border border-slate-300 rounded-lg text-center cursor-pointer peer-checked:border-indigo-600 peer-checked:ring-2 peer-checked:ring-indigo-500 peer-checked:text-indigo-600 transition-all hover:border-slate-400">
                      <span className="font-medium text-slate-800 peer-checked:text-indigo-600">{option}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8 mt-auto border-t border-slate-200 text-right">
            <button 
              type="submit" 
              className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
              Continue
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
  );
};

export default ServiceRequestForm;