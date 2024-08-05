import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
      if(userId){
      setUser({id: userId, role:'client'});
    }
  }, []);

  const updateUser = (newUser) => {
    console.log('Setting user:', newUser);  // Add this line to log user info
    setUser(newUser);
  };


  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
