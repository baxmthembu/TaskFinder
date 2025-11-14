import { useEffect, useState } from 'react';
import '../WorkerHome/workerhome.css';
import MapComponent from '../Components/MapComponent/testmap';

const FreelancerLocationTracker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [workersData, setWorkersData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        /*const response = await fetch('http://localhost:3001/workers', {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });*/
        const response = await fetch(`${process.env.REACT_APP_API_URL}/workers`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
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
  }, []); // Fetch data on component mount
    

  return (
    <div>
      <input
        type="text"
        placeholder="Search for service"
        value={searchQuery}
        className='search-input'
        onChange={(event) => setSearchQuery(event.target.value)}
      />
      <MapComponent data={workersData} searchQuery={searchQuery} />
    </div>
  );
};


export default FreelancerLocationTracker;
