import React, { createContext, useState } from 'react';

export const FreelancerContext = createContext();

export const FreelancerProvider = ({ children }) => {
    const [freelancers, setFreelancers] = useState([]);

    const updateAvailability = (id, isAvailable) => {
        setFreelancers(prevFreelancers => prevFreelancers.map(freelancer =>
            freelancer.id === id ? { ...freelancer, isAvailable } : freelancer
        ));
    };

    return (
        <FreelancerContext.Provider value={{ freelancers, setFreelancers, updateAvailability }}>
            {children}
        </FreelancerContext.Provider>
    );
};
