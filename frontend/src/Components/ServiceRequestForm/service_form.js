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

      const response = await Axios.post(`${process.env.REACT_APP_API_URL}/tasks`, payload);
      
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
  <div className="min-h-screen bg-teal-50 flex flex-col">

    {/* Header */}
    <header className="w-full max-w-screen-xl mx-auto flex items-center justify-between 
      py-4 px-6 border-b border-teal-200 backdrop-blur-md">
      
      {/* Back / Logout button */}
      <div className="flex-shrink-0">
        <Logout />
      </div>

      {/* Logo on right side */}
      <div className="flex-shrink-0 pt-6">
        <img
          src={logo}
          alt="Logo"
          className="w-40 sm:w-52 md:w-64 drop-shadow-md"
        />
      </div>
    </header>

    {/* Page Container */}
    <div className="flex flex-col lg:flex-row flex-1 w-full max-w-screen-xl mx-auto 
      px-4 sm:px-6 lg:px-10 py-6 gap-8 overflow-hidden">

      {/* Sidebar */}
      <aside className="lg:w-1/3 bg-white rounded-xl shadow-md border border-teal-100 
        p-6 space-y-8 w-full">

        {/* Date Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Date</h3>

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
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          {formData.datePreference === "Choose Dates" && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Select specific date:
              </label>

              <DatePicker
                selected={formData.customDate}
                onChange={handleChange}
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select a date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                isClearable
                dropdownMode="select"
                required
              />
            </div>
          )}
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Time of Day</h3>

          <div className="space-y-3">
            {TIME_OPTIONS.map((option) => (
              <label key={option} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="timePreference"
                  value={option}
                  checked={formData.timePreference === option}
                  onChange={handleChange}
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">{option}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <label className="block text-sm font-medium text-gray-600">
              or choose a specific time
            </label>

            <input
              type="time"
              name="specificTime"
              value={formData.specificTime}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
          </div>

          <label className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="isFlexible"
              checked={formData.isFlexible}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-gray-700">I'm Flexible</span>
          </label>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Price</h3>

          <input
            type="range"
            name="priceRange"
            min="50"
            max="5000"
            step="15"
            value={formData.priceRange}
            onChange={handleChange}
            required
            className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between items-center mt-3">
            <span className="text-xl font-bold text-teal-600">R{formData.priceRange}</span>
            <small className="text-xs text-gray-500">Avg. rate: R56.50</small>
          </div>
        </div>
      </aside>

      {/* Main Form Area */}
      <main className="flex-1 bg-white p-8 rounded-xl shadow-md border border-teal-100
        w-full overflow-hidden">

        <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-8">

          {/* Task Description */}
          <div className="flex-grow">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Task Information</h1>

            <label htmlFor="task" className="block text-lg font-semibold text-gray-800 mb-2">
              Explain your task in detail
            </label>

            <textarea
              id="task"
              name="task"
              value={formData.task}
              onChange={handleChange}
              rows={6}
              placeholder='e.g. "I need help mounting a 65-inch TV on a drywall wall."'
              required
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm 
              focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition 
              text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Duration Options */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Estimated Duration</h3>

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

                  <div className="p-4 border border-gray-300 rounded-lg text-center cursor-pointer 
                    peer-checked:border-teal-600 peer-checked:ring-2 peer-checked:ring-teal-500 
                    peer-checked:text-teal-600 transition-all hover:border-gray-400">
                    <span className="font-medium text-gray-800 peer-checked:text-teal-600">
                      {option}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 mt-auto border-t border-gray-200 text-right">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-10 
              rounded-full shadow-md transition-transform transform hover:scale-105"
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