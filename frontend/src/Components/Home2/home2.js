import React, { useState } from 'react';
import Axios from 'axios';

const ClientComponent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [freelancers, setFreelancers] = useState([]);

  const handleSearch = () => {
    // Fetch freelancers based on search query
    Axios.get(`http://localhost:3001/workers?type=${searchQuery}`)
      .then(response => {
        setFreelancers(response.data);
      })
      .catch(error => {
        console.error('Error fetching freelancers:', error);
      });
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search for a freelancer (e.g., plumber, electrician)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>

      {/* Display map component */}
      <MapComponent freelancers={freelancers} />
    </div>
  );
};

const MapComponent = ({ freelancers }) => {
  // Use the map library of your choice (e.g., Google Maps, Mapbox)
  // Initialize the map and display markers for each freelancer's location
  // Note: Implementing the map functionality will depend on the chosen map library
  // Display markers for freelancers' locations based on their latitude and longitude

  return (
    <div style={{ height: '400px', width: '100%' }}>
      {/* Map component */}
      {/* Display markers for freelancers' locations */}
    </div>
  );
};

export default ClientComponent;
