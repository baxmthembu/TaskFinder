import React, { useState, useContext } from 'react';
import { useNavigate, Link, Route, NavLink } from 'react-router-dom';
import'./sidebar.css'
import { elastic as Menu } from 'react-burger-menu';
import Logout from '../../Worker/Logout/logout';
import { UserContext } from '../../UserContext';
import Freelancers from '../../Worker/freelancerDelete/freelancerDelete';
const Sidebar = () => {
  const { user } = useContext(UserContext); // Get user info from UserContext

  // Determine the home link based on the user role
  const homeLink = user?.role === 'freelancer' ? '/freelancerhome' : '/home';
  const aboutLink = user?.role === 'freelancer' ? '/freelancer_about' : '/about'


  return (
    <div>
      <div className='bm-burger-button'>
      <div className='bm-burger-bars' ></div>
      </div>
    <Menu>
    <div className='menu'>
      <ul style={{ listStyle: 'none', padding: 0 }} className='menu'>
        <li>
          <Link to={homeLink} className='menu-item'>Home</Link>
        </li>
        <li>
          <Link to="/about" className='menu-item'>About</Link>
        </li>
        <li>
          <Link to=
          "/profile" className='menu-item'>Profile</Link>
        </li>
        <li className='logout'>
          <Logout className='menu-items' />
        </li>
        <li>
          <Link to="/workerhome" className='menu-item'>Map</Link>
        </li>
        <li>
          <Freelancers className='menu-items' />
        </li>
      </ul>
    </div>
    </Menu> 
    </div>
  );
};

export default Sidebar;






