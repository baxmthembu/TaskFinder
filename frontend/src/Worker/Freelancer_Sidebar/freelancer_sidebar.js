import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './freelancer_sidebar.css';
import { elastic as Menu } from 'react-burger-menu';
import Logout from '../../Worker/Logout/logout';
import { right } from '@popperjs/core';

const Sidebar = () => {
  const [role, setRole] = useState(null);
  const linksForDefault = [
  { path: '/login', label: 'Login' },
  { path: '/register', label: 'Register' }
  ];

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole || 'default'); // Fetch the role from localStorage
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

  const links = useMemo(() => {
  if (role === 'client') return linksForClient;
  if (role === 'freelancer') return linksForFreelancer;
  return linksForDefault;
}, [role]);

  return (
  <div>
    {/*<div className="bm-burger-button"></div>
      <div className="bm-burger-bars"></div>*/}
    <Menu
    right
    customBurgerIcon={false}
    styles={burgerMenuStyles}>
      <div className="menu">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {renderLinks(links)}
          {role && ( // Only show logout if authenticated
            <li className="logout">
              <Logout className="menu-items" />
            </li>
          )}
        </ul>
      </div>
    </Menu>
  </div>
);
};

const burgerMenuStyles = {
  bmBurgerButton: {
    position: 'fixed',
    width: '36px',
    height: '30px',
    right: '36px',
    top: '36px'
  },
  bmBurgerBars: {
    background: '#373a47'
  },
  bmBurgerBarsHover: {
    background: '#44d7ca'
  }
};

export default Sidebar;
