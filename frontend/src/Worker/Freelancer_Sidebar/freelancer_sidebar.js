import React, { useState } from 'react';
import { useNavigate, Link, Route, NavLink } from 'react-router-dom';
import'./freelancer_sidebar.css'
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
          <Link to="/freelancerhome" className='menu-item'>Home</Link>
        </li>
        <li>
          <Link to="/freelancer_about" className='menu-item'>About</Link>
        </li>
        <li>
          <Link to=
          "/freelancerprofile" className='menu-item'>Profile</Link>
        </li>
        <li className='logout'>
          <Logout className='menu-items' />
        </li>
      </ul>
    </div>
    </Menu> 
    </div>
  );
};

export default Sidebar;
