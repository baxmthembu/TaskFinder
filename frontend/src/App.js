import {AuthProvider} from "./provider/authProvider";
import Routes from "./routes/routes";
import './App.css'
import ClearStorage from "./Components/ClearStorage/clear_storage";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App(){
  return(
    <AuthProvider>
        <ClearStorage />
        <ToastContainer />
        <Routes />
    </AuthProvider>
  )
}


export default App;
