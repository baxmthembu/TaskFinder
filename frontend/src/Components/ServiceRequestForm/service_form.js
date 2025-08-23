import React, { useState, useCallback } from 'react';
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
    <div className="service-form-wrapper">
      <header className="service-form-header">
        <div className='request-form-logo'>
          <img src={logo} alt='Company Logo' loading='lazy'/>
        </div>
        <div className='service-form-logout'>
        <Logout className="service-form-logout"/>
        </div>
      </header>
      
      <div className="main-container"> 
        <aside className="form-sidebar">
          <div className="form-group">
            <label>Date</label>
            <div className="radio-group">
              {DATE_OPTIONS.map((option) => (
                <label key={option} className="radio-label">
                  <input
                    type="radio"
                    name="datePreference"
                    value={option}
                    checked={formData.datePreference === option}
                    onChange={handleChange}
                    required
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            {formData.datePreference === 'Choose Dates' && (
              <div className="date-picker-container">
                <label>Select specific date:</label>
                <DatePicker
                  selected={formData.customDate}
                  onChange={handleChange}
                  minDate={new Date()}
                  dateFormat="MMMM d, yyyy"
                  placeholderText="Select a date"
                  className="custom-datepicker-input"
                  isClearable
                  dropdownMode='select'
                  required
                />
              </div>
            )}
          </div>        
          
          <div className="form-group">
            <label>Time of day</label>
            <div className="time-options">
              {TIME_OPTIONS.map((option) => (
                <label key={option} className="radio-label">
                  <input
                    type="radio"
                    name="timePreference"
                    value={option}
                    checked={formData.timePreference === option}
                    onChange={handleChange}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            
            <div className="specific-time">
              <label>or choose a specific time</label>
              <input
                type="time"
                name="specificTime"
                value={formData.specificTime}
                onChange={handleChange}
              />
            </div>
            
            <label className="flexible-option">
              <input
                type="checkbox"
                name="isFlexible"
                checked={formData.isFlexible}
                onChange={handleChange}
              />
              I'm Flexible
            </label>
          </div>
          
          <div className="form-group">
            <label>Price</label>
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
              />
              <div className="price-display">
                <span>R{formData.priceRange}</span>
                <small>The average hourly rate is R56.50/hr</small>
              </div>
            </div>
          </div>
        </aside>
        
        <div className="request-form-main">
          <form onSubmit={handleSubmit}>
            <h1>Task information</h1>
            <div className="form-section">
              <label>Explain in detail about your task</label>
              <textarea 
                id='task' 
                name='task' 
                value={formData.task} 
                onChange={handleChange} 
                placeholder='Tell us more about your task' 
                required 
              />
            </div>
            
            <hr className="form-divider" />
            
            <div className="form-section">
              <label className="section-title">Estimated Duration:</label>
              <div className="duration-options">
                {DURATION_OPTIONS.map((option) => (
                  <label className='radio-label' key={option}>
                    <input
                      type="radio"
                      name="time"
                      value={option}
                      checked={formData.time === option}
                      onChange={handleChange}
                      required
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <button type="submit" className="submit-btn">
                Continue
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestForm;