/*import React, { createContext, useState } from 'react';

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
};*/

import React, { createContext, useState, useEffect } from 'react';

const WorkerContext = createContext();

const WorkerProvider = ({ children }) => {
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    const workerId = localStorage.getItem('workerId');
    if (workerId) {
      setWorker({id: workerId, role: 'freelancer'});
    }
  }, []);

  const updateUser = (newWorker) => {
    console.log('Setting worker:', newWorker);  // Add this line to log user info
    setWorker(newWorker);
  };


  return (
    <WorkerContext.Provider value={{ worker, setWorker: updateUser }}>
      {children}
    </WorkerContext.Provider>
  );
};

export { WorkerContext, WorkerProvider };

