import { Link } from "react-router-dom"
import React from "react"
import './navigator.css'


const Navigator = () => {
    const image = require("./Images/Taskify.png")

    return(
        <>
        <div className="navigator-container">
            <div className="navigator-header">
                <img src={image} alt="logo" className="navigator-image"/>
                <h1>Are you a <Link to='/login'>Client</Link> or <Link to='/worker_login'>Freelancer</Link>.</h1>
            </div>
        </div>
        </>
    )
}

export default Navigator