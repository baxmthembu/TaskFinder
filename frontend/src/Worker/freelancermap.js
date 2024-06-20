import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import styles from '../Components/MapComponent/map.module.css'
import Axios from 'axios';

const FreelancerClientMap = () => {
  const [clientLocations, setClientLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -29.7400389, lng: 30.9818962 });

  useEffect(() => {
    const fetchClientLocations = async () => {
      try {
        const response = await Axios.get('http://localhost:3001/getClientLocations');
        setClientLocations(response.data);
      } catch (error) {
        console.error('Error fetching client locations:', error);
      }
    };

    fetchClientLocations();
  }, []); // Fetch client locations on component mount

  const mapStyles = {
    height: '500px',
    width: '60%',
    position: 'absolute',
    left: '20%',
    top: '20%',
  };

  const mapOptions = {
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  return (
    <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <GoogleMap mapContainerStyle={mapStyles} center={mapCenter} zoom={15} options={mapOptions}>
        {clientLocations.map((client) => (
          <Marker
            key={client.client_id}
            position={{ lat: parseFloat(client.latitude), lng: parseFloat(client.longitude) }}
            title={'Client Location'}
            icon={"https://img.icons8.com/color/48/null/location.png"}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default FreelancerClientMap;


