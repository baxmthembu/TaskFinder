import React from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './freelancerDelete.module.css'

const Freelancers = () => {
    const navigate = useNavigate()
  const handleDelete = async () => {
    const freelancerId = localStorage.getItem('id'); // Fetch the freelancer's ID from localStorage
    const clientId = localStorage.getItem('id')

    if (!freelancerId) {
      alert('Freelancer ID not found');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete all your information? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      if(freelancerId.role === 'freelancer'){
      const response = await Axios.delete(`http://localhost:3001/freelancers/${freelancerId}`);
      if (response.status === 200) {
        alert('Your information has been deleted successfully.');
        localStorage.clear(); // Optional: Clear the ID from localStorage
        // Optional: Redirect the user or update UI
        navigate('/')
      }
      }else{
        const response = await Axios.delete(`http://localhost:3001/clients/${clientId}`);
        if (response.status === 200) {
          alert('Your information has been deleted successfully.');
          localStorage.clear(); // Optional: Clear the ID from localStorage
          // Optional: Redirect the user or update UI
          navigate('/')
      }
    } 
  }catch (error) {
    console.error('Error deleting freelancer:', error);
    alert('An error occurred while trying to delete your information.');
  }
};

  return (
    <button onClick={handleDelete} className={styles.button}>
      Delete
    </button>
  );
};

export default Freelancers;
/* CSS */
