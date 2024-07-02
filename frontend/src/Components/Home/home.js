/*import React, {useState, useEffect, useContext} from 'react';

import { useNavigate, Link } from 'react-router-dom';
import '../Home/plumber.css';
import StarRating from '../SearchBar/starrating';
import SideBar from '../SideBar/sidebar';
import  PayPal from '../Paypal/paypal'*/




/*const Plumber = (/*{placeholder,data}*props) => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('starRating');
    const [showMessageButton, setShowMessageButton] = useState(true);


    useEffect(() => {
        const getData = async () => {
          try {
            const response = await fetch('http://localhost:3001/workers');
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
    
            const data = await response.json();
            console.log(data)
            setData(data);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
    
        getData();
      }, []);


    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    // Sorting function for name (A-Z)
    const sortByName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    // Sorting function for starRating (high to low)
    const sortByStarRating = (a, b) => b.rating - a.rating;

    const sortedData = [...data].sort(
        sortBy === 'name' ? sortByName : sortByStarRating
    );

    const handlePayButtonClick = () => {
        // Hide the message button when pay button is clicked
        setShowMessageButton(false);
        // Add your pay button logic here
      };

    const logo = require("../Images/logos.png")
    const logo1 = require("../Images/logo.png")

    return(
    <>
    <div className="body-container">   
        <header>
        <aside><SideBar pageWrapId={'page-wrap'} outerContainerId={'outer-container'} /></aside>
        <div className='image' style={{textAlign: 'right', position: "relative", top: "-1em", right: "36px"}}>
            <img src={logo1} />
        </div>
        </header>
        <body>
        <div className='searchbar'>
            <input type="text" id="search" placeholder="Search for service" onChange={(event) => {
                setSearchTerm(event.target.value);
            }} />
        </div>
        <label className = 'sorting'>
                Sort By:
                <select value={sortBy} onChange={handleSortChange}>
                <option value='starRating'>Star Rating (High to Low)</option>
                <option value='name'>Name (A-Z)</option>
                </select>
        </label>
        <div className='container'>
            {sortedData.filter((value) => {
                if(searchTerm === "") {
                    return value
                }else if(value.occupation.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return value
                }
            })
                .map((value,key) => {
                    return (
                        <div className='card_item' key={value.id}>
                            {/*{value.images && (<img src={`data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(value.images)) )}`}alt="Worker"/>)}*/
                            /*<img src={`data:image/jpeg;base64,${value.images}`} alt="User" />*                        
                            <div className='card_inner'>
                                <img src={'http://localhost:3001/images/' + value.images} alt='avatar' /><br />                                
                                <div className='userName'>{value.name} {value.surname}</div>
                                <div className='userJob'>{value.occupation}</div>
                                <div className='userNumber'>{value.phone}</div>
                                <div className='detail-box'>
                                    <StarRating />
                                </div>
                                <div className='buttons'> 
                                    <PayPal onClick={handlePayButtonClick}/>
                                    <Link to="/message2"><button className='button' >Message</button></Link>
                                </div>
                            </div>  
                        </div>
                    )
                })
            }
        </div>
        </body>
    </div>
    </>
    );
}

export default Plumber*/

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SideBar from '../SideBar/sidebar'; // Assuming you have a SideBar component
import PayPal from '../Paypal/paypal'; // Assuming you have a PayPal component
import StarRating from '../SearchBar/starrating'; // Assuming you have a StarRating component
import '../Home/plumber.css'

const Plumber = (props) => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState('starRating');
    const [showMessageButton, setShowMessageButton] = useState(true);

    useEffect(() => {
        const getData = async () => {
            try {
                const response = await fetch('http://localhost:3001/workers');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                console.log(data)
                setData(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        getData();

        const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setData(prevFreelancers => prevFreelancers.map(freelancer => 
        freelancer.id === message.freelancerId 
          ? { ...freelancer, isavailable: message.isAvailable } 
          : freelancer
      ));
    };

    return () => {
      ws.close();
    };
    }, []);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const sortByName = (a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    };

    const sortByStarRating = (a, b) => b.rating - a.rating;

    const sortedData = [...data].sort(
        sortBy === 'name' ? sortByName : sortByStarRating
    );

    const handlePayButtonClick = () => {
        setShowMessageButton(false);
    };

    const logo1 = require("../Images/logo.png");

    return (
        <>
            <div className="body-container">
                <header>
                    <aside><SideBar pageWrapId={'page-wrap'} outerContainerId={'outer-container'} /></aside>
                    <div className='image' style={{ textAlign: 'right', position: "relative", top: "-1em", right: "36px" }}>
                        <img src={logo1} />
                    </div>
                </header>
                <body>
                    <div className='searchbar'>
                        <input type="text" id="search" placeholder="Search for service" onChange={(event) => {
                            setSearchTerm(event.target.value);
                        }} />
                    </div>
                    <label className='sorting'>
                        Sort By:
                        <select value={sortBy} onChange={handleSortChange}>
                            <option value='starRating'>Star Rating (High to Low)</option>
                            <option value='name'>Name (A-Z)</option>
                        </select>
                    </label>
                    <div className='container'>
                        {sortedData.filter((value) => {
                            if (searchTerm === "") {
                                return value;
                            } else if (value.occupation.toLowerCase().includes(searchTerm.toLowerCase())) {
                                return value;
                            }
                        }).map((value, key) => {
                            return (
                                <div className='card_item' key={value.id}>
                                    <div className='card_inner'>
                                        <img src={'http://localhost:3001/images/' + value.images} alt='avatar' /><br />
                                        <div className='userName'>{value.name} {value.surname}</div>
                                        <div className='userJob'>{value.occupation}</div>
                                        <div className='userNumber'>{value.phone}</div>
                                        <div className='userStatus'>
                                            Status: {value.status}
                                            <span className={`status-button ${value.status === 'online' ? 'online' : 'offline'}`}></span>
                                        </div>
                                        <div className='availability'>
                                            Availability: {value.isavailable ? 'Available' : 'Not Available'}
                                        </div>
                                        <div className='detail-box'>
                                            <StarRating />
                                        </div>
                                        <div className='buttons'>
                                            <PayPal onClick={handlePayButtonClick} />
                                            <Link to={{
                                                pathname: "/chat",
                                                state: { workerId: value.id, workerName: value.name }
                                            }}>
                                                <button className='button' onClick={console.log(value.id)}>Message</button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </body>
            </div>
        </>
    );
};

export default Plumber;
