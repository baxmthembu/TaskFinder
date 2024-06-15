// Footer.js

import React from 'react';
import { AiFillFacebook, AiFillTwitterCircle, AiFillInstagram } from 'react-icons/ai';

// Footer.js

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <p>&copy; 2024 Your App Name. All rights reserved.</p>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: '#333',
  color: '#fff',
  textAlign: 'center',
  padding: '1rem',
  marginTop: 'auto', // Set margin-top to 'auto' to push the footer to the bottom
};

export default Footer;
