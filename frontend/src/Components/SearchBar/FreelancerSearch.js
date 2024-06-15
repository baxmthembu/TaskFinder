import React, { useState } from 'react';
import axios from 'axios';
import GoogleMap from './GoogleMap';

const FreelancerSearch = () => {
  const [occupation, setOccupation] = useState('');
  const [freelancerLocations, setFreelancerLocations] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/freelancers?occupation=${occupation}`);
      setFreelancerLocations(response.data);
    } catch (error) {
      console.error('Error fetching freelancer locations:', error);
      // Handle error
    }
  };

  return (
    <div>
      <input
        type="text"
        value={occupation}
        onChange={(e) => setOccupation(e.target.value)}
        placeholder="Enter occupation..."
      />
      <button onClick={handleSearch}>Search</button>

      <GoogleMap locations={freelancerLocations} />
    </div>
  );
};

export default FreelancerSearch;