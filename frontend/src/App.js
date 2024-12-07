import React, {useEffect} from "react";
import { UserProvider } from "./UserContext";
import AuthProvider from "./provider/AuthProvider";
import Routes from "./routes/routes";
import Axios from "axios";
import './App.css'
import UpdateStatusOnClose from "./Worker/close_page";

function App(){
  //UseEffect hook attaches an event listener for the beforeunload event which triggers when the user attempts to close the page or browser
  //handleBeforeUnload function clears all the necessary items from my localstorage
  //beforeunload event ensures that the data is cleared before the page closes
  //localstorage will not be cleared if user reloads page
  /*useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear specific keys from localStorage when the page is closed
      localStorage.removeItem('id');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);*/

  return(
    <AuthProvider>
        <UserProvider>
          <UpdateStatusOnClose />
          <Routes />
        </UserProvider>
    </AuthProvider>
  )
}


export default App;
