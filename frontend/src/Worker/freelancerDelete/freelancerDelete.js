/*import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import './freelancerDelete.css';

const Freelancers = () => {
    const [freelancers, setFreelancers] = useState([]);
    const navigate = useNavigate();

    // Fetch freelancers from the backend
    useEffect(() => {
        const fetchFreelancers = async () => {
            try {
                const response = await Axios.get('http://localhost:3001/freelancers');
                setFreelancers(response.data);
            } catch (error) {
                console.error('Error fetching freelancers:', error);
            }
        };

        fetchFreelancers();
    }, []);

    // Handle deletion of freelancer
    const handleDelete = async (freelancerId) => {
        try {
            const response = await Axios.delete(`http://localhost:3001/freelancers/${freelancerId}`);

            if (response.status === 200) {
                // Remove the deleted freelancer from the local state
                setFreelancers((prevFreelancers) =>
                    prevFreelancers.filter((freelancer) => freelancer.id !== freelancerId)
                );
                alert('Freelancer deleted successfully');
            } else {
                console.error('Failed to delete freelancer');
            }
        } catch (error) {
            console.error('Error deleting freelancer:', error);
            alert('Failed to delete freelancer. Try again later.');
        }
    };

    return (
        <div className="freelancers-container">
            <div className="freelancer-list">
                    {freelancers.map((freelancer) => (
                        <div key={freelancer.id} className="freelancer-card">
                            <p>{freelancer.name}</p>
                            <button
                                className="button-77"
                                onClick={() => handleDelete(freelancer.id)}
                            >
                                Delete Account
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Freelancers;*/

import React from 'react';
import Axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Freelancers = () => {
    const navigate = useNavigate()
  const handleDelete = async () => {
    const freelancerId = localStorage.getItem('id'); // Fetch the freelancer's ID from localStorage

    if (!freelancerId) {
      alert('Freelancer ID not found');
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete all your information? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      const response = await Axios.delete(`http://localhost:3001/freelancers/${freelancerId}`);

      if (response.status === 200) {
        alert('Your information has been deleted successfully.');
        localStorage.clear(); // Optional: Clear the ID from localStorage
        // Optional: Redirect the user or update UI
        navigate('/')
      }
    } catch (error) {
      console.error('Error deleting freelancer:', error);
      alert('An error occurred while trying to delete your information.');
    }
  };

  return (
    <button onClick={handleDelete} style={{ background: 'red', color: 'white', padding: '10px' }}>
      Delete My Information
    </button>
  );
};

export default Freelancers;

