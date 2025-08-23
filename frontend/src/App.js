import { UserProvider } from "./UserContext";
import AuthProvider from "./provider/AuthProvider";
import Routes from "./routes/routes";
import './App.css'
import UpdateStatusOnClose from "./Worker/close_page";
import ClearStorage from "./Components/ClearStorage/clear_storage";



function App(){
  return(
    <AuthProvider>
        <UserProvider>
          <ClearStorage />
          <UpdateStatusOnClose />
          <Routes />
        </UserProvider>
    </AuthProvider>
  )
}


export default App;
