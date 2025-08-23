import { useEffect } from 'react';
import Axios from 'axios';

const UpdateStatusOnClose = () => {
  useEffect(() => {
    const handlePageClose = async (event) => {
      const freelancerId = localStorage.getItem('id');
      const clientId = localStorage.getItem('id');

      if (event.currentTarget.performance.navigation.type === 1) {
      try {
        // Update freelancer status if freelancer is logged in
        if (freelancerId) {
          await Axios.put(`http://localhost:3001/freelancers/${freelancerId}/status`, {
            status: 'offline',
            isavailable: false,
          });
        }

        // Update client status if client is logged in
        if (clientId) {
          await Axios.put(`http://localhost:3001/clients/${clientId}/status`, {
            status: 'offline'
          });
        }
      } catch (error) {
        console.error('Error updating status:', error);
      } finally {
        localStorage.clear();
      }
    };

    window.addEventListener('beforeunload', handlePageClose);

    return () => {
      window.removeEventListener('beforeunload', handlePageClose);
    };
  }
  }, []);

  return null; // This component doesn't render anything
};

export default UpdateStatusOnClose