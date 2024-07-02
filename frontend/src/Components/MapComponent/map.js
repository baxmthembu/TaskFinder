import React, {useState, useEffect} from 'react';
import { GoogleMap, LoadScript, Marker, useGoogleMap, InfoWindow } from '@react-google-maps/api';
import styles from '../MapComponent/map.module.css';
import Axios from 'axios'


const MapContainer = ({ data, searchQuery, userLocation, nearbyWorkers }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: -29.7400389, lng: 30.9818962 });
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);


  const mapStyles = {
    height: '500px',
    width: '60%',
    position: 'absolute',
    left: '20%',
    top: '20%',
  };

  const defaultCenter = {
    lat: -29.7400389,
    lng: 30.9818962
  };


  const mapOptions = {
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };


  useEffect(() => {
    setFilteredData(
      //filter methode used to iterate over each element
      //the call back function (value) => {} than takes each element (value) of an array and evaluate a condition
      data.filter((value) => {
      //this checks whether the searchQuery is an empty string or consists of whitespace characters after trimming
      //if either condition is true it means there is no specific search query and the function returns true
        if (searchQuery === '' || searchQuery.trim() === '') {
          return value.status === 'online'
        }
        //this checks if the typed in value includes any lowecase version the data stored in my array
          return value.occupation.toLowerCase().includes(searchQuery.toLowerCase()) && value.status === 'online';
      })
    )

    if (nearbyWorkers) {
      //when the location of the user is fetched the map will center on that location
      setMapCenter({ lat: nearbyWorkers.latitude, lng: nearbyWorkers.longitude });
    } else {
      // Set default center or any logic you prefer
      setMapCenter({ lat: -29.7400389, lng: 30.9818962 });
    }
  }, [data, searchQuery, nearbyWorkers,]); 
  

  const logo1 = require("../Images/logo.png")
  

  return (
    <>
    <div className={styles.app}>
    <div className={styles.logo}>
      <img src= {logo1} />
    </div>
    <LoadScript googleMapsApiKey="AIzaSyBn12Rfh5u3y0myZ__u7B2fsl9IvLSzJr0">
      <GoogleMap mapContainerStyle={mapStyles} center={mapCenter} zoom={15} options={mapOptions}>
        {/*If search field is empty remove marker or else display it in the user location*/}
        {searchQuery !== '' && filteredData.map((value) => (
          <Marker
          key={value.id}
          position={{ lat: parseFloat(value.latitude), lng: parseFloat(value.longitude) }}
          title={value.name + ' ' + value.surname}
          icon={"https://img.icons8.com/color/48/null/user-male-circle--v1.png"}
          onClick={async () => {
            setSelectedWorker(value);
            setInfoWindowOpen(true);
          }}
        />
                ))}
      </GoogleMap>
    </LoadScript>
    </div>
    </>
   )
}

export default MapContainer;
