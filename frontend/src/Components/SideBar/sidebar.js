import React, { useState } from 'react';
import { useNavigate, Link, Route, NavLink } from 'react-router-dom';
import'./sidebar.css'
import { elastic as Menu } from 'react-burger-menu';
import Logout from '../../Worker/Logout/logout'

const Sidebar = () => {

  return (
    <div>
      <div className='bm-burger-button'>
      <div className='bm-burger-bars' ></div>
      </div>
    <Menu>
    <div className='menu'>
      <ul style={{ listStyle: 'none', padding: 0 }} className='menu'>
        <li>
          <Link to="/home" className='menu-item'>Home</Link>
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
      </ul>
    </div>
    </Menu> 
    </div>
  );
};

export default Sidebar;






