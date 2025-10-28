import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useMemo, useRef, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import styles from './map.module.css';
import StarRating from '../SearchBar/starrating';
import io from 'socket.io-client';
import { useAuth } from '../../provider/Authprovider';
import ChatWidget from '../../ChatWidget';

const socket = io('http://localhost:3001');

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});


const MapComponent = ({ 
  data = [], 
  searchQuery, 
  clientsData = [], 
  nearbyWorkers, 
  setIsMapLoading,
  activeChats,
  setActiveChats,
  handleFreelancerDecision 
}) => {
  const [filteredData, setFilteredData] = useState([]);
  const [mapCenter, setMapCenter] = useState([-29.7400389, 30.9818962]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [responseStatus, setResponseStatus] = useState({});
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const {user} = useAuth();
  const [workersData, setWorkersData] = useState([]);

  // Component to handle map view changes
  const ChangeView = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center, map.getZoom());
      }
    }, [center]);
    return null;
  };

  // Filter workers data
  const filteredWorkers = useMemo(() => {
    return (data || []).filter((value) => {
      if (!value) return false;
      const match = !searchQuery || 
        (value.occupation && value.occupation.toLowerCase().includes(searchQuery.toLowerCase()));
      const online = value.status === 'online';
      const available = value.isavailable === true;
      return match && online && available;
    });
  }, [data, searchQuery]);

  // Update filtered data and center when nearby workers change
  useEffect(() => {
    setFilteredData(filteredWorkers);
    if (nearbyWorkers?.latitude && nearbyWorkers?.longitude) {
      setMapCenter([parseFloat(nearbyWorkers.latitude), parseFloat(nearbyWorkers.longitude)]);
    }
  }, [filteredWorkers, nearbyWorkers]);

  useEffect(() => {
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
  
    const handler = (availabilityData) => {
      setWorkersData(prev =>
        prev.map(worker =>
          worker.id === availabilityData.freelancerId
          ? { ...worker, isAvailable: availabilityData.isAvailable }
          : worker
        )
      );
    };
  
    socket.on('receiveAvailability', handler);
    return () => socket.off('receiveAvailability', handler);
  }, [workersData]);

  useEffect(() => {
    const handleStatusUpdate = ({ workerId, decision }) => {
      setResponseStatus(prev => ({
        ...prev,
        [workerId]: decision
      }));
    };
  
    socket.on('freelancer_decision', handleStatusUpdate);
    return () => socket.off('freelancer_decision', handleStatusUpdate);
  }, []);

  useEffect(() => {
    const handleFreelancerDecisionEvent = (data) => {
      handleFreelancerDecision(data);
    };
  
    socket.on("freelancer_decision", handleFreelancerDecisionEvent);
    return () => socket.off("freelancer_decision", handleFreelancerDecisionEvent);
  }, [workersData, user.id, user.name, user.surname, handleFreelancerDecision]);

  // Custom marker icons
  const getMarkerIcon = (imgPath) => {
    return L.icon({
      iconUrl: `http://localhost:3001/images/${imgPath}`,
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48]
    });
  };

  const handleSendLocation = useCallback(async (workerId) => {
    const clientId = localStorage.getItem('id');
    const client = clientsData.find(client => client.id === clientId);

    try {
      const response = await Axios.get(`http://localhost:3001/tasks/${clientId}`);
      const taskData = response.data;
      
      if (client && taskData) {
        const room = [clientId, workerId].sort().join('-');
        
        // Emit location data
        const locationPayload = {
          location: {
            latitude: client.latitude,
            longitude: client.longitude,
            name: client.name,
            surname: client.surname,
            id: clientId
          },
          freelancerId: workerId,
          serviceRequest: taskData
        };

        socket.emit('sendLocation', locationPayload);
        setResponseStatus(prev => ({ ...prev, [workerId]: 'pending' }));

        // Create chat connection
        socket.emit("create_chat", {
          clientId,
          freelancerId: workerId,
          clientName: `${client.name} ${client.surname}`,
          freelancerName: `${selectedWorker.name} ${selectedWorker.surname}`
        });

        // Join the room
        socket.emit("join_room", { room });
      }
    } catch(error) {
      console.error('Error:', error);
    }
  }, [clientsData, selectedWorker]);

  const handleMarkerClick = (worker) => {
    setSelectedWorker({
      ...worker,
      name: `${worker.name} ${worker.surname}`
    });
    setMapCenter([parseFloat(worker.latitude), parseFloat(worker.longitude)]);
  };

  const handleMapLoad = () => {
    setIsMapReady(true);
    if (setIsMapLoading) setIsMapLoading(false);
    
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 300);
  };

  return (
    <div className={styles.mapWrapper}>
      {!isMapReady && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading map...</p>
        </div>
      )}
      <LeafletMap
        center={mapCenter}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        whenReady={handleMapLoad}
        ref={mapRef}
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
          minZoom={3}
          detectRetina={true}
          updateWhenIdle={false}
          updateWhenZooming={false}
        />

        {isMapReady && filteredData.map((worker) => (
          worker?.latitude && worker?.longitude && (
            <Marker
              key={worker.id}
              position={[parseFloat(worker.latitude), parseFloat(worker.longitude)]}
              icon={getMarkerIcon(worker.images)}
              eventHandlers={{
                click: () => handleMarkerClick(worker)
              }}
            >
              <Popup>
                <div className={styles.container}>
                  {/* ... popup content remains the same ... */}
                  <div className={styles.card_item}>
                    <div className={styles.card_inner}>
                      <img src={`http://localhost:3001/images/${worker.images}`} alt='avatar' />
                      <div className={styles.userName}>{worker.name} {worker.surname}</div>
                      <div className={styles.userJob}>{worker.occupation}</div>
                      <div className={styles.userStatus}>
                        Status: {worker.status}
                        <span className={`status-button ${worker.status === 'online' ? 'online' : 'offline'}`}></span>
                      </div>
                      <div className={styles.availability}>
                        Availability: {worker.isavailable ? 'Available' : 'Not Available'}
                      </div>
                      {responseStatus[worker.id] === 'declined' && (
                        <div style={{ color: 'red' }}>
                          <span className="status-dot red"></span> Declined
                        </div>
                      )}
                      {responseStatus[worker.id] === 'accepted' && (
                        <div style={{ color: 'green' }}>
                          <span className="status-dot green"></span> Accepted
                        </div>
                      )}
                      {responseStatus[worker.id] === 'pending' && (
                        <div style={{ color: 'gray' }}>Waiting for response...</div>
                      )}
                      <div className={styles.detail_box}>
                        <StarRating />
                      </div>
                      <div className={styles.buttons}>
                        <button 
                          className={styles.button} 
                          /*onClick={() => handleSendLocation(worker.id)}*/
                          onClick={() => {
                            if (worker.isavailable && worker.status === 'online') {
                              handleSendLocation(worker.id);
                            }
                          }}
                          disabled={!worker.isavailable || worker.status !== 'online'}
                        >
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </LeafletMap>
    </div>
  );
};

export default MapComponent;