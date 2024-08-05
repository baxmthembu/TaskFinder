import React from "react";
import About from "../../Components/About/about";
import Sidebar from "../Freelancer_Sidebar/freelancer_sidebar";
import './freelancerabout.css'

const logo = require('./../../Components/Images/TalentTrove.png');
const cooking = require('./../../Components/Images/cooking_1830839.png');
const grass = require('./../../Components/Images/grass_5617791.png');
const plumber = require('./../../Components/Images/plumber-man_5054602.png');
const queue = require('./../../Components/Images/queue.png');

export const FreelancerAbout = () => {

    return (
        <>
            <header className='header'>
                <Sidebar />
                <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px" }}>
                    <img src={logo} alt="TalentTrove Logo" />
                </div>
            </header>
            <div className='body_container'>
                <div className='About'>
                    <h1>About</h1>
                    <p>
                        Our app empowers freelancers by providing a dynamic platform to connect with clients seeking a variety of services. From basic household chores and daily errands to specialized tasks like cooking and accounting, freelancers can showcase their skills and find opportunities that match their expertise. By facilitating seamless connections between skilled professionals and clients in need, our app helps freelancers grow their businesses, reach new clients, and handle tasks with confidence and proficiency.
                    </p>
                </div>
                <div className='card_container'>
                    <div className='card'>
                        <div className='cards_inner'>
                            <img src={cooking} alt="Private Chef" style={{ width: '50%' }} />
                        </div>
                        <div className='cards_inner'>
                            <img src={grass} alt="Mowing lawn" style={{ width: '50%' }} />
                        </div>
                        <div className='cards_inner'>
                            <img src={plumber} alt="Plumber" style={{ width: '50%' }} />
                        </div>
                        <div className='cards_inner'>
                            <img src={queue} alt="Queuing" style={{ width: '50%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default FreelancerAbout