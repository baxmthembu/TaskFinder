import { useEffect } from 'react';
import Axios from 'axios';

const UpdateStatusOnClose = () => {
  useEffect(() => {
    const handlePageClose = async (event) => {
      const freelancerId = localStorage.getItem('id');

      if (!freelancerId) return;

      if (event.currentTarget.performance.navigation.type === 1) {
        try {
          await Axios.put(`http://localhost:3001/freelancers/${freelancerId}/status`, {
            status: 'offline',
            isavailable: false,
          });
        } catch (error) {
          console.error('Error updating freelancer status:', error);
        }finally{
          localStorage.clear()
        }
      }
    };

    window.addEventListener('unload', handlePageClose);

    return () => {
      window.removeEventListener('unload', handlePageClose);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default UpdateStatusOnClose;