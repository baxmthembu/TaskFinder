import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('id');
    const role = localStorage.getItem('role')
      if(user && role){
      setUser({id: parseInt(user, 10), role});
    }
  }, []);

  const updateUser = (newUser) => {
    console.log('Setting user:', newUser);  // Add this line to log user info
    setUser(newUser);
    if (newUser?.id) {
      localStorage.setItem('id', newUser.id)
      localStorage.setItem('role', newUser.role)
    }
  };


  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };

