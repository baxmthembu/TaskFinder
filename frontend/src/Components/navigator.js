import { Link } from "react-router-dom"
import './navigator.css';
import logo from "./Images/taskaroo.svg"

const Navigator = () => {

    return(
        <>
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