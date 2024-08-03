import io from 'socket.io-client';
import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import Chat from '../Chat';



const socket = io.connect('http://localhost:3001');


const FreelancerMap = ({ initialLocation, data }) => {
  const defaultCenter = {lat: -29.7400389, lng: 30.9818962}
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [clientLocation, setClientLocation] = useState(initialLocation);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [workersData, setWorkersData] = useState([]);
  const [currentRoom, setCurrentRoom] = useState()

  const navigate = useNavigate();

  useEffect(() => {
    console.log('Initial client location:', initialLocation.id);
    console.log('Data', clientLocation)

    socket.on('receiveLocation', (location) => {
      const newLocation = {
        lat: parseFloat(location.latitude),
        lng: parseFloat(location.longitude),
        name: location.name,
        surname: location.surname,
        id: location.id
        };
        console.log('Received client location:', newLocation);
        if(!isNaN(newLocation.lat) && !isNaN(newLocation.lng)){
        setClientLocation(newLocation);
        setMapCenter(newLocation);
        }else {
          console.error('Invalid coordinates received:', newLocation);
        }
    });

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3001/workers', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const workersJson = await response.json();
        setWorkersData(workersJson);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    
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
    const workerId = localStorage.getItem('workerId');
    //const worker = workersData.find(worker => worker.id === workerId);
    //const workerId = initialLocation.id;
    if(workerId && clientLocation.id) {
    const room /*roomId*/ = `room-${clientLocation.id}-${workerId}`;
    setCurrentRoom(room)
    socket.emit('join_room', room/*roomId*/);
    //window.location.href = `/chat?roomId=${room/*roomId*/}&workerId=${workerId}&workerName=${worker.name}`;
    navigate('/chat', { state: { room } });
  }else{
    console.error('Client ID or client location ID is undefined');
  }
}

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




