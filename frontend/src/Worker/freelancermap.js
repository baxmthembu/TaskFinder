import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import io from 'socket.io-client';
import Chat from '../Chat';



const socket = io.connect('http://localhost:3001');


const FreelancerMap = ({ initialLocation }) => {
  const defaultCenter = {lat: -29.7400389, lng: 30.9818962}
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [clientLocation, setClientLocation] = useState(initialLocation);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  useEffect(() => {
    console.log('Initial client location:', initialLocation.id);
    console.log('Data', clientLocation)

    socket.on('receiveLocation', (location) => {
      const newLocation = {
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude),
        name: location.name,
        surname: location.surname
        };
        console.log('Received client location:', newLocation);
        setClientLocation(newLocation);
        setMapCenter(newLocation);
    });
    
        return () => {
          socket.off('receiveLocation');
        };
}, [/*clientLocation*/initialLocation]);

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

  const handleMarkerClick = () => {
    setInfoWindowOpen(true);
  };

  const handleCloseClick = () => {
    setInfoWindowOpen(false);
  };

  const handleMessageClick = () => {
    const clientId = localStorage.getItem('userId');
    const workerId = initialLocation.id;
    const roomId = `room-${clientId}-${workerId}}`;
    socket.emit('join_room', roomId);
    window.location.href = `/chat?roomId=${roomId}&workerId=${workerId}&workerName=${clientLocation.name}`;
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyBn12Rfh5u3y0myZ__u7B2fsl9IvLSzJr0">
      <GoogleMap mapContainerStyle={mapStyles} center={mapCenter} zoom={15} options={mapOptions}>
        {clientLocation && !isNaN(clientLocation.lat) && !isNaN(clientLocation.lng) && (clientLocation.name) && (clientLocation.surname) &&(
          <Marker
            
            position={{lat: clientLocation.lat, lng: clientLocation.lng}}
            title={`${clientLocation.name} ${clientLocation.surname}`}
            icon={"https://img.icons8.com/color/48/null/user-male-circle--v1.png"}
            onClick={handleMarkerClick}
          />
        )}{infoWindowOpen && (
          <InfoWindow
            position={{ lat: clientLocation.lat, lng: clientLocation.lng }}
            onCloseClick={handleCloseClick}
          >
            <div>
              <h3>{`${clientLocation.name} ${clientLocation.surname}`}</h3>
              <div className='buttons'>
              <button className='button' onClick={handleMessageClick }>Message</button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default FreelancerMap;




