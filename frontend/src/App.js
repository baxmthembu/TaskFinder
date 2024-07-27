
/*import Youtube from './Components/Youtube/youtube';*/
import SearchJobs from './Components/SearchBar/searchbar'
import Data from "./users.json";
import WorkerRegister from './Worker/Register/workerRegister';
import './App.css';
import { Routes, Route, BrowserRouter as Router} from 'react-router-dom';
import Register from './Components/Register/register';
import Login from './Components/Login/login';
import { ToastContainer } from 'react-toastify';
import Plumber from './Components/Home/home';
import Profile from './Components/Profile/profile';
import About from './Components/About/about';
import ClientComponent from './Components/Home2/home2';
import { Switch } from '@mui/material';
import Footers from './Components/Footer/footer'
import FreelancerComponent from './WorkerHome/workerhome';
import FreelancerLocationTracker from './WorkerHome/workerhome';
import MapContainer from './Components/MapComponent/map';
//import Chat from './Components/Message/message2';
import Chat from './Chat';
import WorkerLogin from './Worker/Login/worker_login';
import Logout from './Worker/Logout/logout';
import FreelancerHome from './Worker/FreelancerHome/freelancerhome';
import {UserProvider} from './UserContext';
import { FreelancerProvider } from './Worker/FreelancerContext';

function App() {
    return (
      <>
        <ToastContainer position="top-center" theme='colored' />
        <div>
          <body>  
          <UserProvider>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/searchbar" element={<SearchJobs data={Data} />} />
                <Route path="/register" element={<Register />} />    
                <Route path='/home' element={<Plumber />} />
                <Route path='/about' element={<About />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/workerRegister' element={<WorkerRegister />} />
                <Route path='/workerhome' element={<FreelancerLocationTracker/>} />
                <Route path='/home2' element={<ClientComponent />} />
                <Route path='/chat' element={<Chat />} />
                <Route path= '/worker_login' element={<WorkerLogin />} />
                <Route path='/worker_logout' element={<Logout />} />
                <Route path='/freelancerhome' element={<FreelancerHome />} />
              </Routes>
          </UserProvider>
          </body>
        </div>
      </>
    )
}


export default App;
