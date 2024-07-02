import React, { useState } from 'react';
import Axios from 'axios';

const FreelancerStatusToggle = ({ freelancerId, currentStatus }) => {
  const [status, setStatus] = useState(currentStatus);

  const toggleStatus = async () => {
    const newStatus = status === 'online' ? 'offline' : 'online';
    setStatus(newStatus);
    try {
      await Axios.post('/freelancerStatus/updateStatus', { freelancerId, status: newStatus });
      console.log('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <button onClick={toggleStatus}>
      {status === 'online' ? 'Go Offline' : 'Go Online'}
    </button>
  );
};

export default FreelancerStatusToggle;
