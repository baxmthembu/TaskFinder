import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './freelancer_sidebar.css';
import { elastic as Menu } from 'react-burger-menu';
import Logout from '../../Worker/Logout/logout';
import Freelancers from '../freelancerDelete/freelancerDelete';

const Sidebar = () => {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole); // Fetch the role from localStorage
  }, []);
 
  //Links for client sidebar
  const linksForClient = [
    { path: '/home', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/profile', label: 'Profile' },
    {path: '/map', label: 'Map'}
  ];


  //Links for freelancer sidebar
  const linksForFreelancer = [
    { path: '/freelancerhome', label: 'Home' },
    { path: '/freelancer_about', label: 'About' },
    { path: '/freelancerprofile', label: 'Profile' },
  ];


  //renderLinks function to map throught the appropriate arrays and render Links components dynamically
  const renderLinks = (links) => {
    return links.map((link) => (
      <li key={link.path}>
        <Link to={link.path} className="menu-item">
          {link.label}
        </Link>
      </li>
    ));
  };

  return (
    <div>
      <div className="bm-burger-button">
        <div className="bm-burger-bars"></div>
      </div>
      <Menu>
        <div className="menu">
          {/*if the role is client link to linksForClient array and if role is equal to freelancer link to linksForFreelancers*/}
          <ul style={{ listStyle: 'none', padding: 0 }} className="menu">
            {role === 'client' && renderLinks(linksForClient)}
            {role === 'freelancer' && renderLinks(linksForFreelancer)}
            <li className="logout">
              <Logout className="menu-items" />
            </li>
            {/*{role === 'freelancer' && (
              <li className="delete">
                <Freelancers />
              </li>
            )}*/}
          </ul>
        </div>
      </Menu>
    </div>
  );
};

export default Sidebar;
