import  { useState, useEffect} from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import './freelancermap.css';
import socket from "../../socket";


const FreelancerMap = ({ initialLocation, onDecision}) => {
  const defaultCenter = { lat: -29.7400389, lng: 30.9818962 };
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [clientLocation, setClientLocation] = useState(initialLocation);
  const [selectedMarker, setSelectedMarker] = useState(null); // Tracks which marker is clicked
  const [, setWorkersData] = useState([]);
  const [, setCurrentRoom] = useState();

  useEffect(() => {
    socket.on("receiveLocation", (locationData) => {
      const newLocation = {
        lat: parseFloat(locationData.latitude),
        lng: parseFloat(locationData.longitude),
        name: locationData.name,
        surname: locationData.surname,
        id: locationData.id,
        serviceRequest: locationData.serviceRequest,
      };
      console.log(newLocation)
      if (!isNaN(newLocation.lat) && !isNaN(newLocation.lng)) {
        setClientLocation(newLocation);
        setMapCenter(newLocation);
      } else {
        console.error("Invalid coordinates received:", newLocation);
      }
    });

    const fetchData = async () => {
      const id = localStorage.getItem("id"); // or "workerId"

      if (!id) return;
      try {
        /*const response = await fetch(`http://localhost:3001/workers/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });*/
        const response = await fetch(`${process.env.REACT_APP_API_URL}/workers/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data at freelancermap.js");
        }

        const workersJson = await response.json();
        console.log(workersJson)
        setWorkersData(Array.isArray(workersJson) ? workersJson : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    return () => {
      socket.off("receiveLocation");
      socket.off('availability_changed')
    };
  }, [initialLocation]);

  const mapStyles = {
    height: "500px",
    width: "60%",
    position: "absolute",
    left: "25%",
    top: "20%",
  };

  const mapOptions = {
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  const handleMarkerClick = (location) => {
    setSelectedMarker(location); // Set the clicked marker as selected
  };

  const handleCloseClick = () => {
    setSelectedMarker(null); // Deselect the marker
  };

useEffect(() => {
  socket.on("request_to_join", (data) => {
    console.log("Received client data:", data.client);
    const client = {
      lat: parseFloat(data.client.latitude),
      lng: parseFloat(data.client.longitude),
      name: data.client.name,
      surname: data.client.surname,
      id: data.client.id,
    };

    const workerId = localStorage.getItem("id");
    if (!workerId) {
      console.error("No worker ID found in localStorage");
      return;
    }

    const room = [client.id, workerId].sort().join('-');
    console.log(`Created room: ${room} between client ${client.id} and worker ${workerId}`);
    
    setSelectedMarker(client);
    setClientLocation(client);
    setCurrentRoom(room);
    setMapCenter(client);
  });

  return () => {
    socket.off("request_to_join");
  };
}, []);

useEffect(() => {
  /*When the freelancer logs in or lands on the map, they tell the server
  put my socket into a room called freelancer-123 where 123 is my id
  this room is used when clients send location info, so that only that freelancer
  in room freelancer-123 gets the location*/
  //It has nothing to do with the chat room (clientId-workerId) 
  const workerId = localStorage.getItem("id");
  if (workerId) {
    socket.emit("join_freelancer_room", workerId);
  }
}, []);

const handleDecision = (decision) => {
    if (!selectedMarker?.id) {
        console.error("No selected marker or missing ID");
        return;
    }

    const workerId = localStorage.getItem('id');
    const clientId = selectedMarker.id;
    const room = [clientId, workerId].sort().join('-');
    
    if (!workerId) {
        console.error("No worker ID in localStorage");
        return;
    }
    
    console.log("Emitting decision for room:", room);
    if (selectedMarker && selectedMarker.serviceRequest) {
        socket.emit("freelancer_decision", {
            room,
            decision,
            clientId,
            workerId,
        });

        if (decision === 'accepted') {
            console.log("Joining room:", room);
            socket.emit("join_room", { room });
            onDecision(decision, selectedMarker);
        } else {
            setClientLocation(null);
            setSelectedMarker(null);
        }
    } else {
        console.error("No service request found for the selected marker.");
    }
};



  return (
    <LoadScript googleMapsApiKey= {process.env.GOOGLE_API_KEY} >
      <GoogleMap mapContainerStyle={mapStyles} center={mapCenter} zoom={15} options={mapOptions}>
        {clientLocation && !isNaN(clientLocation.lat) && !isNaN(clientLocation.lng) && (
          <Marker
            position={{ lat: clientLocation.lat, lng: clientLocation.lng }}
            title={`${clientLocation.name} ${clientLocation.surname}`}
            icon="https://img.icons8.com/color/48/null/user-male-circle--v1.png"
            onClick={() => handleMarkerClick(clientLocation)} // Pass marker data
          />
        )}
        {selectedMarker && 
          !isNaN(selectedMarker.lat) &&
          !isNaN(selectedMarker.lng) && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={handleCloseClick}
          >
            <div className="info-window-container">
              {console.log('Selected marker with service request:', selectedMarker?.serviceRequest)}
              <h3>{`${selectedMarker.name} ${selectedMarker.surname}`}</h3>
              {selectedMarker?.serviceRequest && (
                <div className="service-request-details">
                  <h4>Service Request Details</h4>
                  <p><strong>Date:</strong> {selectedMarker.serviceRequest.date_preference}{selectedMarker.serviceRequest.custom_date}</p>
                  <p><strong>Time:</strong> {selectedMarker.serviceRequest.time_preference}{selectedMarker.serviceRequest.specific_time} </p>
                  <p><strong>Description:</strong> {selectedMarker.serviceRequest.description}</p>
                  <p><strong>Estimated Duration:</strong> {selectedMarker.serviceRequest.estimated_duration}</p>
                  <p><strong>Price:</strong> R{selectedMarker.serviceRequest.price_per_hour} per hour</p>
                  <p><strong>Flexible:</strong> {selectedMarker.serviceRequest.flexible ? "Yes" : "No"}</p>
                  <p><strong></strong></p>
                  <hr />
                </div>
              )}
              <h3>{`${selectedMarker.name} ${selectedMarker.surname}`}</h3>
              <div className="action-buttons" style={{display:"flex", flexDirection: 'column', margin: "5px", padding: "2px"}}>
                <button className="accept-btn" onClick={() => handleDecision("accepted")}>Accept</button>
                <button className="decline-btn" onClick={() => handleDecision("declined")}>Decline</button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default FreelancerMap;