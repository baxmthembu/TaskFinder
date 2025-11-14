import { Link } from "react-router-dom"
import './navigator.css';
import logo from "./Images/taskaroo.svg"

const Navigator = () => {

    return(
        <>
        {/* Rebranding Announcement Banner */}
        <div className="bg-teal-200 text-white text-center py-3 px-4 relative z-50">
            <p className="text-sm font-medium">
                🎉 <strong>Taskify has rebranded to Taskaroo</strong> 🎉
            </p>
        </div>
        
        <div className="navigator-container">
            <div className="navigator-header">
                <img src={logo} alt="logo" className="navigator-image"/>
                <h1>Are you a <Link to='/login'>Client</Link> or <Link to='/worker_login'>Freelancer</Link>.</h1>
            </div>
        </div>
        </>
    )
}

export default Navigator